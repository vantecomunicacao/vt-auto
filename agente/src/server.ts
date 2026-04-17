import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { enqueueMessage, enqueueMedia } from './agent'
import { isBotSentMessage, markAsRead, sendReply, sendPresenceOnce } from './evolution'
import { streamLogsToClient } from './logger'
import { createOrGetQR, checkStatus, disconnectInstance, instanceName } from './whatsapp'
import { supabase } from './db'
import { addKnowledge, deleteKnowledge, listKnowledge } from './rag'
import { runFollowUpCycle } from './followup'
import { safeDecrypt } from './crypto'

// ── Tratamento Global de Erros ───────────────────────────────────────────────
// Evita que o processo morra em caso de exceções não tratadas em tarefas de fundo
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason)
})

async function getInstanceName(storeId: string): Promise<string> {
  const { data } = await supabase.from('stores').select('whatsapp_instance').eq('id', storeId).single()
  return data?.whatsapp_instance ?? instanceName(storeId)
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

const PORT = process.env.AGENT_PORT ?? 3001

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

// Deduplicação de mensagens não suportadas (Evolution envia 2x o mesmo messageId)
const unsupportedHandled = new Set<string>()

// ── Webhook Evolution API ─────────────────────────────────────────────────────
app.post('/webhook', (req, res) => {
  res.sendStatus(200)

  const body = req.body
  const instance: string = body.instance ?? ''

  const event: string = (body.event ?? '').toLowerCase().replace('.', '_')

  // CONNECTION_UPDATE — apenas loga, NÃO desliga o agente automaticamente
  if (event === 'connection_update') {
    const state: string = body.data?.state ?? ''
    console.log(`[agente] Status de conexão da instância ${instance}: ${state}`)
    // Removido o desligamento automático a pedido do usuário
    return
  }

  if (event !== 'messages_upsert') return

  const data = body.data
  if (!data) return

  const remoteJid: string = data.key?.remoteJid ?? ''
  // Ignora mensagens de grupos e broadcasts
  if (remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast')) return
  const phone: string | undefined = remoteJid.replace('@s.whatsapp.net', '') || undefined
  if (!phone) return

  const messageId: string = data.key?.id ?? ''

  // fromMe = mensagem enviada pelo próprio número (bot ou atendente humano)
  if (data.key?.fromMe === true) {
    // Se NÃO foi o bot que enviou, é um atendente humano — registra para cooldown
    if (messageId && phone && !isBotSentMessage(messageId)) {
      ;(async () => {
        const { data: storeRow } = await supabase.from('stores').select('id').eq('whatsapp_instance', instance).single()
        if (storeRow) {
          await supabase.from('leads')
            .update({ last_human_message_at: new Date().toISOString() })
            .eq('store_id', storeRow.id)
            .eq('phone', phone)
        }
      })().catch(console.error)
    }
    return
  }
  const messageType: string = data.messageType ?? ''


  // Marca como lida (usa instância real do Evolution API)
  if (messageId) markAsRead(instance, remoteJid, messageId)

  // Texto
  const textMessage: string | undefined =
    data.message?.conversation ??
    data.message?.extendedTextMessage?.text

  if (textMessage) {
    enqueueMessage({ instance, phone, message: textMessage, pushName: data.pushName, messageId })
    return
  }

  // Áudio
  if (messageType === 'audioMessage' && messageId) {
    enqueueMedia({ instance, phone, remoteJid, pushName: data.pushName, messageId, mediaType: 'audio' })
    return
  }

  // Imagem
  if (messageType === 'imageMessage' && messageId) {
    const caption = data.message?.imageMessage?.caption ?? ''
    enqueueMedia({ instance, phone, remoteJid, pushName: data.pushName, messageId, mediaType: 'image', caption })
    return
  }

  // Mídia não suportada (figurinha, vídeo, documento, etc.)
  const unsupportedTypes: Record<string, string> = {
    stickerMessage: 'figurinha',
    videoMessage: 'vídeo',
    documentMessage: 'documento/PDF',
    documentWithCaptionMessage: 'documento/PDF',
    contactMessage: 'contato',
    contactsArrayMessage: 'contato',
    locationMessage: 'localização',
    liveLocationMessage: 'localização',
    reactionMessage: '',       // reações: ignora silenciosamente
    pollCreationMessage: 'enquete',
    pollUpdateMessage: '',     // ignora silenciosamente
  }

  if (messageType in unsupportedTypes && messageId) {
    const label = unsupportedTypes[messageType]
    if (label && !unsupportedHandled.has(messageId)) {
      unsupportedHandled.add(messageId)
      if (unsupportedHandled.size > 1000) {
        const first = unsupportedHandled.values().next().value
        if (first) unsupportedHandled.delete(first)
      }
      // Não bloqueia o webhook — dispara sem await
      ;(async () => {
        const replyText = 'Poxa, não consigo receber esse tipo de mídia por aqui. Pode me enviar em texto ou áudio, por gentileza? 😊'

        // Delay humanizado antes de responder
        await sendPresenceOnce(instance, remoteJid)
        await new Promise(r => setTimeout(r, 2500 + Math.random() * 1500))

        await sendReply(instance, phone, remoteJid, messageId, replyText)

        // Registra no histórico da conversa
        const { data: store } = await supabase
          .from('stores').select('id').eq('whatsapp_instance', instance).single()
        if (!store) return

        const { data: lead } = await supabase
          .from('leads').select('id').eq('store_id', store.id).eq('phone', phone).single()
        if (!lead) return

        await supabase.from('agent_conversations').insert([
          { lead_id: lead.id, store_id: store.id, phone, role: 'user',      content: `[${label} enviado pelo cliente]` },
          { lead_id: lead.id, store_id: store.id, phone, role: 'assistant', content: replyText },
        ])
      })().catch(() => { /* não crítico */ })
    }
  }
})

// ── WhatsApp ──────────────────────────────────────────────────────────────────
app.get('/whatsapp/qr', async (req, res) => {
  const storeId = req.query.store_id as string
  if (!storeId) { res.sendStatus(400); return }
  try {
    const webhookUrl = `${process.env.PUBLIC_URL ?? `http://localhost:${PORT}`}/webhook`
    const instance = await getInstanceName(storeId)
    const data = await createOrGetQR(instance, webhookUrl)
    await supabase.from('stores').update({ whatsapp_instance: instance }).eq('id', storeId)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

// ── WhatsApp TESTE (instância separada, webhook local) ────────────────────────
// Usa store_<id>_test como nome de instância e aponta o webhook para localhost
app.get('/whatsapp/qr-test', async (req, res) => {
  const storeId = req.query.store_id as string
  if (!storeId) { res.sendStatus(400); return }
  if (!process.env.PUBLIC_URL) {
    res.status(400).json({ error: 'Configure PUBLIC_URL no agente/.env com a URL do ngrok antes de usar o WhatsApp Teste.' })
    return
  }
  try {
    const webhookUrl = `${process.env.PUBLIC_URL}/webhook`
    const instance = `${await getInstanceName(storeId)}_test`
    const data = await createOrGetQR(instance, webhookUrl)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.get('/whatsapp/status-test', async (req, res) => {
  const storeId = req.query.store_id as string
  if (!storeId) { res.sendStatus(400); return }
  try {
    const instance = `${await getInstanceName(storeId)}_test`
    res.json(await checkStatus(instance))
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.delete('/whatsapp/disconnect-test', async (req, res) => {
  const storeId = req.query.store_id as string
  if (!storeId) { res.sendStatus(400); return }
  try {
    const instance = `${await getInstanceName(storeId)}_test`
    await disconnectInstance(instance)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.get('/whatsapp/status', async (req, res) => {
  const storeId = req.query.store_id as string
  if (!storeId) { res.sendStatus(400); return }
  try {
    res.json(await checkStatus(await getInstanceName(storeId)))
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.delete('/whatsapp/disconnect', async (req, res) => {
  const storeId = req.query.store_id as string
  if (!storeId) { res.sendStatus(400); return }
  try {
    await disconnectInstance(await getInstanceName(storeId))
    await supabase.from('stores').update({ whatsapp_instance: null, agent_active: false }).eq('id', storeId)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

// ── Base de conhecimento ──────────────────────────────────────────────────────
app.get('/knowledge', async (req, res) => {
  const storeId = req.query.store_id as string
  if (!storeId) { res.sendStatus(400); return }
  try {
    res.json(await listKnowledge(storeId))
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.post('/knowledge', async (req, res) => {
  const { store_id, title, content } = req.body as { store_id: string; title: string; content: string }
  if (!store_id || !content) { res.sendStatus(400); return }

  // Busca a API key da loja
  const { data: store } = await supabase.from('stores').select('openai_api_key').eq('id', store_id).single()
  if (!store?.openai_api_key) {
    res.status(400).json({ error: 'Configure a API key OpenAI antes de adicionar conhecimento.' })
    return
  }

  try {
    await addKnowledge(store_id, title, content, safeDecrypt(store.openai_api_key))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.delete('/knowledge/:id', async (req, res) => {
  try {
    await deleteKnowledge(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

// ── Lead: toggle ai_active ────────────────────────────────────────────────────
app.patch('/leads/:id/ai', async (req, res) => {
  const { ai_active } = req.body as { ai_active: boolean }
  const { error } = await supabase.from('leads').update({ ai_active }).eq('id', req.params.id)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ ok: true })
})

// ── Logs: histórico paginado ──────────────────────────────────────────────────
app.get('/logs', async (req, res) => {
  const storeId = req.query.store_id as string
  const limit = Number(req.query.limit ?? 100)
  if (!storeId) { res.sendStatus(400); return }

  const { data } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit)

  res.json(data ?? [])
})

// ── SSE: stream de logs em tempo real ─────────────────────────────────────────
app.get('/logs/stream', (req, res) => {
  const storeId = req.query.store_id as string
  if (!storeId) { res.sendStatus(400); return }
  streamLogsToClient(storeId, res)
})

// ── Cron: follow-up a cada 5 minutos ─────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    runFollowUpCycle().catch(console.error)
  }, 5 * 60 * 1000)

  app.listen(PORT, () => {
    console.log(`[agente] Serviço rodando em http://localhost:${PORT}`)
  })
}

export default app
