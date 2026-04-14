const EVO_URL = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? ''

// IDs de mensagens enviadas pelo bot — ignora o webhook fromMe de volta
const botSentIds = new Set<string>()

export function isBotSentMessage(messageId: string): boolean {
  if (botSentIds.has(messageId)) {
    botSentIds.delete(messageId)
    return true
  }
  return false
}

/** Retorna variantes do número para tentar quando Evolution API rejeita com exists:false */
function phoneVariants(phone: string): string[] {
  const base = phone.replace(/@s\.whatsapp\.net$/, '')
  const jid = `${base}@s.whatsapp.net`
  const plain = base
  // Número BR com 9 extra: 55 + DDD (2) + 9 + 8 dígitos = 13 dígitos
  if (/^55\d{2}9\d{8}$/.test(base)) {
    const without9 = `${base.slice(0, 4)}${base.slice(5)}`
    return [jid, plain, without9, `${without9}@s.whatsapp.net`]
  }
  return [jid, plain]
}

export async function sendMessage(instance: string, phone: string, text: string): Promise<void> {
  const variants = phoneVariants(phone)
  let lastError = ''

  for (const number of variants) {
    const res = await fetch(`${EVO_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVO_KEY,
      },
      body: JSON.stringify({ number, text }),
    })

    if (res.ok) {
      try {
        const data = await res.clone().json() as { key?: { id?: string }; message?: { key?: { id?: string } } }
        const id = data?.key?.id ?? data?.message?.key?.id
        if (id) botSentIds.add(id)
        if (botSentIds.size > 1000) {
          const first = botSentIds.values().next().value
          if (first) botSentIds.delete(first)
        }
      } catch { /* não crítico */ }
      return
    }

    const body = await res.text()
    lastError = `Evolution API ${res.status}: ${body}`
    // Se não for erro de "exists: false", não tenta a próxima variante
    if (!body.includes('exists')) break
  }

  throw new Error(lastError)
}

export async function sendImage(instance: string, phone: string, imageUrl: string, caption?: string): Promise<void> {
  const variants = phoneVariants(phone)
  for (const number of variants) {
    const res = await fetch(`${EVO_URL}/message/sendMedia/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number, mediatype: 'image', media: imageUrl, caption: caption ?? '' }),
    })
    if (res.ok) {
      try {
        const data = await res.clone().json() as { key?: { id?: string } }
        const id = data?.key?.id
        if (id) botSentIds.add(id)
      } catch { /* não crítico */ }
      return
    }
    const body = await res.text()
    if (!body.includes('exists')) break
  }
}

export async function markAsRead(instance: string, remoteJid: string, messageId: string): Promise<void> {
  await fetch(`${EVO_URL}/chat/markMessageAsRead/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({ readMessages: [{ remoteJid, fromMe: false, id: messageId }] }),
  }).catch(() => { /* não crítico */ })
}

export async function downloadMedia(instance: string, messageId: string, remoteJid: string): Promise<string> {
  const res = await fetch(`${EVO_URL}/chat/getBase64FromMediaMessage/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({
      message: { key: { remoteJid, fromMe: false, id: messageId } },
      convertToMp4: false,
    }),
  }).catch(() => null)
  if (!res?.ok) return ''
  const data = await res.json() as { base64?: string; message?: { base64?: string } }
  return data?.base64 ?? data?.message?.base64 ?? ''
}

export async function sendReply(
  instance: string,
  phone: string,
  remoteJid: string,
  quotedMessageId: string,
  text: string,
): Promise<void> {
  const variants = phoneVariants(phone)
  for (const number of variants) {
    const res = await fetch(`${EVO_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number, text, quoted: { key: { remoteJid, fromMe: false, id: quotedMessageId } } }),
    }).catch(() => null)
    if (res?.ok) {
      try {
        const data = await res.clone().json() as { key?: { id?: string } }
        const id = data?.key?.id
        if (id) botSentIds.add(id)
      } catch { /* não crítico */ }
      return
    }
    const body = await res?.text() ?? ''
    if (!body.includes('exists')) break
  }
}

/**
 * Dispara "Digitando..." uma única vez — sem loop.
 * Usado antes de cada bloco de texto, com await de duração proporcional.
 */
export async function sendPresenceOnce(instance: string, remoteJid: string): Promise<void> {
  await fetch(`${EVO_URL}/chat/sendPresence/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({ number: remoteJid, presence: 'composing', delay: 0 }),
  }).catch(() => { /* não crítico */ })
}
