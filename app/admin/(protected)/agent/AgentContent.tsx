'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Bot } from 'lucide-react'

export function AgentContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [form, setForm] = useState({
    agent_active: false,
    agent_name: 'AutoAgente',
    agent_tone: 'professional',
    agent_greeting: '',
    agent_prompt: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: su } = await supabase.from('store_users').select('store_id').eq('user_id', user.id).single()
      if (!su) return
      setStoreId(su.store_id)
      const { data: store } = await supabase.from('stores')
        .select('agent_active,agent_name,agent_tone,agent_greeting,agent_prompt')
        .eq('id', su.store_id).single()
      if (store) setForm({ agent_active: store.agent_active, agent_name: store.agent_name, agent_tone: store.agent_tone, agent_greeting: store.agent_greeting || '', agent_prompt: store.agent_prompt || '' })
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!storeId) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('stores').update(form).eq('id', storeId)
    setSaving(false)
    if (error) toast.error('Erro ao salvar.')
    else toast.success('Configurações do agente salvas!')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={20} className="animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-5">

      {/* Toggle principal */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: form.agent_active ? 'var(--ds-primary-50)' : '#F1F5F9' }}>
              <Bot size={20} style={{ color: form.agent_active ? 'var(--ds-primary-600)' : '#94A3B8' }} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Agente de IA</p>
              <p className="text-xs text-muted-foreground">
                {form.agent_active ? 'Respondendo no WhatsApp' : 'Desativado — clientes não recebem respostas automáticas'}
              </p>
            </div>
          </div>
          <Switch
            checked={form.agent_active}
            onCheckedChange={v => setForm(f => ({ ...f, agent_active: v }))}
          />
        </div>
      </div>

      {/* Configurações */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <p className="text-sm font-medium text-slate-900">Personalidade</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Nome do agente</Label>
            <Input
              value={form.agent_name}
              onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))}
              className="h-10"
              placeholder="AutoAgente"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Tom de voz</Label>
            <Select value={form.agent_tone} onValueChange={v => setForm(f => ({ ...f, agent_tone: v ?? '' }))}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="friendly">Amigável</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Mensagem de boas-vindas</Label>
          <Textarea
            value={form.agent_greeting}
            onChange={e => setForm(f => ({ ...f, agent_greeting: e.target.value }))}
            placeholder="Olá! Sou o assistente da [loja]. Como posso ajudar?"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Instruções para o agente</Label>
          <Textarea
            value={form.agent_prompt}
            onChange={e => setForm(f => ({ ...f, agent_prompt: e.target.value }))}
            placeholder="Você é um assistente de vendas especializado em veículos. Seja direto, responda sobre o estoque disponível e incentive a visita à loja..."
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">Descreva como o agente deve se comportar, o que pode ou não responder.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="h-9 px-5 text-sm text-white" style={{ background: 'var(--ds-primary-600)' }}>
          {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Salvando...</> : 'Salvar configurações'}
        </Button>
      </div>
    </div>
  )
}
