import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// DELETE /api/vehicles/[id]/photos/[photoId] — remove uma foto
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const { id: vehicleId, photoId } = await params

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

  const { data: photo } = await admin
    .from('vehicle_images')
    .select('id, storage_path, is_cover')
    .eq('id', photoId)
    .eq('vehicle_id', vehicleId)
    .eq('store_id', storeUser.store_id)
    .single()

  if (!photo) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })

  await admin.storage.from('vehicle-images').remove([photo.storage_path])

  const { error: deleteErr } = await admin
    .from('vehicle_images')
    .delete()
    .eq('id', photoId)

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  // Se a foto removida era a capa, promove a primeira remanescente
  if (photo.is_cover) {
    const { data: next } = await admin
      .from('vehicle_images')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next) {
      await admin.from('vehicle_images').update({ is_cover: true }).eq('id', next.id)
    } else {
      // Não há mais fotos — limpa cover_image_url do veículo
      await admin.from('vehicles').update({ cover_image_url: null }).eq('id', vehicleId)
    }
  }

  return NextResponse.json({ success: true })
}

// PATCH /api/vehicles/[id]/photos/[photoId] — define como capa
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const { id: vehicleId, photoId } = await params

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

  const { data: photo } = await admin
    .from('vehicle_images')
    .select('id')
    .eq('id', photoId)
    .eq('vehicle_id', vehicleId)
    .eq('store_id', storeUser.store_id)
    .single()

  if (!photo) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })

  // O trigger handle_cover_image (migration 004) cuida de desmarcar as outras
  // e atualiza vehicles.cover_image_url automaticamente.
  const { error } = await admin
    .from('vehicle_images')
    .update({ is_cover: true })
    .eq('id', photoId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
