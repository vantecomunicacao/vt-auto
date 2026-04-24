import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { vehicleSchema } from '@/lib/schemas/vehicle'

// PATCH /api/vehicles/[id] — atualiza veículo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    .update(parsed.data)
    .eq('id', id)
    .eq('store_id', storeUser.store_id)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/vehicles/[id] — hard delete (remove fotos do Storage + linha do banco)
// vehicle_images tem ON DELETE CASCADE; leads.vehicle_id tem ON DELETE SET NULL.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id, role')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
  if (storeUser.role !== 'owner') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  // Verifica que o veículo existe e pertence à loja antes de mexer em Storage
  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id')
    .eq('id', id)
    .eq('store_id', storeUser.store_id)
    .single()

  if (!vehicle) return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 })

  // Lista arquivos do Storage vinculados e remove
  const { data: images } = await admin
    .from('vehicle_images')
    .select('storage_path')
    .eq('vehicle_id', id)

  const paths = (images ?? []).map(img => img.storage_path).filter(Boolean)
  if (paths.length > 0) {
    await admin.storage.from('vehicle-images').remove(paths)
  }

  // Deleta o veículo (CASCADE remove linhas de vehicle_images)
  const { error } = await admin
    .from('vehicles')
    .delete()
    .eq('id', id)
    .eq('store_id', storeUser.store_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
