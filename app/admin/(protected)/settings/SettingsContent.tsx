'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAutoSave } from '@/hooks/useAutoSave'

export function SettingsContent() {
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [slug, setSlug] = useState('')

  const [loja, setLoja] = useState({ name: '', phone: '', landline: '', email: '', city: '', state: '' })
  const [domain, setDomain] = useState({ custom_domain: '' })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const res = await fetch('/api/settings')
        if (!res.ok) return
        const { store, storeId: sid } = await res.json()

        setStoreId(sid)
        setSlug(store.slug || '')
        setLoja({ name: store.name || '', phone: store.phone || '', landline: store.landline || '', email: store.email || '', city: store.city || '', state: store.state || '' })
        setDomain({ custom_domain: store.custom_domain || '' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useAutoSave(loading ? null : loja, {
    onSave: async (data) => {
      if (!data || !storeId) return
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        toast.error('Erro ao salvar.')
        throw new Error('save failed')
      }
    },
  })

  useAutoSave(loading ? null : domain, {
    onSave: async (data) => {
      if (!data || !storeId) return
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        toast.error('Erro ao salvar domínio.')
        throw new Error('save failed')
      }
    },
  })

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={20} className="animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="max-w-2xl">
      <Tabs defaultValue="loja">
        <TabsList className="mb-6 bg-slate-100 p-1 rounded-lg h-auto">
          {['loja', 'dominio'].map(tab => (
            <TabsTrigger key={tab} value={tab} className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2">
              {{ loja: 'Loja', dominio: 'Domínio' }[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Loja */}
        <TabsContent value="loja" className="space-y-4">
          {slug && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-blue-700 mb-0.5">URL da sua vitrine</p>
                <code className="text-sm text-blue-900 font-mono">{slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'}</code>
              </div>
              <a
                href={`${(process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000').startsWith('localhost') ? 'http' : 'https'}://${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'}`}
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
                <Input value={loja.name} onChange={e => setLoja(l => ({ ...l, name: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">WhatsApp</Label>
                <Input value={loja.phone} onChange={e => setLoja(l => ({ ...l, phone: e.target.value }))} className="h-10" placeholder="(44) 9 9999-8888" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Telefone fixo</Label>
              <Input value={loja.landline} onChange={e => setLoja(l => ({ ...l, landline: e.target.value }))} className="h-10" placeholder="(44) 3531-3333" />
              <p className="text-xs text-muted-foreground">Exibido na vitrine e rodapé como telefone para ligar.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">E-mail de contato</Label>
              <Input type="email" value={loja.email} onChange={e => setLoja(l => ({ ...l, email: e.target.value }))} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Cidade</Label>
                <Input value={loja.city} onChange={e => setLoja(l => ({ ...l, city: e.target.value }))} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Estado</Label>
                <Input value={loja.state} onChange={e => setLoja(l => ({ ...l, state: e.target.value }))} className="h-10" maxLength={2} placeholder="SP" />
              </div>
            </div>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
