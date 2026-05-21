import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE /api/leads/[id]/conversation — zera todo o estado conversacional do lead:
// mensagens + memória de veículos apresentados + logs do agente (que controlam,
// entre outras coisas, o reenvio de fotos nos últimos 30 min). Mantém o lead e sua
// qualificação (nome, interesse, forma de pagamento, etc.).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('store_id, phone')
    .eq('id', id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 })
  }

  if (!lead.phone) {
    return NextResponse.json({ error: 'Lead sem telefone — nada a apagar.' }, { status: 400 })
  }

  // 1. Mensagens
  const { error: convError } = await admin
    .from('agent_conversations')
    .delete()
    .eq('store_id', lead.store_id)
    .eq('phone', lead.phone)

  if (convError) {
    console.error('[DELETE /api/leads/[id]/conversation] conversations', convError)
    return NextResponse.json({ error: convError.message }, { status: 500 })
  }

  // 2. Memória de veículos já apresentados (evita "ficha não reaparece após apagar")
  const { error: presentedError } = await admin
    .from('leads')
    .update({ presented_vehicles: {} })
    .eq('id', id)

  if (presentedError) {
    console.error('[DELETE /api/leads/[id]/conversation] presented_vehicles', presentedError)
    return NextResponse.json({ error: presentedError.message }, { status: 500 })
  }

  // 3. Logs do agente (inclui photos_sent — controla o reenvio de fotos)
  const { error: logsError } = await admin
    .from('agent_logs')
    .delete()
    .eq('store_id', lead.store_id)
    .eq('phone', lead.phone)

  if (logsError) {
    console.error('[DELETE /api/leads/[id]/conversation] logs', logsError)
    return NextResponse.json({ error: logsError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
