'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function SettingsContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)

  const [slug, setSlug] = useState('')
  const [geral, setGeral] = useState({
    name: '', phone: '', email: '', city: '', state: '', address: '', description: '',
  })
  const [visual, setVisual] = useState({
    primary_color: '#2563EB', secondary_color: '#1E40AF', logo_url: '',
  })
  const [domain, setDomain] = useState({ custom_domain: '' })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Usa a API interna para buscar dados da loja (bypassa RLS no servidor)
        const res = await fetch('/api/settings')
        if (!res.ok) return
        const { store, storeId: sid } = await res.json()

        setStoreId(sid)
        setSlug(store.slug || '')
        setGeral({ name: store.name || '', phone: store.phone || '', email: store.email || '', city: store.city || '', state: store.state || '', address: store.address || '', description: store.description || '' })
        setVisual({ primary_color: store.primary_color || '#2563EB', secondary_color: store.secondary_color || '#1E40AF', logo_url: store.logo_url || '' })
        setDomain({ custom_domain: store.custom_domain || '' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function save(data: Record<string, unknown>) {
    if (!storeId) return
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (!res.ok) toast.error('Erro ao salvar.')
    else toast.success('Salvo com sucesso!')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={20} className="animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="max-w-2xl">
      <Tabs defaultValue="geral">
        <TabsList className="mb-6 bg-slate-100 p-1 rounded-lg h-auto">
          {['geral', 'visual', 'dominio'].map(tab => (
            <TabsTrigger key={tab} value={tab} className="text-sm capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
              {{ geral: 'Geral', visual: 'Visual', dominio: 'Domínio' }[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Geral */}
        <TabsContent value="geral" className="space-y-4">
          {/* Vitrine URL */}
          {slug && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-blue-700 mb-0.5">URL da sua vitrine</p>
                <code className="text-sm text-blue-900 font-mono">/storefront/{slug}</code>
              </div>
              <a
                href={`/storefront/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs font-medium text-white px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--ds-primary-600)' }}
              >
                Abrir vitrine →
              </a>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Slug (URL da vitrine)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground bg-slate-100 h-10 px-3 flex items-center rounded-l-lg border border-border border-r-0 shrink-0">/storefront/</span>
                <Input value={slug} readOnly className="h-10 rounded-l-none bg-slate-50 text-slate-500 cursor-not-allowed font-mono" />
              </div>
              <p className="text-xs text-muted-foreground">O slug é definido no onboarding e não pode ser alterado.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Nome da loja *</Label>
                <Input value={geral.name} onChange={e => setGeral(g => ({ ...g, name: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">WhatsApp</Label>
                <Input value={geral.phone} onChange={e => setGeral(g => ({ ...g, phone: e.target.value }))} className="h-10" placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">E-mail de contato</Label>
              <Input type="email" value={geral.email} onChange={e => setGeral(g => ({ ...g, email: e.target.value }))} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Cidade</Label>
                <Input value={geral.city} onChange={e => setGeral(g => ({ ...g, city: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Estado</Label>
                <Input value={geral.state} onChange={e => setGeral(g => ({ ...g, state: e.target.value }))} className="h-10" maxLength={2} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Endereço</Label>
              <Input value={geral.address} onChange={e => setGeral(g => ({ ...g, address: e.target.value }))} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Descrição da loja</Label>
              <Textarea value={geral.description} onChange={e => setGeral(g => ({ ...g, description: e.target.value }))} rows={3} className="resize-none" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => save(geral)} disabled={saving} className="h-9 px-5 text-sm text-white" style={{ background: 'var(--ds-primary-600)' }}>
              {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Salvando...</> : 'Salvar'}
            </Button>
          </div>
        </TabsContent>

        {/* Visual */}
        <TabsContent value="visual" className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Cor principal</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={visual.primary_color} onChange={e => setVisual(v => ({ ...v, primary_color: e.target.value }))} className="w-12 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
                <Input value={visual.primary_color} onChange={e => setVisual(v => ({ ...v, primary_color: e.target.value }))} className="h-10 font-mono" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Cor secundária</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={visual.secondary_color} onChange={e => setVisual(v => ({ ...v, secondary_color: e.target.value }))} className="w-12 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
                <Input value={visual.secondary_color} onChange={e => setVisual(v => ({ ...v, secondary_color: e.target.value }))} className="h-10 font-mono" />
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="p-4 text-white text-sm font-medium" style={{ background: visual.primary_color }}>
                {geral.name || 'Nome da Loja'}
              </div>
              <div className="p-3 text-white text-xs" style={{ background: visual.secondary_color }}>
                Veículos disponíveis · Fale conosco
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => save(visual)} disabled={saving} className="h-9 px-5 text-sm text-white" style={{ background: 'var(--ds-primary-600)' }}>
              {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Salvando...</> : 'Salvar visual'}
            </Button>
          </div>
        </TabsContent>

        {/* Domínio */}
        <TabsContent value="dominio" className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Domínio customizado</Label>
              <Input
                value={domain.custom_domain}
                onChange={e => setDomain({ custom_domain: e.target.value })}
                placeholder="www.minhaloja.com.br"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Aponte um registro CNAME do seu domínio para <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">cname.autoagente.com.br</code>
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 font-medium mb-1">Instrução DNS</p>
              <p className="text-xs text-amber-600">
                No painel do seu provedor de domínio, crie um registro:<br />
                Tipo: <strong>CNAME</strong> · Nome: <strong>www</strong> · Valor: <strong>cname.autoagente.com.br</strong>
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => save(domain)} disabled={saving} className="h-9 px-5 text-sm text-white" style={{ background: 'var(--ds-primary-600)' }}>
              {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Salvando...</> : 'Salvar domínio'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
