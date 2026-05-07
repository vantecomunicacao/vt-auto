'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, FileText, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'

const DEFAULT_FIELDS = [
  'Carro de interesse',
  'Intenção de compra (quente/morno/frio)',
  'Forma de pagamento mencionada',
  'Veículo para troca (se houver)',
  'Faixa de orçamento (se mencionada)',
  'Resumo da conversa (2 a 3 frases)',
]

export function SummaryFieldsEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<string[]>([])
  const [savedFields, setSavedFields] = useState<string[]>([])
  const [newField, setNewField] = useState('')

  const { isDirty } = useUnsavedChanges(fields, savedFields)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const { store } = (await res.json()) as { store: { agent_summary_fields?: string[] | null } }
          const loaded = Array.isArray(store?.agent_summary_fields) && store.agent_summary_fields.length > 0
            ? store.agent_summary_fields
            : DEFAULT_FIELDS
          setFields(loaded)
          setSavedFields(loaded)
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  function handleAdd() {
    const v = newField.trim()
    if (!v) return
    setFields(prev => [...prev, v])
    setNewField('')
  }

  function handleRemove(idx: number) {
    setFields(prev => prev.filter((_, i) => i !== idx))
  }

  function handleEdit(idx: number, value: string) {
    setFields(prev => prev.map((f, i) => i === idx ? value : f))
  }

  function move(idx: number, dir: -1 | 1) {
    setFields(prev => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const cleaned = fields.map(f => f.trim()).filter(Boolean)
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_summary_fields: cleaned }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error ?? 'Erro ao salvar.')
        return
      }
      setFields(cleaned)
      setSavedFields(cleaned)
      toast.success('Campos do resumo salvos!')
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

  // Preview da mensagem
  const previewLines = fields.map(f => `- ${f}: ...`).join('\n')
  const previewMsg = `✅ Atendimento encerrado

Cliente: João Silva
Telefone: 5511999990000
Data e hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

${previewLines}`

  return (
    <div className="space-y-4">
      {isDirty && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertCircle size={15} className="shrink-0" />
          <span className="font-medium">Você tem alterações não salvas.</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-slate-900">Campos do resumo enviado ao vendedor</p>
            <p className="text-xs text-muted-foreground">
              Quando a conversa é encerrada, a IA preenche estes tópicos com base no histórico e envia ao vendedor da vez.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {fields.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Nenhum campo. Adicione abaixo.</p>
          )}
          {fields.map((f, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-slate-50/50">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Mover para cima"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === fields.length - 1}
                  className="text-muted-foreground hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Mover para baixo"
                >
                  <ArrowDown size={12} />
                </button>
              </div>
              <Input
                value={f}
                onChange={e => handleEdit(idx, e.target.value)}
                className="h-9 text-sm flex-1"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-muted-foreground hover:text-red-600 transition-colors p-1"
                aria-label="Remover campo"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-2 border-t border-border pt-4">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-slate-600">Adicionar tópico</Label>
            <Input
              value={newField}
              onChange={e => setNewField(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              placeholder="Ex: Quer test drive (sim/não)"
              className="h-9 text-sm"
            />
          </div>
          <Button size="sm" onClick={handleAdd} className="h-9 gap-1.5" variant="outline">
            <Plus size={13} />
            Adicionar
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="h-8 text-xs gap-1.5">
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            Salvar campos
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
        <p className="text-sm font-medium text-slate-900">Pré-visualização da mensagem</p>
        <p className="text-xs text-muted-foreground">Exemplo de como o vendedor recebe a notificação no WhatsApp ao encerrar uma conversa.</p>
        <pre className="mt-2 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-mono">{previewMsg}</pre>
      </div>
    </div>
  )
}
