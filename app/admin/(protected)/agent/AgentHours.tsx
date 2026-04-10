'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Clock } from 'lucide-react'

const DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
]

type DayConfig = { enabled: boolean; start: string; end: string }
type HoursConfig = Record<string, DayConfig>

const DEFAULT_HOURS: HoursConfig = {
  mon: { enabled: true,  start: '08:00', end: '18:00' },
  tue: { enabled: true,  start: '08:00', end: '18:00' },
  wed: { enabled: true,  start: '08:00', end: '18:00' },
  thu: { enabled: true,  start: '08:00', end: '18:00' },
  fri: { enabled: true,  start: '08:00', end: '18:00' },
  sat: { enabled: false, start: '09:00', end: '13:00' },
  sun: { enabled: false, start: '09:00', end: '13:00' },
}

interface Props {
  storeId: string
  initialHours: HoursConfig | null
}

export function AgentHours({ storeId, initialHours }: Props) {
  const [hours, setHours] = useState<HoursConfig>(initialHours ?? DEFAULT_HOURS)
  const [restricted, setRestricted] = useState(initialHours !== null)
  const [saving, setSaving] = useState(false)

  function update(day: string, field: keyof DayConfig, value: string | boolean) {
    setHours(h => ({ ...h, [day]: { ...h[day], [field]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    const value = restricted
      ? Object.fromEntries(
          Object.entries(hours)
            .filter(([, v]) => v.enabled)
            .map(([k, v]) => [k, { start: v.start, end: v.end }])
        )
      : null

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_hours: value }),
      })
      if (!res.ok) toast.error('Erro ao salvar.')
      else toast.success('Horários salvos!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Restringir horário de atendimento</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Se desativado, o agente responde 24h por dia
            </p>
          </div>
          <Switch checked={restricted} onCheckedChange={setRestricted} />
        </div>
      </div>

      {restricted && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={13} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Dias e horários</p>
          </div>
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-24 flex items-center gap-2">
                <Switch
                  checked={hours[key]?.enabled ?? false}
                  onCheckedChange={v => update(key, 'enabled', v)}
                />
                <span className={`text-xs font-medium ${hours[key]?.enabled ? 'text-slate-700' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              {hours[key]?.enabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={hours[key].start}
                    onChange={e => update(key, 'start', e.target.value)}
                    className="border border-border rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-ds-primary-400"
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <input
                    type="time"
                    value={hours[key].end}
                    onChange={e => update(key, 'end', e.target.value)}
                    className="border border-border rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-ds-primary-400"
                  />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Fechado</span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Horários em fuso de Brasília (GMT-3). Fora do horário, o agente não responde.
      </p>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs gap-1.5">
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          Salvar horários
        </Button>
      </div>
    </div>
  )
}
