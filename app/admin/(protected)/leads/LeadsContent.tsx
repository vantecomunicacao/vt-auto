'use client'

import { useState, useRef } from 'react'

type Vehicle = { brand: string; model: string; year_model: number }

export type Lead = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  source: 'whatsapp' | 'vitrine' | 'manual' | string
  status: 'new' | 'qualifying' | 'negotiating' | 'closing' | 'converted' | 'lost' | string
  ai_active: boolean
  ai_paused_reason: 'transbordo' | 'encerramento' | 'manual' | null
  vehicle_interest: string | null
  budget: string | null
  payment_method: string | null
  trade_in: string | null
  created_at: string
  updated_at: string
  vehicles: Vehicle[] | null
}

const STATUS_OPTIONS = [
  { value: 'new',         label: 'Novo',            className: 'bg-slate-100 text-slate-600' },
  { value: 'qualifying',  label: 'Qualificando',    className: 'bg-yellow-100 text-yellow-700' },
  { value: 'negotiating', label: 'Negociando',      className: 'bg-orange-100 text-orange-700' },
  { value: 'closing',     label: 'Em fechamento',   className: 'bg-blue-100 text-blue-700' },
  { value: 'converted',   label: 'Convertido',      className: 'bg-green-100 text-green-700' },
  { value: 'lost',        label: 'Perdido',         className: 'bg-gray-100 text-gray-500' },
  // legados — mantidos para compatibilidade
  { value: 'in_progress', label: 'Em andamento',    className: 'bg-yellow-100 text-yellow-700' },
  { value: 'qualified',   label: 'Qualificado',     className: 'bg-blue-100 text-blue-700' },
]

const SOURCE_MAP: Record<string, { label: string; className: string }> = {
  whatsapp: { label: 'WhatsApp', className: 'bg-green-100 text-green-700' },
  vitrine:  { label: 'Vitrine',  className: 'bg-blue-100 text-blue-700' },
  manual:   { label: 'Manual',   className: 'bg-gray-100 text-gray-500' },
}

function getStatusMeta(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status) ?? { label: status, className: 'bg-gray-100 text-gray-500' }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function getVehicleName(lead: Lead) {
  if (lead.vehicles) {
    const v = lead.vehicles?.[0]
    return v ? `${v.brand} ${v.model} ${v.year_model}` : lead.vehicle_interest ?? '—'
  }
  return lead.vehicle_interest ?? '—'
}

export default function LeadsContent({ leads }: { leads: Lead[] }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [togglingAi, setTogglingAi] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  async function handleToggleAi(lead: Lead) {
    setTogglingAi(lead.id)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_active: !lead.ai_active }),
      })
      if (res.ok) {
        setLocalLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ai_active: !lead.ai_active } : l))
      }
    } finally {
      setTogglingAi(null)
    }
  }

  const filtered = localLeads.filter(lead => {
    const matchStatus = statusFilter === 'all' || lead.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q
      || (lead.name ?? '').toLowerCase().includes(q)
      || (lead.phone ?? '').includes(q)
    return matchStatus && matchSearch
  })

  function openDialog(lead: Lead) {
    setUpdatingId(lead.id)
    setSelectedStatus(lead.status)
    setErrorMsg('')
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
    setUpdatingId(null)
  }

  function openDeleteDialog(lead: Lead) {
    setDeletingId(lead.id)
    deleteDialogRef.current?.showModal()
  }

  function closeDeleteDialog() {
    deleteDialogRef.current?.close()
    setDeletingId(null)
  }

  async function handleDeleteLead() {
    if (!deletingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${deletingId}`, { method: 'DELETE' })
      if (res.ok) {
        setLocalLeads(prev => prev.filter(l => l.id !== deletingId))
        closeDeleteDialog()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveStatus() {
    if (!updatingId) return
    setSaving(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/leads/${updatingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Erro ao atualizar.')
        return
      }
      setLocalLeads(prev =>
        prev.map(l => l.id === updatingId ? { ...l, status: selectedStatus, updated_at: new Date().toISOString() } : l)
      )
      closeDialog()
    } catch {
      setErrorMsg('Erro de rede. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary-300"
        >
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary-300 min-w-[220px]"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {localLeads.length === 0
              ? 'Nenhum lead cadastrado ainda.'
              : 'Nenhum resultado para os filtros aplicados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Contato</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Interesse</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Origem</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Bot</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => {
                  const statusMeta = getStatusMeta(lead.status)
                  const sourceMeta = SOURCE_MAP[lead.source] ?? { label: lead.source, className: 'bg-gray-100 text-gray-500' }
                  return (
                    <tr
                      key={lead.id}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}
                    >
                      {/* Contato */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{lead.name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone ?? '—'}</div>
                      </td>

                      {/* Interesse */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-medium text-foreground truncate">{getVehicleName(lead)}</div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {lead.budget && <span className="text-[10px] text-muted-foreground truncate">Orçamento: {lead.budget}</span>}
                          {lead.payment_method && <span className="text-[10px] text-muted-foreground truncate">{lead.payment_method}</span>}
                          {lead.trade_in && <span className="text-[10px] text-muted-foreground truncate">Troca: {lead.trade_in}</span>}
                        </div>
                      </td>

                      {/* Origem */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${sourceMeta.className}`}>
                          {sourceMeta.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Bot */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleToggleAi(lead)}
                            disabled={togglingAi === lead.id}
                            title={lead.ai_active ? 'IA ativa — clique para pausar' : 'IA pausada — clique para reativar'}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                              lead.ai_active
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700'
                                : 'bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-700'
                            }`}
                          >
                            {togglingAi === lead.id ? '...' : lead.ai_active ? 'Ativa' : 'Pausada'}
                          </button>
                          {!lead.ai_active && lead.ai_paused_reason && (
                            <span className="text-[10px] text-muted-foreground leading-none px-1">
                              {lead.ai_paused_reason === 'transbordo' && 'pediu humano'}
                              {lead.ai_paused_reason === 'encerramento' && 'conversa encerrada'}
                              {lead.ai_paused_reason === 'manual' && 'pausado manualmente'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openDialog(lead)}
                            className="text-xs text-ds-primary-600 hover:text-ds-primary-800 font-medium underline underline-offset-2"
                          >
                            Atualizar status
                          </button>
                          <button
                            onClick={() => openDeleteDialog(lead)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium underline underline-offset-2"
                          >
                            Apagar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Native Dialog — update status */}
      <dialog
        ref={dialogRef}
        className="rounded-xl shadow-xl border border-border bg-card p-0 w-full max-w-sm backdrop:bg-black/40"
        onClose={closeDialog}
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Atualizar status do lead</h2>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">
            Novo status
          </label>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary-300"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errorMsg && (
            <p className="text-xs text-red-600">{errorMsg}</p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={closeDialog}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveStatus}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-ds-primary-600 hover:bg-ds-primary-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </dialog>
      {/* Native Dialog — confirmar exclusão */}
      <dialog
        ref={deleteDialogRef}
        className="rounded-xl shadow-xl border border-border bg-card p-0 w-full max-w-sm backdrop:bg-black/40"
        onClose={closeDeleteDialog}
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Apagar lead</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground">Esta ação é irreversível. Deseja realmente apagar este lead?</p>
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={closeDeleteDialog}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDeleteLead}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {saving ? 'Apagando...' : 'Apagar'}
          </button>
        </div>
      </dialog>
    </div>
  )
}
