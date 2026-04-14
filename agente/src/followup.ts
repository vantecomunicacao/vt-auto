import { safeDecrypt } from './crypto'
import { supabase } from './db'
import { logStep } from './logger'
import { sendMessage, sendPresenceOnce } from './evolution'
import { splitMessage, TONE_INSTRUCTIONS } from './agent'
import { randomUUID } from 'crypto'
import OpenAI from 'openai'

interface FollowUpConfig {
  intervals: number[]
  messages: string[]  // prompts para o OpenAI
  max_attempts?: number  // teto global de follow-ups por lead
}

export async function runFollowUpCycle(): Promise<void> {
  const { data: stores } = await supabase
    .from('stores')
    .select('id, follow_up_enabled, follow_up_config, whatsapp_instance, openai_api_key, openai_model, agent_name, agent_tone, agent_prompt')
    .eq('agent_active', true)
    .eq('follow_up_enabled', true)

  if (!stores?.length) return

  for (const store of stores) {
    const config = store.follow_up_config as FollowUpConfig
    if (!config?.intervals?.length || !config?.messages?.length) continue
    if (!store.openai_api_key) continue

    const stepsCount = Math.min(config.intervals.length, config.messages.length)
    const maxAttempts = config.max_attempts ?? stepsCount
    const now = Date.now()

    const { data: leads } = await supabase
      .from('leads')
      .select('id, phone, name, follow_up_count, follow_up_total, last_user_message_at')
      .eq('store_id', store.id)
      .eq('ai_active', true)
      .lt('follow_up_total', maxAttempts)   // teto global
      .lt('follow_up_count', stepsCount)    // ciclo atual não concluído
      .not('last_user_message_at', 'is', null)

    if (!leads?.length) continue

    for (const lead of leads) {
      const timeSince = now - new Date(lead.last_user_message_at).getTime()
      const sentInCycle = lead.follow_up_count ?? 0  // posição no ciclo atual

      // O próximo step a enviar é sempre sentInCycle (em ordem)
      const dueIndex = sentInCycle
      if (dueIndex >= stepsCount) continue
      if (timeSince < config.intervals[dueIndex] * 60 * 1000) continue

      const followUpPrompt = config.messages[dueIndex]
      if (!followUpPrompt) continue

      // Atomic claim
      const { data: claimed } = await supabase
        .from('leads')
        .update({
          follow_up_count: sentInCycle + 1,
          follow_up_total: (lead.follow_up_total ?? 0) + 1,
          last_follow_up_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
        .eq('follow_up_count', sentInCycle)
        .select('id')

      if (!claimed?.length) continue

      const sessionId = randomUUID()
      const t = Date.now()

      try {
        // Busca histórico recente da conversa (últimas 10 mensagens)
        const { data: history } = await supabase
          .from('agent_conversations')
          .select('role, content')
          .eq('store_id', store.id)
          .eq('phone', lead.phone)
          .order('created_at', { ascending: false })
          .limit(10)

        const recentHistory = (history ?? []).reverse()

        // Valida que o lead enviou ao menos uma mensagem (não apenas recebeu boas-vindas)
        const leadSentMessage = recentHistory.some(h => h.role === 'user')
        if (!leadSentMessage) continue

        // Gera mensagem personalizada via OpenAI
        const openai = new OpenAI({ apiKey: safeDecrypt(store.openai_api_key) })

        const systemPrompt = [
          store.agent_prompt || 'Você é um assistente de vendas especializado em veículos.',
          TONE_INSTRUCTIONS[store.agent_tone as string] ?? '',
          `Seu nome é ${store.agent_name}.`,
          lead.name ? `O cliente se chama ${lead.name}.` : '',
          'Você está fazendo um follow-up. Escreva UMA mensagem curta, máximo 2 frases, sem listas, sem tópicos. Direto e natural como no WhatsApp.',
          `\nInstrução para este follow-up: ${followUpPrompt}`,
        ].filter(Boolean).join(' ')

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          ...recentHistory.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content as string })),
          { role: 'user', content: '[Sistema: gere a mensagem de follow-up baseada na instrução acima e no histórico da conversa]' },
        ]

        const completion = await openai.chat.completions.create({
          model: (store.openai_model as string) || 'gpt-4o-mini',
          messages,
          max_tokens: 80,
        })

        const message = completion.choices[0]?.message.content?.trim() ?? followUpPrompt

        if (store.whatsapp_instance) {
          const maxChars = 150
          const chunks = splitMessage(message, maxChars)
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            const typingMs = Math.min(Math.max(chunk.length * 25, 600), 2000)
            await sendPresenceOnce(store.whatsapp_instance, `${lead.phone}@s.whatsapp.net`)
            await new Promise(r => setTimeout(r, typingMs))
            await sendMessage(store.whatsapp_instance, lead.phone, chunk)
            if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 400))
          }
        }

        await supabase.from('agent_conversations').insert({
          store_id: store.id, phone: lead.phone, role: 'assistant', content: message,
        })

        await logStep({
          store_id: store.id, session_id: sessionId, phone: lead.phone,
          step: 'follow_up_sent', status: 'ok',
          data: { attempt: dueIndex + 1, message: message.slice(0, 100) },
          duration_ms: Date.now() - t,
        })
      } catch (err) {
        await logStep({
          store_id: store.id, session_id: sessionId, phone: lead.phone,
          step: 'follow_up_sent', status: 'error',
          data: { error: err instanceof Error ? err.message : String(err) },
          duration_ms: Date.now() - t,
        })
      }
    }
  }
}
