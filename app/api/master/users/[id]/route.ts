import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

async function verifyMaster() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(user.id)
  if (!adminUser || adminUser.user_metadata?.is_master !== true) return null

  return { adminClient, callerId: user.id }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verifyMaster()
  if (!auth) {
    return Response.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const body = await request.json() as {
    email?: string
    password?: string
    full_name?: string
    is_master?: boolean
  }

  const update: Record<string, unknown> = {}
  if (body.email) update.email = body.email
  if (body.password) {
    if (body.password.length < 6) {
      return Response.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }
    update.password = body.password
  }

  // Build user_metadata update
  if (body.full_name !== undefined || body.is_master !== undefined) {
    // Get current metadata first
    const { data: { user: existing } } = await auth.adminClient.auth.admin.getUserById(id)
    const currentMeta = existing?.user_metadata ?? {}
    update.user_metadata = {
      ...currentMeta,
      ...(body.full_name !== undefined ? { full_name: body.full_name } : {}),
      ...(body.is_master !== undefined ? { is_master: body.is_master || undefined } : {}),
    }
    // Remove is_master key entirely if false (to keep metadata clean)
    if (body.is_master === false) {
      delete (update.user_metadata as Record<string, unknown>).is_master
    }
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })
  }

  const { data, error } = await auth.adminClient.auth.admin.updateUserById(id, update)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ user: data.user })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verifyMaster()
  if (!auth) {
    return Response.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  // Prevent self-deletion
  if (id === auth.callerId) {
    return Response.json({ error: 'Você não pode deletar sua própria conta.' }, { status: 400 })
  }

  const { error } = await auth.adminClient.auth.admin.deleteUser(id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
