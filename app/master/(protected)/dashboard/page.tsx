import { createAdminClient } from '@/lib/supabase/server'
import { Store, Users, Car, MessageSquare } from 'lucide-react'

const planBadge: Record<string, string> = {
  trial: 'bg-gray-100 text-gray-600',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planBadge[plan] ?? 'bg-gray-100 text-gray-500'}`}>
      {plan}
    </span>
  )
}

export default async function MasterDashboardPage() {
  const adminClient = createAdminClient()

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalStores },
    { count: storesThisMonth },
    { count: totalVehicles },
    { count: totalLeads },
    { data: planCounts },
    { data: recentStores },
  ] = await Promise.all([
    adminClient.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
    adminClient.from('stores').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
    adminClient.from('vehicles').select('*', { count: 'exact', head: true }),
    adminClient.from('leads').select('*', { count: 'exact', head: true }),
    adminClient.from('stores').select('plan'),
    adminClient
      .from('stores')
      .select('id, name, plan, is_active, city, state, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Compute plan distribution
  const planDistribution: Record<string, number> = { trial: 0, basic: 0, pro: 0, enterprise: 0 }
  for (const row of planCounts ?? []) {
    const p = row.plan as string
    planDistribution[p] = (planDistribution[p] ?? 0) + 1
  }

  const metricCards = [
    { label: 'Lojas ativas', value: totalStores ?? 0, icon: Store, color: 'text-blue-600 bg-blue-50' },
    { label: 'Lojas este mês', value: storesThisMonth ?? 0, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Veículos cadastrados', value: totalVehicles ?? 0, icon: Car, color: 'text-purple-600 bg-purple-50' },
    { label: 'Leads gerados', value: totalLeads ?? 0, icon: MessageSquare, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do SaaS AutoAgente</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>

      {/* Plan Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Distribuição de Planos</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(planDistribution).map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-2">
              <PlanBadge plan={plan} />
              <span className="text-sm font-medium text-gray-700">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Stores Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">10 Lojas mais recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Plano</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cidade / UF</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {(recentStores ?? []).map((store) => (
                <tr key={store.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{store.name}</td>
                  <td className="px-5 py-3"><PlanBadge plan={store.plan} /></td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {store.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {store.city && store.state ? `${store.city} / ${store.state}` : store.city || store.state || '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(store.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
