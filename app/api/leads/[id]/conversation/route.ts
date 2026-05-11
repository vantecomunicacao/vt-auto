import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE /api/leads/[id]/conversation — apaga o histórico de conversa do lead
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

  const { error } = await admin
    .from('agent_conversations')
    .delete()
    .eq('store_id', lead.store_id)
    .eq('phone', lead.phone)

  if (error) {
    console.error('[DELETE /api/leads/[id]/conversation]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
