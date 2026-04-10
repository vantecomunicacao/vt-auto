import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PanelLayout } from '@/components/admin/PanelLayout'
import { ConversationsContent } from './ConversationsContent'

export default async function ConversationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) redirect('/admin/dashboard')

  const storeId = storeUser.store_id

  const { data: messages } = await admin
    .from('agent_conversations')
    .select('role, content, phone, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true })
    .limit(2000)

  const { data: leads } = await admin
    .from('leads')
    .select('phone, name')
    .eq('store_id', storeId)

  return (
    <PanelLayout topbar={{ title: 'Conversas' }}>
      <ConversationsContent messages={messages ?? []} leads={leads ?? []} />
    </PanelLayout>
  )
}
