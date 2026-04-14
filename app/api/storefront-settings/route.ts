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

  // Garantir que o body é um objeto simples antes de persistir
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Formato de configurações inválido.' }, { status: 400 })
  }

  // Whitelist de chaves permitidas em storefront_settings
  const allowedKeys = [
    'layout_theme', 'grid_cols', 'card_style', 'sort_by',
    'filter_brand', 'filter_price', 'filter_fuel', 'filter_transmission',
    'page_title', 'page_slogan', 'cta_label',
    'banner_enabled', 'banner_title', 'banner_subtitle', 'banner_image_url',
    'about_enabled', 'about_image_url',
    'show_mileage', 'show_year', 'show_fuel', 'show_transmission',
    'btn_details_style', 'btn_whatsapp_style', 'btn_details_label',
    'financing_simulator',
    'instagram_url', 'facebook_url', 'tiktok_url', 'youtube_url',
  ]
  const safeSettings = Object.fromEntries(
    Object.entries(body as Record<string, unknown>).filter(([key]) => allowedKeys.includes(key))
  )

  const admin = createAdminClient()
  const { error } = await admin
    .from('stores')
    .update({ storefront_settings: safeSettings })
    .eq('id', storeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
