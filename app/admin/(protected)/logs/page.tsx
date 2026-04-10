import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PanelLayout } from '@/components/admin/PanelLayout'
import { LogsContent } from './LogsContent'

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Apenas master pode ver logs
  const isMaster = user.user_metadata?.is_master === true
  if (!isMaster) redirect('/admin/dashboard')

  const admin = createAdminClient()
  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) redirect('/admin/dashboard')

  return (
    <PanelLayout topbar={{ title: 'Logs do Agente' }}>
      <LogsContent storeId={storeUser.store_id} />
    </PanelLayout>
  )
}
