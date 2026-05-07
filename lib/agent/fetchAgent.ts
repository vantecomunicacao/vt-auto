import { createClient } from '@/lib/supabase/client'

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? 'http://localhost:3001'

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

// Anexa `store_id_override` na query. O middleware do agente respeita esse
// override apenas quando o caller é master — para non-masters ele é ignorado
// e o `store_id` real do JWT/store_users prevalece. Master sem `store_id`
// nas claims (caso atual) precisa desse hint para o middleware saber qual
// loja está sendo gerenciada.
function withStoreOverride(path: string, storeId?: string): string {
  if (!storeId) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}store_id_override=${encodeURIComponent(storeId)}`
}

export async function fetchAgent(path: string, init?: RequestInit, storeId?: string): Promise<Response> {
  const headers = new Headers(init?.headers)
  const token = await getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${AGENT_URL}${withStoreOverride(path, storeId)}`, { ...init, headers })
}

export async function getSseTicket(storeId?: string): Promise<string> {
  const res = await fetchAgent('/auth/sse-ticket', { method: 'POST' }, storeId)
  if (!res.ok) throw new Error(`SSE ticket request failed: ${res.status}`)
  const data = await res.json() as { ticket: string }
  return data.ticket
}

export function buildSseUrl(path: string, ticket: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${AGENT_URL}${path}${sep}ticket=${encodeURIComponent(ticket)}`
}
