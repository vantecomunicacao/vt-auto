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

// GET /api/salespeople — lista vendedores da loja
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const storeId = await getStoreId(user.id)
  if (!storeId) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('salespeople')
    .select('id, name, phone, is_active, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ salespeople: data ?? [] })
}

// POST /api/salespeople — cria vendedor
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const storeId = await getStoreId(user.id)
  if (!storeId) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phoneRaw = typeof body.phone === 'string' ? body.phone : ''
  const phone = normalizePhone(phoneRaw)

  if (!name) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
  if (phone.length < 10) return NextResponse.json({ error: 'Telefone inválido. Use DDI + DDD + número.' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('salespeople')
    .insert({ store_id: storeId, name, phone, is_active: true })
    .select('id, name, phone, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ salesperson: data })
}
