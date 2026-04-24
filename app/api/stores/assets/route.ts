import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const MAX_BYTES = 2 * 1024 * 1024 // 2MB (arquivo chega comprimido do cliente)
const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/x-icon', 'image/vnd.microsoft.icon']
const ALLOWED_KINDS = ['logo', 'banner', 'favicon'] as const
type AssetKind = typeof ALLOWED_KINDS[number]

// POST /api/stores/assets — envia logo/banner/favicon. Form multipart: { file, kind }
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

  const formData = await request.formData()
  const file = formData.get('file')
  const kindRaw = formData.get('kind')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 })
  }
  if (typeof kindRaw !== 'string' || !ALLOWED_KINDS.includes(kindRaw as AssetKind)) {
    return NextResponse.json({ error: 'kind inválido' }, { status: 400 })
  }
  const kind = kindRaw as AssetKind

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Formato inválido: ${file.type}` }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede 2MB' }, { status: 413 })
  }

  const ext =
    file.type === 'image/webp' ? 'webp' :
    file.type === 'image/png' ? 'png' :
    file.type === 'image/jpeg' ? 'jpg' :
    'ico'

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `${storeUser.store_id}/${kind}/${filename}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await admin.storage
    .from('store-assets')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('store-assets').getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, path }, { status: 201 })
}

// DELETE /api/stores/assets?path=... — remove um asset (usado ao trocar imagem)
export async function DELETE(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path ausente' }, { status: 400 })

  // Garante que o path começa com o storeId do usuário (evita deletar assets de outra loja)
  if (!path.startsWith(`${storeUser.store_id}/`)) {
    return NextResponse.json({ error: 'path inválido' }, { status: 403 })
  }

  const { error } = await admin.storage.from('store-assets').remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
