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

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const storeId = await getStoreId(user.id)
  if (!storeId) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const admin = createAdminClient()
  const { data: store } = await admin
    .from('stores')
    .select('storefront_settings')
    .eq('id', storeId)
    .single()

  return NextResponse.json({ settings: store?.storefront_settings ?? {} })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const storeId = await getStoreId(user.id)
  if (!storeId) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const body = await request.json()

  const admin = createAdminClient()
  const { error } = await admin
    .from('stores')
    .update({ storefront_settings: body })
    .eq('id', storeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
