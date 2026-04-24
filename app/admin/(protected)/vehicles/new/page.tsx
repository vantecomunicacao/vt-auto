import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PanelLayout } from '@/components/admin/PanelLayout'
import { VehicleForm } from '@/components/admin/vehicles/VehicleForm'

export default async function NewVehiclePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  return (
    <PanelLayout topbar={{ title: 'Novo veículo', subtitle: 'Cadastre um veículo no estoque' }}>
      <div className="max-w-3xl">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <VehicleForm />
        </div>
      </div>
    </PanelLayout>
  )
}
