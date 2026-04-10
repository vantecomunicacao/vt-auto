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

export async function POST(request: NextRequest) {
  const auth = await verifyMaster()
  if (!auth) {
    return Response.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  }

  const body = await request.json() as {
    email: string
    password: string
    full_name?: string
    is_master?: boolean
  }

  if (!body.email || !body.password) {
    return Response.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
  }

  if (body.password.length < 6) {
    return Response.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const { data, error } = await auth.adminClient.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      full_name: body.full_name ?? '',
      is_master: body.is_master === true ? true : undefined,
    },
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ user: data.user }, { status: 201 })
}
