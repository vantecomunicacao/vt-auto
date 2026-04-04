'use client'

import { useState, useRef } from 'react'

type Vehicle = { brand: string; model: string; year_model: number }

export type Lead = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  source: 'whatsapp' | 'vitrine' | 'manual' | string
  status: 'new' | 'in_progress' | 'qualified' | 'converted' | 'lost' | string
  vehicle_interest: string | null
  created_at: string
  updated_at: string
  vehicles: Vehicle[] | null
}

const STATUS_OPTIONS = [
  { value: 'new',         label: 'Novo',          className: 'bg-red-100 text-red-700' },
  { value: 'in_progress', label: 'Em andamento',  className: 'bg-yellow-100 text-yellow-700' },
  { value: 'qualified',   label: 'Qualificado',   className: 'bg-blue-100 text-blue-700' },
  { value: 'converted',   label: 'Convertido',    className: 'bg-green-100 text-green-700' },
  { value: 'lost',        label: 'Perdido',       className: 'bg-gray-100 text-gray-500' },
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
  const dialogRef = useRef<HTMLDialogElement>(null)

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
                      <td className="px-4 py-3 text-foreground max-w-[200px] truncate">
                        {getVehicleName(lead)}
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

                      {/* Data */}
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDialog(lead)}
                          className="text-xs text-ds-primary-600 hover:text-ds-primary-800 font-medium underline underline-offset-2"
                        >
                          Atualizar status
                        </button>
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
    </div>
  )
}
