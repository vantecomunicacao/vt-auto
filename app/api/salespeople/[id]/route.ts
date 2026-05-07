import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function getStoreId(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', userId)
    .single()
  return data?.store_id ?? null
}

function normalizePhone(input: string): string {
  return input.replace(/\D/g, '')
}

// PATCH /api/salespeople/[id] — atualiza nome, telefone ou ativo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const storeId = await getStoreId(user.id)
  if (!storeId) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const update: Record<string, unknown> = {}

  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 })
    update.name = name
  }
  if (typeof body.phone === 'string') {
    const phone = normalizePhone(body.phone)
    if (phone.length < 10) return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 })
    update.phone = phone
  }
  if (typeof body.is_active === 'boolean') {
    update.is_active = body.is_active
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('salespeople')
    .update(update)
    .eq('id', id)
    .eq('store_id', storeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/salespeople/[id] — remove vendedor
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const storeId = await getStoreId(user.id)
  if (!storeId) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('salespeople')
    .delete()
    .eq('id', id)
    .eq('store_id', storeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
