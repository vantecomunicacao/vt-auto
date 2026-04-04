import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const VALID_STATUSES = ['new', 'in_progress', 'qualified', 'converted', 'lost'] as const

// PATCH /api/leads/[id] — atualiza status do lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { status } = body as { status?: string }

  if (!status || !(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(', ')}` },
      { status: 422 }
    )
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[PATCH /api/leads/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
