'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Trash2, UserPlus, Users, Send } from 'lucide-react'
import { fetchAgent } from '@/lib/agent/fetchAgent'

interface Salesperson {
  id: string
  name: string
  phone: string
  is_active: boolean
  created_at: string
}

interface Props {
  storeId: string
}

export function Salespeople({ storeId }: Props) {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<Salesperson[]>([])
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    try {
      const res = await fetch('/api/salespeople')
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error ?? 'Não foi possível carregar os vendedores.')
        return
      }
      const data = (await res.json()) as { salespeople: Salesperson[] }
      setList(data.salespeople ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    const name = newName.trim()
    const phone = newPhone.replace(/\D/g, '')
    if (!name) { toast.error('Informe o nome do vendedor.'); return }
    if (phone.length < 10) { toast.error('Telefone inválido. Use DDI + DDD + número.'); return }

    setAdding(true)
    try {
      const res = await fetch('/api/salespeople', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error ?? 'Erro ao adicionar vendedor.')
        return
      }
      const { salesperson } = (await res.json()) as { salesperson: Salesperson }
      setList(prev => [...prev, salesperson])
      setNewName('')
      setNewPhone('')
      toast.success('Vendedor adicionado!')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(id: string, is_active: boolean) {
    setList(prev => prev.map(s => s.id === id ? { ...s, is_active } : s))
    const res = await fetch(`/api/salespeople/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    })
    if (!res.ok) {
      toast.error('Erro ao atualizar vendedor.')
      void load()
    }
  }

  async function handleTest(id: string, phone: string) {
    setTestingId(id)
    try {
      const res = await fetchAgent('/salespeople/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      }, storeId)
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error ?? 'Falha ao enviar mensagem de teste.')
        return
      }
      toast.success('Mensagem de teste enviada!')
    } catch {
      toast.error('Falha ao enviar mensagem de teste.')
    } finally {
      setTestingId(null)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Remover ${name} da lista de vendedores?`)) return
    const res = await fetch(`/api/salespeople/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Erro ao remover vendedor.')
      return
    }
    setList(prev => prev.filter(s => s.id !== id))
    toast.success('Vendedor removido.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Users size={15} className="text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-slate-900">Vendedores</p>
          <p className="text-xs text-muted-foreground">
            Os leads são distribuídos em rodízio entre os vendedores ativos: 1 lead por vendedor por vez, ciclando pela lista.
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nenhum vendedor cadastrado. Adicione abaixo.</p>
      ) : (
        <div className="space-y-2">
          {list.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-slate-50/50">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-medium shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{s.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => handleTest(s.id, s.phone)}
                disabled={testingId === s.id}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-border hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enviar mensagem de teste"
              >
                {testingId === s.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                Testar
              </button>
              <Switch
                checked={s.is_active}
                onCheckedChange={v => handleToggle(s.id, v)}
              />
              <button
                type="button"
                onClick={() => handleDelete(s.id, s.name)}
                className="text-muted-foreground hover:text-red-600 transition-colors p-1"
                aria-label="Remover"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-sm font-medium text-slate-700">Adicionar vendedor</p>
        <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Nome</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="João da Silva"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Telefone (DDI+DDD+número)</Label>
            <Input
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="5511999990000"
              className="h-9 text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={adding}
            className="h-9 gap-1.5"
          >
            {adding ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={13} />}
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  )
}
