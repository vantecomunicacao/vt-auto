'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Clock } from 'lucide-react'

interface FollowUpConfig {
  intervals: number[]
  messages: string[]
  max_attempts?: number
}

interface Props {
  storeId: string
  initialEnabled: boolean
  initialConfig: FollowUpConfig
}

const DEFAULT_CONFIG: FollowUpConfig = { intervals: [60, 1440, 4320], messages: ['', '', ''] }

export function FollowUpConfig({ storeId, initialEnabled, initialConfig }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [config, setConfig] = useState<FollowUpConfig>(initialConfig ?? DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(({ store }) => {
        if (store?.follow_up_config) setConfig(store.follow_up_config)
        if (store?.follow_up_enabled !== undefined) setEnabled(store.follow_up_enabled)
      })
      .catch(() => {})
  }, [])

  function addStep() {
    setConfig(c => ({
      intervals: [...c.intervals, 60],
      messages: [...c.messages, ''],
    }))
  }

  function removeStep(i: number) {
    setConfig(c => ({
      intervals: c.intervals.filter((_, idx) => idx !== i),
      messages: c.messages.filter((_, idx) => idx !== i),
    }))
  }

  function updateInterval(i: number, val: number) {
    setConfig(c => {
      const intervals = [...c.intervals]
      intervals[i] = val
      return { ...c, intervals }
    })
  }

  function updateMessage(i: number, val: string) {
    setConfig(c => {
      const messages = [...c.messages]
      messages[i] = val
      return { ...c, messages }
    })
  }

  function formatInterval(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`
    return `${Math.round(minutes / 1440)} dia(s)`
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follow_up_enabled: enabled, follow_up_config: config }),
      })
      if (!res.ok) toast.error('Erro ao salvar.')
      else toast.success('Follow-up configurado!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Follow-up automático</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Envia mensagens automáticas para leads que pararam de responder
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      {/* Etapas */}
      <div className="space-y-3">
        {config.intervals.map((interval, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-muted-foreground" />
                <p className="text-xs font-semibold text-slate-700">Etapa {i + 1}</p>
              </div>
              <button onClick={() => removeStep(i)} className="text-slate-300 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Enviar após (minutos)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={interval}
                    onChange={e => updateInterval(i, Number(e.target.value))}
                    className="h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatInterval(interval)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Prompt do follow-up</Label>
              <Textarea
                value={config.messages[i] ?? ''}
                onChange={e => updateMessage(i, e.target.value)}
                placeholder="Ex: Reengaje o cliente de forma amigável, mencione o veículo que ele demonstrou interesse e pergunte se ainda tem dúvidas."
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">O agente vai gerar uma mensagem personalizada baseada neste prompt e no histórico da conversa.</p>
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addStep} className="w-full h-8 text-xs gap-1.5 border-dashed">
          <Plus size={12} />
          Adicionar etapa
        </Button>
      </div>

      {/* Máximo de tentativas */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Máximo de tentativas</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total de follow-ups enviados por lead, somando todos os ciclos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={50}
              value={config.max_attempts ?? config.intervals.length}
              onChange={e => setConfig(c => ({ ...c, max_attempts: Number(e.target.value) }))}
              className="h-8 w-20 text-sm text-right"
            />
            <span className="text-xs text-muted-foreground">tentativas</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ex: 3 etapas + máximo 5 → ciclo 1 envia 1, 2, 3 e ciclo 2 envia 4, 5 e para.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        O intervalo é contado a partir da última mensagem do cliente. O contador do ciclo zera quando o cliente responder. A mensagem é gerada pela IA com base no prompt e no histórico da conversa.
      </p>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs gap-1.5">
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          Salvar follow-up
        </Button>
      </div>
    </div>
  )
}
