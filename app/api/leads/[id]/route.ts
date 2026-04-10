import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const VALID_STATUSES = ['new', 'qualifying', 'negotiating', 'closing', 'converted', 'lost', 'in_progress', 'qualified'] as const

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

  const { status, ai_active } = body as { status?: string; ai_active?: boolean }

  if (status !== undefined && !(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(', ')}` },
      { status: 422 }
    )
  }

  if (status === undefined && ai_active === undefined) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status !== undefined) update.status = status
  if (ai_active !== undefined) {
    update.ai_active = ai_active
    // Ao reativar manualmente, limpa o motivo de pausa
    if (ai_active === true) update.ai_paused_reason = null
  }

  const { error } = await admin
    .from('leads')
    .update(update)
    .eq('id', id)

  if (error) {
    console.error('[PATCH /api/leads/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/leads/[id] — remove o lead
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { error } = await admin.from('leads').delete().eq('id', id)

  if (error) {
    console.error('[DELETE /api/leads/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
