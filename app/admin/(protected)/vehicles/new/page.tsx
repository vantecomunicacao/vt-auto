import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PanelLayout } from '@/components/admin/PanelLayout'
import { VehicleForm } from '@/components/admin/vehicles/VehicleForm'

export default async function NewVehiclePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: storeUser } = await createAdminClient()
    .from('store_users').select('store_id').eq('user_id', user.id).single()
  if (!storeUser) redirect('/admin/login')

  return (
    <PanelLayout topbar={{ title: 'Novo veículo', subtitle: 'Cadastre um veículo no estoque' }}>
      <div className="max-w-3xl">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <VehicleForm storeId={storeUser.store_id} />
        </div>
      </div>
    </PanelLayout>
  )
}
