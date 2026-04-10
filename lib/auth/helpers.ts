import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Retorna o usuário autenticado ou null.
 * Use em Server Components e Route Handlers.
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Retorna o usuário autenticado ou redireciona para o login.
 */
export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Verifica se o usuário tem o papel exigido.
 * Redireciona para /dashboard se não tiver.
 */
export async function requireRole(role: 'owner' | 'seller') {
  const user = await requireAuth()
  // O role vem do JWT claim customizado (via Auth Hook)
  // Verificamos via getSession que retorna o JWT completo
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  // Decodifica o payload do JWT (sem verificação de assinatura — apenas para leitura)
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url').toString())
  } catch {
    redirect('/login')
  }

  if (payload.role !== role) {
    redirect('/dashboard')
  }

  return { user, payload }
}

/**
 * Verifica se o usuário é master (super admin).
 * SEMPRE verificado no servidor — nunca confiar no frontend.
 */
export async function requireMaster() {
  const user = await requireAuth()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url').toString())
  } catch {
    redirect('/login')
  }

  if (!payload.is_master) {
    redirect('/')
  }

  return { user, payload }
}

/**
 * Retorna o store_id do JWT do usuário autenticado.
 */
export async function getStoreId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return null

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url').toString())
  } catch {
    return null
  }

  return (payload.store_id as string) || null
}
