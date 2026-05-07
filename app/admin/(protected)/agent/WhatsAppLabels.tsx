'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, RefreshCw, Tags, AlertCircle } from 'lucide-react'
import { fetchAgent } from '@/lib/agent/fetchAgent'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'

interface LabelRow {
  id: string
  evolution_label_id: string
  name: string
  color: number | null
  synced_at: string
}

interface Props {
  storeId: string
}

const NONE = '__none__'

// Paleta aproximada das cores que o WhatsApp usa nas etiquetas
const LABEL_COLORS: Record<number, string> = {
  0: '#FF7B7B', 1: '#FFB347', 2: '#FFD93D', 3: '#A1E887',
  4: '#6BCBFF', 5: '#9B8AFB', 6: '#FF9ECF', 7: '#94A3B8',
}

function colorFor(c: number | null): string {
  if (c == null) return '#94A3B8'
  return LABEL_COLORS[c] ?? '#94A3B8'
}

export function WhatsAppLabels({ storeId }: Props) {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [labels, setLabels] = useState<LabelRow[]>([])
  const [disableId, setDisableId] = useState<string>(NONE)
  const [handoffId, setHandoffId] = useState<string>(NONE)
  const [savedDisableId, setSavedDisableId] = useState<string>(NONE)
  const [savedHandoffId, setSavedHandoffId] = useState<string>(NONE)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const { isDirty } = useUnsavedChanges(
    { disableId, handoffId },
    { disableId: savedDisableId, handoffId: savedHandoffId },
  )

  useEffect(() => {
    async function load() {
      try {
        const [labelsRes, settingsRes] = await Promise.all([
          fetchAgent('/labels', undefined, storeId),
          fetch('/api/settings'),
        ])
        const labelsData = (await labelsRes.json()) as LabelRow[]
        setLabels(labelsData)
        if (labelsData.length > 0) {
          setLastSyncedAt(labelsData[0]?.synced_at ?? null)
        }

        if (settingsRes.ok) {
          const { store } = (await settingsRes.json()) as { store: { bot_disable_label_id?: string | null; bot_handoff_label_id?: string | null } }
          const d = store?.bot_disable_label_id ?? NONE
          const h = store?.bot_handoff_label_id ?? NONE
          setDisableId(d || NONE)
          setHandoffId(h || NONE)
          setSavedDisableId(d || NONE)
          setSavedHandoffId(h || NONE)
        }
      } catch {
        toast.error('Não foi possível carregar as etiquetas.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [storeId])

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetchAgent('/labels/sync', { method: 'POST' }, storeId)
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error ?? 'Falha ao sincronizar etiquetas.')
        return
      }
      const { count } = (await res.json()) as { count: number }

      const listRes = await fetchAgent('/labels', undefined, storeId)
      const listData = (await listRes.json()) as LabelRow[]
      setLabels(listData)
      setLastSyncedAt(listData[0]?.synced_at ?? new Date().toISOString())
      toast.success(`${count} etiqueta${count === 1 ? '' : 's'} sincronizada${count === 1 ? '' : 's'}.`)
    } catch {
      toast.error('Falha ao sincronizar etiquetas.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_disable_label_id: disableId === NONE ? null : disableId,
          bot_handoff_label_id: handoffId === NONE ? null : handoffId,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error ?? 'Erro ao salvar.')
        return
      }
      setSavedDisableId(disableId)
      setSavedHandoffId(handoffId)
      toast.success('Etiquetas salvas!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isDirty && (
        <div className="flex items-center gap-2.5 mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertCircle size={15} className="shrink-0" />
          <span className="font-medium">Você tem alterações não salvas.</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tags size={15} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-slate-900">Etiquetas do WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                {labels.length === 0
                  ? 'Sincronize para listar as etiquetas que você criou no WhatsApp.'
                  : `${labels.length} etiqueta${labels.length === 1 ? '' : 's'} disponível${labels.length === 1 ? '' : 'is'}.`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="h-8 text-xs gap-1.5 shrink-0"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Sincronizar
          </Button>
        </div>

        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {labels.map(l => (
              <span
                key={l.id}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: colorFor(l.color) }} />
                {l.name}
              </span>
            ))}
          </div>
        )}

        {lastSyncedAt && (
          <p className="text-xs text-muted-foreground">
            Última sincronização: {new Date(lastSyncedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <p className="text-sm font-medium text-slate-900">Comportamento por etiqueta</p>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Etiqueta que desliga o agente</Label>
          <Select value={disableId} onValueChange={v => setDisableId(v ?? NONE)} disabled={labels.length === 0}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhuma</SelectItem>
              {labels.map(l => (
                <SelectItem key={l.id} value={l.evolution_label_id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Quando você adicionar essa etiqueta a um chat no WhatsApp, o agente para de responder aquele lead. Ao remover, volta a responder.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Etiqueta aplicada ao transferir para humano</Label>
          <Select value={handoffId} onValueChange={v => setHandoffId(v ?? NONE)} disabled={labels.length === 0}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhuma</SelectItem>
              {labels.map(l => (
                <SelectItem key={l.id} value={l.evolution_label_id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Quando o agente transferir o atendimento para um humano, marca o chat com essa etiqueta automaticamente no seu WhatsApp.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="h-8 text-xs gap-1.5">
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          Salvar etiquetas
        </Button>
      </div>
    </div>
  )
}
