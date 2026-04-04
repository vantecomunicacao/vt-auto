import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { vehicleSchema } from '@/lib/schemas/vehicle'

// GET /api/vehicles — lista veículos da loja
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const { data, error } = await admin
    .from('vehicles')
    .select('*')
    .eq('store_id', storeUser.store_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/vehicles — cria veículo
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const body = await request.json()
  const parsed = vehicleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await admin
    .from('vehicles')
    .insert({ ...parsed.data, store_id: storeUser.store_id })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
