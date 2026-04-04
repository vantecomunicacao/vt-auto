import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['available', 'sold', 'reserved', 'inactive']),
})

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
    .select('store_id, role')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Status inválido' }, { status: 422 })

  if (parsed.data.status === 'sold' && storeUser.role !== 'owner') {
    return NextResponse.json({ error: 'Sem permissão para marcar como vendido' }, { status: 403 })
  }

  const { error } = await admin
    .from('vehicles')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .eq('store_id', storeUser.store_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
