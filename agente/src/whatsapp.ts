/**
 * Wrapper para a Evolution API
 * Cria instâncias, busca QR code e checa status de conexão
 */

const EVO_URL = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? ''

const headers = {
  'Content-Type': 'application/json',
  apikey: EVO_KEY,
}

export function instanceName(storeId: string): string {
  return `store_${storeId}`
}

export interface ConnectionStatus {
  connected: boolean
  qr?: string
  state?: string
}

async function configureWebhook(instance: string, webhookUrl: string): Promise<void> {
  await fetch(`${EVO_URL}/webhook/set/${instance}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      },
    }),
  }).catch(() => { /* não crítico */ })
}

export async function checkStatus(instance: string): Promise<ConnectionStatus> {
  const res = await fetch(`${EVO_URL}/instance/connectionState/${instance}`, { headers })

  if (res.status === 404) return { connected: false, state: 'not_found' }
  if (!res.ok) return { connected: false, state: 'error' }

  const data = await res.json() as { instance?: { state?: string }; state?: string }
  const state = data?.instance?.state ?? data?.state ?? 'unknown'

  if (state === 'open') return { connected: true, state }

  // Busca QR
  const qrRes = await fetch(`${EVO_URL}/instance/connect/${instance}`, { headers }).catch(() => null)
  const qrData = qrRes?.ok ? (await qrRes.json() as { base64?: string; qrcode?: { base64?: string } }) : null
  const qr = qrData?.base64 ?? qrData?.qrcode?.base64

  return { connected: false, qr, state }
}

export async function createOrGetQR(instance: string, webhookUrl: string): Promise<ConnectionStatus> {
  // Verifica se já existe
  const existing = await checkStatus(instance)

  if (existing.connected) {
    await configureWebhook(instance, webhookUrl)
    return { connected: true, state: 'open' }
  }

  if (existing.state !== 'not_found') {
    await configureWebhook(instance, webhookUrl)
    if (existing.qr) return { connected: false, qr: existing.qr, state: existing.state }
  }

  // Cria nova instância
  const res = await fetch(`${EVO_URL}/instance/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      instanceName: instance,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Evolution API ${res.status}: ${err}`)
  }

  const data = await res.json() as {
    qrcode?: { base64?: string }
    hash?: { qrcode?: string }
    base64?: string
  }
  const qr = data?.qrcode?.base64 ?? data?.hash?.qrcode ?? data?.base64

  return { connected: false, qr, state: 'connecting' }
}

export async function disconnectInstance(instance: string): Promise<void> {
  await fetch(`${EVO_URL}/instance/logout/${instance}`, { method: 'DELETE', headers }).catch(() => { })
  await fetch(`${EVO_URL}/instance/delete/${instance}`, { method: 'DELETE', headers })
}
