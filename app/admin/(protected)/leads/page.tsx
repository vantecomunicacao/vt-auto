import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PanelLayout } from '@/components/admin/PanelLayout'
import LeadsContent from './LeadsContent'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) redirect('/admin/onboarding')

  const storeId = storeUser.store_id

  const { data: leads } = await admin
    .from('leads')
    .select('id, name, phone, email, source, status, ai_active, ai_paused_reason, vehicle_interest, budget, payment_method, trade_in, created_at, updated_at, follow_up_total, follow_up_count, last_follow_up_at, last_user_message_at, vehicles(brand, model, year_model)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  return (
    <PanelLayout topbar={{ title: 'Leads' }}>
      <LeadsContent leads={leads ?? []} />
    </PanelLayout>
  )
}
