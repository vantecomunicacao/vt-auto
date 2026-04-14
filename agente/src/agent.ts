import OpenAI from 'openai'
import { randomUUID } from 'crypto'
import { safeDecrypt } from './crypto'
import { supabase } from './db'
import { logStep } from './logger'
import { sendMessage, sendImage, sendPresenceOnce, downloadMedia } from './evolution'
import { searchKnowledge } from './rag'
import { getStockContext, getVehicleImages, findVehicleId, searchVehicles } from './vehicles'

// ── Quebra resposta em partes humanizadas ────────────────────────────────────
export function splitAtWords(text: string, maxLen: number): string[] {
  const words = text.split(' ')
  const chunks: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxLen && current) {
      chunks.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) chunks.push(current)
  return chunks
}

export function splitMessage(text: string, maxLen: number): string[] {
  const result: string[] = []

  // 1. Divide por parágrafo (\n\n)
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)

  for (const para of paragraphs) {
    if (para.length <= maxLen) { result.push(para); continue }

    // 2. Tenta quebrar por linha simples (\n)
    const lines = para.split(/\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length > 1) {
      let current = ''
      for (const line of lines) {
        const candidate = current ? `${current}\n${line}` : line
        if (candidate.length > maxLen && current) {
          result.push(...splitAtWords(current, maxLen))
          current = line
        } else {
          current = candidate
        }
      }
      if (current) result.push(...splitAtWords(current, maxLen))
      continue
    }

    // 3. Quebra por sentença
    const sentences = para.split(/(?<=[.!?])\s+/)
    let current = ''
    for (const sentence of sentences) {
      const candidate = current ? `${current} ${sentence}` : sentence
      if (candidate.length > maxLen && current) {
        result.push(...splitAtWords(current, maxLen))
        current = sentence
      } else {
        current = candidate
      }
    }
    if (current) result.push(...splitAtWords(current, maxLen))
  }

  return result.length > 0 ? result : [text]
}

export const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: 'Use linguagem profissional e formal.',
  friendly: 'Use linguagem amigável e calorosa.',
  casual: 'Use linguagem casual e descontraída.',
}

// ── Deduplicação — ignora messageId já processado ────────────────────────────
const processedIds = new Set<string>()

// ── Debounce — agrupa mensagens enviadas em sequência ────────────────────────
const debounceTimers = new Map<string, NodeJS.Timeout>()
const pendingMessages = new Map<string, string[]>()
// Cache de delay por instance (evita DB a cada mensagem)
const debounceCache = new Map<string, { ms: number; expiresAt: number }>()

interface IncomingMessage {
  instance: string
  phone: string
  message: string
  pushName?: string
  messageId?: string
}


interface IncomingMedia {
  instance: string
  phone: string
  remoteJid: string
  pushName?: string
  messageId: string
  mediaType: 'audio' | 'image'
  caption?: string
}

export function enqueueMessage(params: IncomingMessage): void {
  if (params.messageId) {
    // Chave única por instância + messageId (mesma mensagem pode chegar de instâncias diferentes)
    const dedupKey = `${params.instance}:${params.messageId}`
    if (processedIds.has(dedupKey)) return
    processedIds.add(dedupKey)
    if (processedIds.size > 5000) {
      const first = processedIds.values().next().value
      if (first) processedIds.delete(first)
    }
  }

  const key = `${params.instance}:${params.phone}`
  const existing = pendingMessages.get(key) ?? []
  existing.push(params.message)
  pendingMessages.set(key, existing)

  const old = debounceTimers.get(key)
  if (old) clearTimeout(old)

  // Resolve delay: usa cache de 5 min para não bater no banco a cada mensagem
  async function getDelayMs(): Promise<number> {
    const cached = debounceCache.get(params.instance)
    if (cached && cached.expiresAt > Date.now()) return cached.ms
    const { data } = await supabase
      .from('stores')
      .select('agent_debounce_seconds')
      .eq('whatsapp_instance', params.instance)
      .single()
    const ms = ((data?.agent_debounce_seconds as number | null) ?? 3) * 1000
    debounceCache.set(params.instance, { ms, expiresAt: Date.now() + 5 * 60 * 1000 })
    return ms
  }

  // Inicia com delay padrão; ajusta se o cache já tiver o valor
  const cachedNow = debounceCache.get(params.instance)
  const initialDelay = cachedNow && cachedNow.expiresAt > Date.now() ? cachedNow.ms : 3000

  const timer = setTimeout(async () => {
    debounceTimers.delete(key)
    const messages = pendingMessages.get(key) ?? []
    pendingMessages.delete(key)
    await processMessage({ ...params, message: messages.join('\n') }).catch(console.error)
  }, initialDelay)

  // Atualiza o delay no cache de forma assíncrona para as próximas mensagens
  getDelayMs().catch(() => {})

  debounceTimers.set(key, timer)
}

export async function enqueueMedia(params: IncomingMedia): Promise<void> {
  const dedupKey = `${params.instance}:${params.messageId}`
  if (processedIds.has(dedupKey)) return
  processedIds.add(dedupKey)

  const sessionId = randomUUID()

  // Busca loja para obter API key e image prompt
  const { data: store } = await supabase
    .from('stores')
    .select('id, openai_api_key, agent_active, whatsapp_instance, agent_image_prompt')
    .eq('whatsapp_instance', params.instance)
    .single()

  if (!store?.openai_api_key || !store.agent_active) return

  await logStep({ store_id: store.id, session_id: sessionId, phone: params.phone, step: 'webhook_received', status: 'ok', data: { mediaType: params.mediaType, instance: params.instance, push_name: params.pushName } })

  const openai = new OpenAI({ apiKey: safeDecrypt(store.openai_api_key) })
  let text = ''

  if (params.mediaType === 'audio') {
    const base64 = await downloadMedia(params.instance, params.messageId, params.remoteJid)
    if (!base64) {
      await logStep({ store_id: store.id, session_id: sessionId, phone: params.phone, step: 'media_download', status: 'error', data: { error: 'base64 vazio — Evolution API não retornou mídia' } })
      return
    }
    await logStep({ store_id: store.id, session_id: sessionId, phone: params.phone, step: 'media_download', status: 'ok', data: { bytes: base64.length } })
    try {
      const buffer = Buffer.from(base64, 'base64')
      const file = new File([buffer], 'audio.ogg', { type: 'audio/ogg' })
      const transcription = await openai.audio.transcriptions.create({ model: 'whisper-1', file })
      text = transcription.text
      await logStep({ store_id: store.id, session_id: sessionId, phone: params.phone, step: 'whisper_transcribed', status: 'ok', data: { text: text.slice(0, 120) } })
    } catch (err) {
      await logStep({ store_id: store.id, session_id: sessionId, phone: params.phone, step: 'whisper_transcribed', status: 'error', data: { error: err instanceof Error ? err.message : String(err) } })
      return
    }
  } else if (params.mediaType === 'image') {
    const base64 = await downloadMedia(params.instance, params.messageId, params.remoteJid)
    if (!base64) {
      await logStep({ store_id: store.id, session_id: sessionId, phone: params.phone, step: 'media_download', status: 'error', data: { error: 'base64 vazio — Evolution API não retornou mídia' } })
      return
    }
    await logStep({ store_id: store.id, session_id: sessionId, phone: params.phone, step: 'media_download', status: 'ok', data: { bytes: base64.length } })
    try {
      const imagePrompt = (store.agent_image_prompt as string | null) || 'O cliente enviou uma imagem. Descreva o que vê e responda de forma útil no contexto de venda de veículos.'
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: 'text', text: params.caption ? `${imagePrompt}\n\nLegenda do cliente: ${params.caption}` : imagePrompt },
          ],
        }],
        max_tokens: 300,
      })
      text = `[Imagem enviada pelo cliente] ${completion.choices[0].message.content ?? ''}`
      await logStep({ store_id: store.id, session_id: sessionId, phone: params.phone, step: 'vision_analyzed', status: 'ok', data: { text: text.slice(0, 120) } })
    } catch (err) {
      await logStep({ store_id: store.id, session_id: sessionId, phone: params.phone, step: 'vision_analyzed', status: 'error', data: { error: err instanceof Error ? err.message : String(err) } })
      return
    }
  }

  if (!text) return
  enqueueMessage({ instance: params.instance, phone: params.phone, message: text, pushName: params.pushName })
}

// ── Verifica horário de atendimento ─────────────────────────────────────────
export function isWithinHours(agentHours: Record<string, { start: string; end: string }> | null): boolean {
  if (!agentHours) return true
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const hours = agentHours[days[now.getDay()]]
  if (!hours) return false
  const [startH, startM] = hours.start.split(':').map(Number)
  const [endH, endM] = hours.end.split(':').map(Number)
  const cur = now.getHours() * 60 + now.getMinutes()
  return cur >= startH * 60 + startM && cur <= endH * 60 + endM
}

// ── Processamento principal ───────────────────────────────────────────────────
export async function processMessage({ instance, phone, message, pushName }: IncomingMessage): Promise<void> {
  const sessionId = randomUUID()

  // ── 1. Carregar loja ──────────────────────────────────────────────────────
  const t0 = Date.now()
  const { data: store, error: storeErr } = await supabase
    .from('stores')
    .select('id, agent_active, agent_name, agent_tone, agent_prompt, agent_hours, openai_api_key, openai_model, whatsapp_instance, agent_cooldown_minutes, notification_phone, agent_context_window, agent_max_message_chars, agent_end_prompt, agent_stop_on_end, agent_typing_speed_ms, agent_rate_limit')
    .eq('whatsapp_instance', instance)
    .single()

  if (storeErr || !store || !store.agent_active || !store.openai_api_key) return

  // ── 2. Verificar horário ──────────────────────────────────────────────────
  if (!isWithinHours(store.agent_hours as Record<string, { start: string; end: string }> | null)) {
    await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'webhook_received', status: 'ok', data: { skipped: 'fora do horário' }, duration_ms: Date.now() - t0 })
    return
  }

  await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'webhook_received', status: 'ok', data: { instance, push_name: pushName, message: message.slice(0, 120) }, duration_ms: Date.now() - t0 })

  // ── 3. Buscar/criar lead ──────────────────────────────────────────────────
  const t1 = Date.now()
  let { data: lead } = await supabase
    .from('leads')
    .select('id, ai_active, name, follow_up_count, last_human_message_at, vehicle_interest, budget, payment_method, trade_in')
    .eq('store_id', store.id)
    .eq('phone', phone)
    .single()

  if (!lead) {
    const { data: newLead } = await supabase.from('leads').upsert({
      store_id: store.id, phone, name: pushName ?? null, source: 'whatsapp', ai_active: true,
    }, { onConflict: 'store_id,phone', ignoreDuplicates: true })
      .select('id, ai_active, name, follow_up_count, last_human_message_at, vehicle_interest, budget, payment_method, trade_in').single()
    lead = newLead

    // Se upsert retornou vazio (conflito ignorado), busca o registro existente
    if (!lead) {
      const { data: existingLead } = await supabase.from('leads')
        .select('id, ai_active, name, follow_up_count, last_human_message_at, vehicle_interest, budget, payment_method, trade_in')
        .eq('store_id', store.id)
        .eq('phone', phone)
        .single()
      lead = existingLead
    }
  }

  if (!lead?.ai_active) {
    await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'webhook_received', status: 'ok', data: { skipped: 'IA desativada para este lead' }, duration_ms: Date.now() - t1 })
    return
  }

  // ── Cooldown após mensagem humana ─────────────────────────────────────────
  if (lead.last_human_message_at && store.agent_cooldown_minutes) {
    const cooldownMs = (store.agent_cooldown_minutes as number) * 60 * 1000
    const elapsed = Date.now() - new Date(lead.last_human_message_at as string).getTime()
    if (elapsed < cooldownMs) {
      await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'webhook_received', status: 'ok', data: { skipped: `cooldown ativo — ${Math.round((cooldownMs - elapsed) / 60000)} min restantes` }, duration_ms: Date.now() - t1 })
      return
    }
  }

  // ── Rate limit — evita loop infinito com lead spammando ──────────────────
  const rateLimit = (store.agent_rate_limit as number | null) ?? 20
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: messagesLastHour } = await supabase
    .from('agent_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', store.id)
    .eq('phone', phone)
    .eq('role', 'assistant')
    .gte('created_at', oneHourAgo)

  if ((messagesLastHour ?? 0) >= rateLimit) {
    await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'rate_limit', status: 'ok', data: { messages_last_hour: messagesLastHour, limit: rateLimit } })

    // Notifica o dono da loja via WhatsApp se tiver número configurado
    if (store.notification_phone && store.whatsapp_instance) {
      await sendMessage(
        store.whatsapp_instance,
        store.notification_phone,
        `⚠️ *Rate limit atingido*\n\nO lead *${phone}* enviou ${messagesLastHour} mensagens na última hora (limite: ${rateLimit}).\n\nO agente foi pausado para este lead. Acesse o painel para revisar.`,
      ).catch(() => null)
    }

    // Pausa IA para este lead automaticamente
    await supabase.from('leads').update({ ai_active: false }).eq('id', lead.id)
    return
  }

  await supabase.from('leads').update({
    last_user_message_at: new Date().toISOString(),
    follow_up_count: 0,
    ...(pushName && !lead.name ? { name: pushName } : {}),
  }).eq('id', lead.id)

  // ── 4. Histórico ──────────────────────────────────────────────────────────
  const t2 = Date.now()
  const { data: history } = await supabase
    .from('agent_conversations')
    .select('role, content')
    .eq('store_id', store.id)
    .eq('phone', phone)
    .order('created_at', { ascending: true })
    .limit((store.agent_context_window as number | null) ?? 15)

  await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'history_loaded', status: 'ok', data: { messages_count: history?.length ?? 0 }, duration_ms: Date.now() - t2 })

  // ── 6. RAG + Resumo do estoque ───────────────────────────────────────────
  const t3 = Date.now()
  const openai = new OpenAI({ apiKey: safeDecrypt(store.openai_api_key) })

  // Classifica se a mensagem precisa de RAG antes de buscar
  let needsRag = false
  try {
    const classifyRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você decide se uma mensagem de cliente em uma concessionária precisa buscar na base de conhecimento (políticas, garantias, documentação, financiamento, procedimentos). Responda apenas "sim" ou "nao".' },
        { role: 'user', content: message },
      ],
      max_tokens: 5,
      temperature: 0,
    })
    needsRag = classifyRes.choices[0]?.message?.content?.trim().toLowerCase().startsWith('sim') ?? false
  } catch {
    // Se a classificação falhar, segue sem RAG (não interrompe o atendimento)
    needsRag = false
  }

  const [knowledge, stockSummary] = await Promise.all([
    needsRag ? searchKnowledge(store.id, message, safeDecrypt(store.openai_api_key)) : Promise.resolve(''),
    getStockContext(store.id, 200, 'summary'),
  ])
  await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'rag_search', status: 'ok', data: { needs_rag: needsRag, found: knowledge.length > 0, preview: knowledge.slice(0, 100) }, duration_ms: Date.now() - t3 })

  // ── 7. OpenAI com function calling ───────────────────────────────────────
  const t4 = Date.now()

  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })

  const leadContext = [
    lead?.vehicle_interest ? `- Interesse: ${lead.vehicle_interest}` : '',
    lead?.budget ? `- Orçamento: ${lead.budget}` : '',
    lead?.payment_method ? `- Forma de pagamento: ${lead.payment_method}` : '',
    lead?.trade_in ? `- Veículo para troca: ${lead.trade_in}` : '',
  ].filter(Boolean)

  const systemPrompt = [
    store.agent_prompt || 'Você é um assistente de vendas especializado em veículos.',
    TONE_INSTRUCTIONS[store.agent_tone as string] ?? '',
    `Seu nome é ${store.agent_name}. Agora são ${agora} (horário de Brasília).${pushName ? ` O cliente se chama ${pushName}.` : ''}`,

    leadContext.length > 0
      ? `## Contexto do cliente:\n${leadContext.join('\n')}\nUse essas informações para personalizar suas respostas. Foque no veículo de interesse, a menos que o cliente mude de assunto.`
      : '',

    knowledge
      ? `## Base de conhecimento:\n${knowledge}`
      : '',

    `${stockSummary}\n\nO estoque acima é um resumo. Sempre use a função buscar_veiculos para obter detalhes completos (preço, km, opcionais) antes de apresentar um veículo específico ao cliente. Nunca invente informações de veículos.`,

    'Quando detectar interesse em veículo específico, orçamento, forma de pagamento ou veículo para troca, chame a função registrar_qualificacao imediatamente.',

    'Se o cliente pedir para falar com humano, responda normalmente e inclua [TRANSBORDO_ATIVADO] invisível no final.',

    store.agent_end_prompt
      ? `O atendimento termina quando: ${store.agent_end_prompt}. Quando isso ocorrer, responda normalmente encerrando a conversa e inclua [CONVERSA_ENCERRADA] invisível no final da mensagem.`
      : '',

    'FORMATAÇÃO — CRÍTICO: Separe sempre os blocos da sua resposta com uma linha em branco entre eles. A descrição do veículo em um bloco, a pergunta em outro bloco separado. NUNCA use asteriscos (*), negrito (**texto**), itálico, títulos (#), marcadores de lista (- ou *), links formatados [texto](url), travessão (—) nem traço longo (–). Escreva como texto corrido, como uma pessoa real no WhatsApp.',
  ].filter(Boolean).join('\n\n')

  const qualifyTool: OpenAI.Chat.ChatCompletionTool = {
    type: 'function',
    function: {
      name: 'registrar_qualificacao',
      description: 'Registra dados de qualificação do lead detectados na conversa. Chame sempre que o cliente mencionar interesse em veículo, orçamento, forma de pagamento ou veículo para troca.',
      parameters: {
        type: 'object',
        properties: {
          vehicle_interest: { type: 'string', description: 'Veículo de interesse (ex: Hyundai HB20 2022)' },
          budget: { type: 'string', description: 'Orçamento mencionado (ex: 50000 ou 800/mes)' },
          payment_method: { type: 'string', description: 'Forma de pagamento (ex: financiamento, a vista, troca)' },
          trade_in: { type: 'string', description: 'Veículo para troca (ex: Gol 2019 1.0)' },
        },
      },
    },
  }

  const searchTool: OpenAI.Chat.ChatCompletionTool = {
    type: 'function',
    function: {
      name: 'buscar_veiculos',
      description: 'Busca veículos no estoque com filtros. Use para obter detalhes completos antes de apresentar um veículo ao cliente.',
      parameters: {
        type: 'object',
        properties: {
          marca: { type: 'string', description: 'Marca do veículo (ex: Hyundai, Toyota, Jeep)' },
          modelo: { type: 'string', description: 'Modelo do veículo (ex: HB20, Corolla, Compass)' },
          preco_min: { type: 'number', description: 'Preço mínimo em reais' },
          preco_max: { type: 'number', description: 'Preço máximo em reais' },
          ano_min: { type: 'number', description: 'Ano mínimo do veículo' },
          ano_max: { type: 'number', description: 'Ano máximo do veículo' },
          combustivel: { type: 'string', enum: ['flex', 'gasoline', 'diesel', 'electric', 'hybrid', 'gas'] },
          transmissao: { type: 'string', enum: ['manual', 'automatic', 'automated', 'cvt'] },
        },
      },
    },
  }

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(history ?? []).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content as string })),
    { role: 'user', content: message },
  ]

  let reply = ''
  let tokensIn = 0
  let tokensOut = 0
  let specificVehicleSearch: { marca: string; modelo: string } | null = null

  try {
    let completion = await openai.chat.completions.create({
      model: (store.openai_model as string) || 'gpt-4o-mini',
      messages: chatMessages,
      tools: [searchTool, qualifyTool],
      tool_choice: 'auto',
      max_tokens: 800,
    })

    // Processa tool calls (pode haver mais de uma: busca + qualificação)
    let toolCallCount = 0

    while (completion.choices[0]?.finish_reason === 'tool_calls' && toolCallCount < 5) {
      toolCallCount++
      const toolCalls = completion.choices[0]?.message.tool_calls ?? []
      chatMessages.push(completion.choices[0].message)

      for (const toolCall of toolCalls) {
        if (toolCall.function.name === 'buscar_veiculos') {
          const filters = JSON.parse(toolCall.function.arguments) as { marca?: string; modelo?: string; preco_min?: number; preco_max?: number; ano_min?: number; ano_max?: number; combustivel?: string; transmissao?: string }
          // Se buscou por marca ou modelo específico, marca para enviar fotos automaticamente
          if (filters.marca || filters.modelo) {
            specificVehicleSearch = { marca: filters.marca ?? '', modelo: filters.modelo ?? '' }
          }
          const searchResult = await searchVehicles(store.id, filters)
          await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'vehicle_search', status: 'ok', data: { filters, preview: searchResult.slice(0, 100) } })
          chatMessages.push({ role: 'tool', tool_call_id: toolCall.id, content: searchResult })
        }

        if (toolCall.function.name === 'registrar_qualificacao') {
          const qual = JSON.parse(toolCall.function.arguments) as { vehicle_interest?: string; budget?: string; payment_method?: string; trade_in?: string }
          if (lead) {
            const update: Record<string, string> = {}
            if (qual.vehicle_interest) update.vehicle_interest = qual.vehicle_interest
            if (qual.budget) update.budget = qual.budget
            if (qual.payment_method) update.payment_method = qual.payment_method
            if (qual.trade_in) update.trade_in = qual.trade_in
            if (Object.keys(update).length > 0) {
              await supabase.from('leads').update(update).eq('id', lead.id)
              await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'lead_qualified', status: 'ok', data: update })
            }
          }
          chatMessages.push({ role: 'tool', tool_call_id: toolCall.id, content: 'ok' })
        }
      }

      completion = await openai.chat.completions.create({
        model: (store.openai_model as string) || 'gpt-4o-mini',
        messages: chatMessages,
        tools: [searchTool, qualifyTool],
        tool_choice: 'auto',
        max_tokens: 800,
      })
    }

    reply = completion.choices[0]?.message.content ?? ''
    tokensIn = completion.usage?.prompt_tokens ?? 0
    tokensOut = completion.usage?.completion_tokens ?? 0

    await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'openai_called', status: 'ok', data: { model: store.openai_model, tokens_in: tokensIn, tokens_out: tokensOut, reply_raw: reply, system_prompt: systemPrompt.slice(0, 500) }, duration_ms: Date.now() - t4 })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'openai_called', status: 'error', data: { error: errMsg }, duration_ms: Date.now() - t4 })

    // Mensagem humanizada ao lead — não menciona tecnologia
    await sendMessage(
      instance,
      phone,
      `Olá! Estou verificando algumas informações e retorno em breve. Obrigado pela paciência.`,
    ).catch(() => null)

    // Detecta tipo de erro para notificação mais útil ao dono
    const isAuthError = errMsg.toLowerCase().includes('401') || errMsg.toLowerCase().includes('invalid api key') || errMsg.toLowerCase().includes('incorrect api key')
    const notifyMsg = isAuthError
      ? `🔴 *Erro no Agente — Chave OpenAI inválida*\n\nA chave de API OpenAI configurada está incorreta ou expirou.\n\nAcesse Agente de IA > Configurações e atualize a chave.\n\nLead afetado: ${phone}`
      : `🔴 *Erro no Agente — OpenAI indisponível*\n\nNão foi possível gerar resposta para o lead ${phone}.\n\nErro: ${errMsg.slice(0, 200)}\n\nO agente tentará responder normalmente na próxima mensagem.`

    if (store.notification_phone && store.whatsapp_instance) {
      await sendMessage(store.whatsapp_instance as string, store.notification_phone as string, notifyMsg).catch(() => null)
    }

    return
  }

  // ── 8. Marcadores + Fotos ────────────────────────────────────────────────
  const hasTransbordo = reply.includes('[TRANSBORDO_ATIVADO]')
  const hasEncerramento = reply.includes('[CONVERSA_ENCERRADA]')

  // Detecta marcador [FOTOS:marca:modelo] na resposta do modelo
  const fotosMatch = reply.match(/\[FOTOS:([^:]+):([^\]]+)\]/)
  const cleanReply = reply
    .replace(/\[TRANSBORDO_ATIVADO\]/g, '')
    .replace(/\[CONVERSA_ENCERRADA\]/g, '')
    .replace(/\[FOTOS:[^\]]+\]/g, '')
    .replace(/:\s*$/, '')
    .trim()

  if (hasTransbordo && lead) {
    await supabase.from('leads').update({ ai_active: false, status: 'in_progress', ai_paused_reason: 'transbordo' }).eq('id', lead.id)
    await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'transbordo', status: 'ok', data: { message: 'IA desativada — aguarda humano' } })

    if (store.notification_phone && store.whatsapp_instance) {
      const clientName = lead.name ?? phone
      const notifyMsg = `🔔 Atendimento aguardando humano\n\nCliente: ${clientName}\nTelefone: ${phone}\n\nO cliente pediu para falar com um atendente.`
      await sendMessage(store.whatsapp_instance as string, store.notification_phone as string, notifyMsg).catch(() => { /* não crítico */ })
    }
  }

  if (hasEncerramento && lead) {
    const stopOnEnd = store.agent_stop_on_end !== false // default true
    if (stopOnEnd) {
      await supabase.from('leads').update({ ai_active: false, status: 'qualified', ai_paused_reason: 'encerramento' }).eq('id', lead.id)
    }
    await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'conversa_encerrada', status: 'ok', data: { stop_on_end: stopOnEnd } })

    if (store.notification_phone && store.whatsapp_instance) {
      // Gera resumo inteligente da conversa via OpenAI
      const conversationText = [
        ...(history ?? []).map(h => `${h.role === 'user' ? 'Cliente' : 'Agente'}: ${h.content}`),
        `Cliente: ${message}`,
        `Agente: ${cleanReply}`,
      ].join('\n')

      let resumo = ''
      try {
        const resumoCompletion = await openai.chat.completions.create({
          model: (store.openai_model as string) || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente que analisa conversas de vendas de veículos e gera resumos objetivos para o vendedor. Responda sempre em português, sem usar negrito nem travessão.',
            },
            {
              role: 'user',
              content: `Analise a conversa abaixo e responda em formato de tópicos curtos:\n\n- Carro de interesse:\n- Intenção de compra (quente/morno/frio):\n- Forma de pagamento mencionada:\n- Veículo para troca (se houver):\n- Faixa de orçamento (se mencionada):\n- Resumo da conversa (2 a 3 frases):\n\nConversa:\n${conversationText}`,
            },
          ],
          max_tokens: 400,
        })
        resumo = resumoCompletion.choices[0]?.message?.content?.trim() ?? ''
      } catch (resumoErr) {
        resumo = 'Não foi possível gerar o resumo.'
        await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'conversa_encerrada', status: 'error', data: { error: resumoErr instanceof Error ? resumoErr.message : String(resumoErr) } })
      }

      const clientName = lead.name ?? phone
      const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      const notifyMsg = `✅ Atendimento encerrado\n\nCliente: ${clientName}\nTelefone: ${phone}\nData e hora: ${dataHora}\n\n${resumo}`
      await sendMessage(store.whatsapp_instance as string, store.notification_phone as string, notifyMsg).catch(() => { /* não crítico */ })
    }
  }

  // ── 9. Salvar conversa ────────────────────────────────────────────────────
  await supabase.from('agent_conversations').insert([
    { store_id: store.id, phone, role: 'user', content: message },
    { store_id: store.id, phone, role: 'assistant', content: cleanReply, tokens_in: tokensIn, tokens_out: tokensOut },
  ])

  // ── 10 + 11. Enviar resposta + fotos intercaladas ────────────────────────
  const t5 = Date.now()
  const maxChars = (store.agent_max_message_chars as number | null) ?? 300
  const typingSpeedMs = (store.agent_typing_speed_ms as number | null) ?? 20
  const chunks = splitMessage(cleanReply, maxChars)

  // Detecta fonte de fotos
  const sv = specificVehicleSearch
  const fotosSource = fotosMatch
    ? { brand: fotosMatch[1].trim(), model: fotosMatch[2].trim() }
    : sv
      ? { brand: sv.marca, model: sv.modelo }
      : null

  // Se há fotos a enviar: manda chunks iniciais → fotos → último chunk (pergunta)
  // Se não há fotos: manda todos os chunks normalmente
  const hasPhotos = fotosSource !== null
  // Separa o último parágrafo do cleanReply para enviar após as fotos
  const lastParaBreak = hasPhotos ? cleanReply.lastIndexOf('\n\n') : -1
  const bodyText = lastParaBreak > 0 ? cleanReply.slice(0, lastParaBreak).trim() : cleanReply
  const trailingText = lastParaBreak > 0 ? cleanReply.slice(lastParaBreak).trim() : null
  const bodyChunks = hasPhotos && trailingText ? splitMessage(bodyText, maxChars) : chunks
  const trailingChunk = hasPhotos && trailingText ? trailingText : null

  async function sendChunk(chunk: string) {
    const typingMs = chunk.length * typingSpeedMs
    await sendPresenceOnce(instance, `${phone}@s.whatsapp.net`)
    await new Promise(r => setTimeout(r, typingMs))
    await sendMessage(instance, phone, chunk)
  }

  try {
    for (let i = 0; i < bodyChunks.length; i++) {
      await sendChunk(bodyChunks[i])
      if (i < bodyChunks.length - 1) await new Promise(r => setTimeout(r, 400))
    }
    await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'response_sent', status: 'ok', data: { parts: chunks.length, reply: cleanReply.slice(0, 150) }, duration_ms: Date.now() - t5 })
  } catch (err) {
    await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'response_sent', status: 'error', data: { error: err instanceof Error ? err.message : String(err) }, duration_ms: Date.now() - t5 })
  }

  // Envia fotos
  if (fotosSource) {
    const { brand, model } = fotosSource
    const vehicleId = await findVehicleId(store.id, brand, model)
    if (vehicleId) {
      const images = await getVehicleImages(vehicleId)
      if (images.length === 0) {
        await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'photos_sent', status: 'error', data: { brand, model, error: 'Nenhuma imagem cadastrada para este veículo' } })
      } else {
        await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'photos_sent', status: 'ok', data: { brand, model, count: images.length, source: fotosMatch ? 'marker' : 'auto' } })
        for (const url of images) {
          await sendImage(instance, phone, url).catch(async (err) => {
            await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'photos_sent', status: 'error', data: { brand, model, url, error: err instanceof Error ? err.message : String(err) } })
          })
          await new Promise(r => setTimeout(r, 500))
        }
      }
    } else {
      await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'photos_sent', status: 'error', data: { brand, model, error: 'Veículo não encontrado no banco para envio de fotos' } })
    }
  }

  // Envia último chunk (pergunta) após as fotos
  if (trailingChunk) {
    await new Promise(r => setTimeout(r, 600))
    await sendChunk(trailingChunk).catch(async (err) => {
      await logStep({ store_id: store.id, session_id: sessionId, phone, step: 'response_sent', status: 'error', data: { error: err instanceof Error ? err.message : String(err), context: 'trailing_chunk' } })
    })
  }
}
