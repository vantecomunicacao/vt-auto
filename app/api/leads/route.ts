import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ success: false, error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { store_id, vehicle_id, name, phone, source } = body as {
    store_id?: string
    vehicle_id?: string
    name?: string
    phone?: string
    source?: string
  }

  if (!phone || phone.trim() === '') {
    return Response.json(
      { success: false, error: 'O campo "phone" é obrigatório.' },
      { status: 422 }
    )
  }

  if (!store_id) {
    return Response.json(
      { success: false, error: 'O campo "store_id" é obrigatório.' },
      { status: 422 }
    )
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('leads')
    .insert({
      store_id,
      vehicle_id: vehicle_id ?? null,
      name: name ?? null,
      phone: phone.trim(),
      source: source ?? 'vitrine',
      status: 'new',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[POST /api/leads] Supabase error:', error)
    return Response.json(
      { success: false, error: 'Erro ao registrar lead. Tente novamente.' },
      { status: 500 }
    )
  }

  return Response.json({ success: true, id: data.id }, { status: 201 })
}
