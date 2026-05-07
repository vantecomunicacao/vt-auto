'use client'

import type { Lead } from './LeadsContent'
import { KANBAN_STATUSES, SOURCE_MAP, getStatusMeta, formatRelative, getVehicleName } from './leadsUtils'

type Props = {
  leads: Lead[]
  togglingAi: string | null
  onToggleAi: (lead: Lead) => void
  onUpdateStatus: (lead: Lead) => void
  onDelete: (lead: Lead) => void
  emptyMessage: string
}

export default function LeadsKanban({ leads, togglingAi, onToggleAi, onUpdateStatus, onDelete, emptyMessage }: Props) {
  if (leads.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  const grouped = KANBAN_STATUSES.map(status => ({
    status,
    meta: getStatusMeta(status),
    leads: leads.filter(l => l.status === status),
  }))

  // Status legados/desconhecidos com leads — exibe como colunas extras à direita
  const knownSet = new Set<string>(KANBAN_STATUSES)
  const extraStatuses = Array.from(new Set(leads.filter(l => !knownSet.has(l.status)).map(l => l.status)))
  const extraColumns = extraStatuses.map(status => ({
    status,
    meta: getStatusMeta(status),
    leads: leads.filter(l => l.status === status),
  }))

  const columns = [...grouped, ...extraColumns]

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {columns.map(col => (
          <div
            key={col.status}
            className="w-[280px] shrink-0 bg-muted/30 border border-border rounded-xl flex flex-col max-h-[calc(100vh-220px)]"
          >
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between sticky top-0 bg-muted/30 backdrop-blur rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${col.meta.className}`}>
                  {col.meta.label}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">{col.leads.length}</span>
            </div>

            <div className="flex flex-col gap-2 p-2 overflow-y-auto">
              {col.leads.length === 0 ? (
                <div className="text-[11px] text-muted-foreground text-center py-6">
                  Nenhum lead
                </div>
              ) : (
                col.leads.map(lead => {
                  const sourceMeta = SOURCE_MAP[lead.source] ?? { label: lead.source, className: 'bg-gray-100 text-gray-500' }
                  return (
                    <div
                      key={lead.id}
                      onClick={() => onUpdateStatus(lead)}
                      className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md hover:border-ds-primary-300 transition cursor-pointer flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{lead.name ?? '—'}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{lead.phone ?? '—'}</div>
                        </div>
                        <span className={`shrink-0 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sourceMeta.className}`}>
                          {sourceMeta.label}
                        </span>
                      </div>

                      <div className="text-xs text-foreground truncate">{getVehicleName(lead)}</div>

                      {(lead.budget || lead.payment_method) && (
                        <div className="flex flex-col gap-0.5">
                          {lead.budget && <span className="text-[10px] text-muted-foreground truncate">Orçamento: {lead.budget}</span>}
                          {lead.payment_method && <span className="text-[10px] text-muted-foreground truncate">{lead.payment_method}</span>}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-border/60">
                        <button
                          onClick={e => { e.stopPropagation(); onToggleAi(lead) }}
                          disabled={togglingAi === lead.id}
                          title={lead.ai_active ? 'IA ativa — clique para pausar' : 'IA pausada — clique para reativar'}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-colors ${
                            lead.ai_active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700'
                              : 'bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-700'
                          }`}
                        >
                          {togglingAi === lead.id ? '...' : lead.ai_active ? 'IA Ativa' : 'IA Pausada'}
                        </button>
                        <span className="text-[10px] text-muted-foreground">{formatRelative(lead.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={e => { e.stopPropagation(); onUpdateStatus(lead) }}
                          className="text-[10px] text-ds-primary-600 hover:text-ds-primary-800 font-medium underline underline-offset-2"
                        >
                          Atualizar status
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(lead) }}
                          className="text-[10px] text-red-500 hover:text-red-700 font-medium underline underline-offset-2"
                        >
                          Apagar
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
