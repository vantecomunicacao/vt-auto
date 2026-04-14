import { createAdminClient } from '@/lib/supabase/server'
import StoresContent from './StoresContent'

export default async function MasterStoresPage() {
  const adminClient = createAdminClient()

  const { data: stores } = await adminClient
    .from('stores')
    .select('id, name, slug, plan, is_active, onboarding_completo, created_at, city, state, phone')
    .order('created_at', { ascending: false })

  if (!stores) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Nenhuma loja encontrada.</p>
      </div>
    )
  }

  // Fetch vehicle and lead counts in parallel for all stores
  const [vehicleCounts, leadCounts] = await Promise.all([
    adminClient
      .from('vehicles')
      .select('store_id'),
    adminClient
      .from('leads')
      .select('store_id'),
  ])

  // Build count maps
  const vehicleMap: Record<string, number> = {}
  for (const v of vehicleCounts.data ?? []) {
    vehicleMap[v.store_id] = (vehicleMap[v.store_id] ?? 0) + 1
  }

  const leadMap: Record<string, number> = {}
  for (const l of leadCounts.data ?? []) {
    leadMap[l.store_id] = (leadMap[l.store_id] ?? 0) + 1
  }

  const storesWithCounts = stores.map((store) => ({
    ...store,
    vehicleCount: vehicleMap[store.id] ?? 0,
    leadCount: leadMap[store.id] ?? 0,
  }))

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lojas</h1>
        <p className="text-gray-500 text-sm mt-1">{stores.length} lojas cadastradas</p>
      </div>
      <StoresContent stores={storesWithCounts} />
    </div>
  )
}
