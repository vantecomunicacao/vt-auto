import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/team/invite — envia convite de vendedor
export async function POST(request: NextRequest) {
  // Verificar autenticação
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { email, store_id } = body as { email?: string; store_id?: string }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 422 })
  }

  if (!store_id) {
    return NextResponse.json({ error: 'store_id é obrigatório.' }, { status: 422 })
  }

  const admin = createAdminClient()

  // Validar que o store_id pertence ao usuário logado
  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id, role')
    .eq('user_id', user.id)
    .eq('store_id', store_id)
    .single()

  if (!storeUser) {
    return NextResponse.json({ error: 'Acesso não autorizado a esta loja.' }, { status: 403 })
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { store_id },
  })

  if (error) {
    console.error('[POST /api/team/invite]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
