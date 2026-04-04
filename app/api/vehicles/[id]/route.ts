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

// DELETE /api/vehicles/[id] — soft delete (muda status para inactive)
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

  const { error } = await admin
    .from('vehicles')
    .update({ status: 'inactive' })
    .eq('id', id)
    .eq('store_id', storeUser.store_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
