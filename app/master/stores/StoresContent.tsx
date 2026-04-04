'use client'

import { useState, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'

type Store = {
  id: string
  name: string
  slug: string
  plan: string
  is_active: boolean
  onboarding_completo: boolean
  created_at: string
  city: string | null
  state: string | null
  phone: string | null
  vehicleCount: number
  leadCount: number
}

const planBadge: Record<string, string> = {
  trial: 'bg-gray-100 text-gray-600',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

const plans = ['trial', 'basic', 'pro', 'enterprise']

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planBadge[plan] ?? 'bg-gray-100 text-gray-500'}`}>
      {plan}
    </span>
  )
}

export default function StoresContent({ stores }: { stores: Store[] }) {
  const [search, setSearch] = useState('')
  const [storeList, setStoreList] = useState(stores)
  const [planLoading, setPlanLoading] = useState<string | null>(null)
  const [changingPlanStore, setChangingPlanStore] = useState<Store | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)

  const filtered = storeList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase())
  )

  function openPlanDialog(store: Store) {
    setChangingPlanStore(store)
    setSelectedPlan(store.plan)
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
    setChangingPlanStore(null)
  }

  async function handlePlanChange() {
    if (!changingPlanStore) return
    setPlanLoading(changingPlanStore.id)
    try {
      const res = await fetch(`/api/master/stores/${changingPlanStore.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      })
      if (res.ok) {
        setStoreList((prev) =>
          prev.map((s) => s.id === changingPlanStore.id ? { ...s, plan: selectedPlan } : s)
        )
        closeDialog()
      }
    } finally {
      setPlanLoading(null)
    }
  }

  async function toggleActive(store: Store) {
    const newValue = !store.is_active
    setStoreList((prev) =>
      prev.map((s) => s.id === store.id ? { ...s, is_active: newValue } : s)
    )
    await fetch(`/api/master/stores/${store.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newValue }),
    })
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou slug..."
          className="w-full pl-9 pr-3 h-9 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Plano</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Veículos</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Leads</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cidade / UF</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Criado em</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((store) => (
                <tr key={store.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{store.name}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{store.slug}</td>
                  <td className="px-5 py-3"><PlanBadge plan={store.plan} /></td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleActive(store)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${store.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                    >
                      {store.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{store.vehicleCount}</td>
                  <td className="px-5 py-3 text-gray-600">{store.leadCount}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {store.city && store.state ? `${store.city} / ${store.state}` : store.city || store.state || '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(store.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openPlanDialog(store)}
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      Alterar plano <ChevronDown size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-gray-400 text-sm">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan change dialog */}
      <dialog
        ref={dialogRef}
        className="rounded-xl border border-gray-200 shadow-xl p-0 w-full max-w-sm backdrop:bg-black/40"
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Alterar plano</h3>
          {changingPlanStore && (
            <p className="text-sm text-gray-500 mb-4">{changingPlanStore.name}</p>
          )}
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
          >
            {plans.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-4">
            <button
              onClick={closeDialog}
              className="flex-1 h-9 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePlanChange}
              disabled={!!planLoading}
              className="flex-1 h-9 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {planLoading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
