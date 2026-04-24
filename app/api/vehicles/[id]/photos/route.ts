import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const MAX_PHOTOS = 5
const MAX_BYTES = 2 * 1024 * 1024 // 2MB — já vem comprimido do cliente
const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png']

// POST /api/vehicles/[id]/photos — envia uma foto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: vehicleId } = await params

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

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('store_id', storeUser.store_id)
    .single()

  if (!vehicle) return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Formato inválido: ${file.type}` }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede 2MB' }, { status: 413 })
  }

  // Reavalia limite e sort_order no servidor (evita race condition de abas concorrentes)
  const { data: existing, count } = await admin
    .from('vehicle_images')
    .select('sort_order', { count: 'exact' })
    .eq('vehicle_id', vehicleId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const currentCount = count ?? 0
  if (currentCount >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_PHOTOS} fotos por veículo atingido` },
      { status: 409 },
    )
  }

  const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0
  const isCover = currentCount === 0

  const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `fotos/${storeUser.store_id}/${vehicleId}/${filename}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await admin.storage
    .from('vehicle-images')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('vehicle-images').getPublicUrl(path)

  const { data: row, error: insertErr } = await admin
    .from('vehicle_images')
    .insert({
      vehicle_id: vehicleId,
      store_id: storeUser.store_id,
      url: publicUrl,
      storage_path: path,
      is_cover: isCover,
      sort_order: nextSortOrder,
    })
    .select('id, url, storage_path, is_cover, sort_order')
    .single()

  if (insertErr || !row) {
    await admin.storage.from('vehicle-images').remove([path])
    return NextResponse.json(
      { error: insertErr?.message || 'Erro ao registrar foto' },
      { status: 500 },
    )
  }

  return NextResponse.json(row, { status: 201 })
}
