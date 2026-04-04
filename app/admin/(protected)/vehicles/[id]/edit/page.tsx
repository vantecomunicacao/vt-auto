import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PanelLayout } from '@/components/admin/PanelLayout'
import { VehicleForm } from '@/components/admin/vehicles/VehicleForm'
import type { Vehicle, VehicleImage } from '@/lib/supabase/types'

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: storeUser } = await admin
    .from('store_users').select('store_id').eq('user_id', user.id).single()
  if (!storeUser) redirect('/admin/login')

  const { data: vehicle } = await admin
    .from('vehicles').select('*').eq('id', id).eq('store_id', storeUser.store_id).single()
  if (!vehicle) notFound()

  const { data: photos } = await admin
    .from('vehicle_images')
    .select('*')
    .eq('vehicle_id', id)
    .order('sort_order')

  const v = vehicle as Vehicle
  const p = (photos || []) as VehicleImage[]

  return (
    <PanelLayout topbar={{ title: `Editar — ${v.brand} ${v.model}` }}>
      <div className="max-w-3xl">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <VehicleForm
            storeId={storeUser.store_id}
            vehicleId={v.id}
            defaultValues={{
              brand: v.brand, model: v.model, version: v.version ?? undefined,
              year_model: v.year_model, year_manuf: v.year_manuf, color: v.color,
              body_type: v.body_type ?? undefined, doors: v.doors ?? undefined,
              seats: v.seats ?? undefined, description: v.description ?? undefined,
              status: v.status, featured: v.featured, fuel: v.fuel,
              transmission: v.transmission, mileage: v.mileage,
              engine: v.engine ?? undefined, power: v.power ?? undefined,
              torque: v.torque ?? undefined, internal_notes: v.internal_notes ?? undefined,
              price: v.price, price_old: v.price_old ?? undefined,
              price_negotiable: v.price_negotiable, fipe_code: v.fipe_code ?? undefined,
              features: v.features,
            }}
            initialPhotos={p.map(img => ({
              id: img.id,
              url: img.url,
              storage_path: img.storage_path,
              is_cover: img.is_cover,
              sort_order: img.sort_order,
            }))}
          />
        </div>
      </div>
    </PanelLayout>
  )
}
