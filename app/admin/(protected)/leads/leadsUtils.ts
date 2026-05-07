import type { Lead } from './LeadsContent'

export const STATUS_OPTIONS = [
  { value: 'new',         label: 'Novo',            className: 'bg-slate-100 text-slate-600' },
  { value: 'qualifying',  label: 'Qualificando',    className: 'bg-yellow-100 text-yellow-700' },
  { value: 'negotiating', label: 'Negociando',      className: 'bg-orange-100 text-orange-700' },
  { value: 'closing',     label: 'Em fechamento',   className: 'bg-blue-100 text-blue-700' },
  { value: 'converted',   label: 'Convertido',      className: 'bg-green-100 text-green-700' },
  { value: 'lost',        label: 'Perdido',         className: 'bg-gray-100 text-gray-500' },
  // legados — mantidos para compatibilidade
  { value: 'in_progress', label: 'Em andamento',    className: 'bg-yellow-100 text-yellow-700' },
  { value: 'qualified',   label: 'Qualificado',     className: 'bg-blue-100 text-blue-700' },
] as const

// Status exibidos como colunas no Kanban (ordem do funil)
export const KANBAN_STATUSES = ['new', 'qualifying', 'negotiating', 'closing', 'converted', 'lost'] as const

export const SOURCE_MAP: Record<string, { label: string; className: string }> = {
  whatsapp: { label: 'WhatsApp', className: 'bg-green-100 text-green-700' },
  vitrine:  { label: 'Vitrine',  className: 'bg-blue-100 text-blue-700' },
  manual:   { label: 'Manual',   className: 'bg-gray-100 text-gray-500' },
}

export function getStatusMeta(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status) ?? { label: status, className: 'bg-gray-100 text-gray-500' }
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function formatRelative(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

export function formatDuration(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function getVehicleName(lead: Lead) {
  if (lead.vehicles) {
    const v = lead.vehicles?.[0]
    return v ? `${v.brand} ${v.model} ${v.year_model}` : lead.vehicle_interest ?? '—'
  }
  return lead.vehicle_interest ?? '—'
}
