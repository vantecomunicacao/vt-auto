import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE /api/team/[id] — soft-delete: desativa membro (não remove owner)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const admin = createAdminClient()

  const { data: member, error: fetchError } = await admin
    .from('store_users')
    .select('id, role, is_active')
    .eq('id', id)
    .single()

  if (fetchError || !member) {
    return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 })
  }

  if (member.role === 'owner') {
    return NextResponse.json({ error: 'O owner não pode ser removido.' }, { status: 403 })
  }

  const { error } = await admin
    .from('store_users')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('[DELETE /api/team/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
