import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify caller is master
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(user.id)

  if (!adminUser || adminUser.user_metadata?.is_master !== true) {
    return Response.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const body = await request.json() as { plan?: string; is_active?: boolean }

  const update: Record<string, unknown> = {}
  if (body.plan !== undefined) update.plan = body.plan
  if (body.is_active !== undefined) update.is_active = body.is_active

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('stores')
    .update(update)
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
