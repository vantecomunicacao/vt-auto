'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ExternalLink, Plus, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { UnsavedChangesBar } from '@/components/admin/UnsavedChangesBar'

export type BannerSlide = {
  image_url: string
  title: string
  subtitle: string
}

export type StorefrontSettings = {
  // 1. Layout
  layout_theme: 'padrao' | 'vtlx' | 'vtclass' | 'premium'
  grid_cols: '2' | '3' | '4'
  card_style: 'shadow' | 'flat' | 'bordered'

  // 2. Ordenação padrão
  sort_by: 'created_at_desc' | 'price_asc' | 'price_desc' | 'featured'

  // 3. Filtros visíveis
  filter_brand: boolean
  filter_price: boolean
  filter_fuel: boolean
  filter_transmission: boolean

  // 4. Textos
  page_title: string
  page_slogan: string
  cta_label: string

  // 5. Banner
  banner_enabled: boolean
  banner_title: string
  banner_subtitle: string
  banner_image_url: string
  banner_slides: BannerSlide[]

  // 6. Sobre a loja
  about_enabled: boolean
  about_image_url: string

  // 7. Exibir specs nos cards
  show_mileage: boolean
  show_year: boolean
  show_fuel: boolean
  show_transmission: boolean

  // 8. Estilo dos botões
  btn_details_style: 'filled' | 'outline'
  btn_whatsapp_style: 'filled' | 'outline'
  btn_details_label: string

  // 9. Funcionalidades
  featured_carousel: boolean
  financing_simulator: boolean

  // 10. Redes sociais
  instagram_url: string
  facebook_url: string
  tiktok_url: string
  youtube_url: string
}

export type StoreData = {
  primary_color: string
  secondary_color: string
  logo_url: string
  description: string
  address: string
}

const DEFAULTS: StorefrontSettings = {
  layout_theme: 'padrao',
  grid_cols: '3',
  card_style: 'shadow',
  sort_by: 'featured',
  filter_brand: true,
  filter_price: true,
  filter_fuel: true,
  filter_transmission: true,
  page_title: '',
  page_slogan: '',
  cta_label: 'Ver detalhes',
  banner_enabled: false,
  banner_title: '',
  banner_subtitle: '',
  banner_image_url: '',
  banner_slides: [
    { image_url: '', title: '', subtitle: '' },
    { image_url: '', title: '', subtitle: '' },
    { image_url: '', title: '', subtitle: '' },
  ],
  about_enabled: false,
  about_image_url: '',
  show_mileage: true,
  show_year: true,
  show_fuel: true,
  show_transmission: true,
  btn_details_style: 'filled',
  btn_whatsapp_style: 'filled',
  btn_details_label: 'Ver detalhes',
  featured_carousel: true,
  financing_simulator: true,
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
  youtube_url: '',
}

const STORE_DEFAULTS: StoreData = {
  primary_color: '#2563EB',
  secondary_color: '#1E40AF',
  logo_url: '',
  description: '',
  address: '',
}

interface Props {
  slug: string
  initialSettings: Partial<StorefrontSettings>
  initialStoreData: Partial<StoreData>
}

function normalizeSlides(settings: Partial<StorefrontSettings>): BannerSlide[] {
  const raw = Array.isArray(settings.banner_slides) ? settings.banner_slides : []
  const cleaned = raw.map(s => ({
    image_url: s?.image_url ?? '',
    title: s?.title ?? '',
    subtitle: s?.subtitle ?? '',
  }))
  const hasAnyContent = cleaned.some(s => s.image_url || s.title || s.subtitle)
  const base = hasAnyContent ? cleaned : []

  // Migração dos campos legados: se não havia slides preenchidos mas existe banner_image_url/title/subtitle, vira o primeiro slide.
  if (!hasAnyContent && (settings.banner_image_url || settings.banner_title || settings.banner_subtitle)) {
    base.push({
      image_url: settings.banner_image_url ?? '',
      title: settings.banner_title ?? '',
      subtitle: settings.banner_subtitle ?? '',
    })
  }

  // Garante ao menos 3 slots visíveis para edição
  while (base.length < 3) base.push({ image_url: '', title: '', subtitle: '' })
  return base
}

export function StorefrontSettingsContent({ slug, initialSettings, initialStoreData }: Props) {
  const initSettings = { ...DEFAULTS, ...initialSettings, banner_slides: normalizeSlides(initialSettings) }
  const initStore: StoreData = { ...STORE_DEFAULTS, ...initialStoreData }

  const [settings, setSettings] = useState<StorefrontSettings>(initSettings)
  const [savedSettings, setSavedSettings] = useState<StorefrontSettings>(initSettings)

  const [storeData, setStoreData] = useState<StoreData>(initStore)
  const [savedStoreData, setSavedStoreData] = useState<StoreData>(initStore)

  const [saving, setSaving] = useState(false)

  const { isDirty: settingsDirty } = useUnsavedChanges(settings, savedSettings)
  const { isDirty: storeDirty } = useUnsavedChanges(storeData, savedStoreData)
  const isDirty = settingsDirty || storeDirty

  function set<K extends keyof StorefrontSettings>(key: K, value: StorefrontSettings[K]) {
    setSettings(s => {
      const next = { ...s, [key]: value }
      if (key === 'layout_theme' && value === 'padrao') next.card_style = 'shadow'
      return next
    })
  }

  function setStore<K extends keyof StoreData>(key: K, value: StoreData[K]) {
    setStoreData(s => ({ ...s, [key]: value }))
  }

  function setSlides(slides: BannerSlide[]) {
    setSettings(s => ({ ...s, banner_slides: slides }))
  }

  function updateSlide(idx: number, patch: Partial<BannerSlide>) {
    setSettings(s => ({
      ...s,
      banner_slides: s.banner_slides.map((slide, i) => (i === idx ? { ...slide, ...patch } : slide)),
    }))
  }

  async function saveStorefront() {
    setSaving(true)
    try {
      const res = await fetch('/api/storefront-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      setSavedSettings(settings)
      toast.success('Configurações da vitrine salvas!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function saveStoreData() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      })
      if (!res.ok) throw new Error()
      setSavedStoreData(storeData)
      toast.success('Identidade da vitrine salva!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function saveAbout() {
    setSaving(true)
    try {
      const filteredSlides = settings.banner_slides.filter(
        s => s.image_url.trim() || s.title.trim() || s.subtitle.trim()
      )
      const firstSlide = filteredSlides[0] ?? { image_url: '', title: '', subtitle: '' }
      const contentFields = {
        page_title: settings.page_title,
        page_slogan: settings.page_slogan,
        cta_label: settings.cta_label,
        banner_enabled: settings.banner_enabled,
        banner_slides: filteredSlides,
        // Mantém os campos legados sincronizados com o primeiro slide (compatibilidade)
        banner_title: firstSlide.title,
        banner_subtitle: firstSlide.subtitle,
        banner_image_url: firstSlide.image_url,
        about_enabled: settings.about_enabled,
        about_image_url: settings.about_image_url,
      }
      const [r1, r2] = await Promise.all([
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: storeData.description }),
        }),
        fetch('/api/storefront-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contentFields),
        }),
      ])
      if (!r1.ok || !r2.ok) throw new Error()
      setSavedStoreData(d => ({ ...d, description: storeData.description }))
      setSavedSettings(s => ({ ...s, ...contentFields }))
      toast.success('Conteúdo salvo!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function saveContato() {
    setSaving(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: storeData.address }),
        }),
        fetch('/api/storefront-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instagram_url: settings.instagram_url,
            facebook_url: settings.facebook_url,
            tiktok_url: settings.tiktok_url,
            youtube_url: settings.youtube_url,
          }),
        }),
      ])
      if (!r1.ok || !r2.ok) throw new Error()
      setSavedStoreData(d => ({ ...d, address: storeData.address }))
      setSavedSettings(s => ({ ...s, instagram_url: settings.instagram_url, facebook_url: settings.facebook_url, tiktok_url: settings.tiktok_url, youtube_url: settings.youtube_url }))
      toast.success('Contato salvo!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
  const protocol = rootDomain.startsWith('localhost') ? 'http' : 'https'
  const vitrineUrl = slug ? `${protocol}://${slug}.${rootDomain}` : null

  const SaveBtn = ({ onClick, label = 'Salvar' }: { onClick: () => void; label?: string }) => (
    <div className="flex justify-end pt-2">
      <Button onClick={onClick} disabled={saving} className="h-9 px-5 text-sm text-white" style={{ background: 'var(--ds-primary-600)' }}>
        {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Salvando...</> : label}
      </Button>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <UnsavedChangesBar isDirty={isDirty} />

      {/* Link para a vitrine */}
      {vitrineUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-700 mb-0.5">URL da sua vitrine</p>
            <code className="text-sm text-blue-900 font-mono">{slug}.{rootDomain}</code>
          </div>
          <a
            href={vitrineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--ds-primary-600)' }}
          >
            <ExternalLink size={12} />
            Abrir vitrine
          </a>
        </div>
      )}

      <Tabs defaultValue="identidade">
        <TabsList className="bg-slate-100 p-1 rounded-lg h-auto flex-wrap gap-1">
          {[
            ['identidade', 'Identidade'],
            ['layout',     'Layout'],
            ['conteudo',   'Conteúdo'],
            ['catalogo',   'Catálogo'],
            ['contato',    'Contato'],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── IDENTIDADE ─────────────────────────────────────────────────── */}
        <TabsContent value="identidade" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Cor principal</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={storeData.primary_color} onChange={e => setStore('primary_color', e.target.value)} className="w-12 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
                <Input value={storeData.primary_color} onChange={e => setStore('primary_color', e.target.value)} className="h-10 font-mono" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Cor secundária</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={storeData.secondary_color} onChange={e => setStore('secondary_color', e.target.value)} className="w-12 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
                <Input value={storeData.secondary_color} onChange={e => setStore('secondary_color', e.target.value)} className="h-10 font-mono" />
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="p-4 text-white text-sm font-medium" style={{ background: storeData.primary_color }}>
                Nome da Loja
              </div>
              <div className="p-3 text-white text-xs" style={{ background: storeData.secondary_color }}>
                Veículos disponíveis · Fale conosco
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">URL do logotipo</Label>
              <Input value={storeData.logo_url} onChange={e => setStore('logo_url', e.target.value)} placeholder="https://..." className="h-10" />
              <p className="text-xs text-muted-foreground">Link direto para a imagem do logo (PNG ou SVG com fundo transparente)</p>
            </div>
          </div>
          <SaveBtn onClick={saveStoreData} label="Salvar identidade" />
        </TabsContent>

        {/* ── LAYOUT ─────────────────────────────────────────────────────── */}
        <TabsContent value="layout" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Modelo da vitrine</Label>
              <p className="text-xs text-muted-foreground">Escolha o estilo visual da sua loja</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {/* Padrão */}
                <button onClick={() => set('layout_theme', 'padrao')} className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${settings.layout_theme === 'padrao' ? 'border-blue-600 shadow-md' : 'border-border hover:border-slate-300'}`}>
                  {settings.layout_theme === 'padrao' && <span className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd"/></svg></span>}
                  <div className="bg-white p-2 space-y-1.5">
                    <div className="h-2 bg-blue-600 rounded-sm w-full" />
                    <div className="grid grid-cols-2 gap-1">
                      {[0,1,2,3].map(i => (<div key={i} className="bg-gray-100 rounded-lg overflow-hidden"><div className="h-8 bg-gray-200" /><div className="p-1 space-y-0.5"><div className="h-1.5 bg-gray-300 rounded w-4/5" /><div className="h-1.5 bg-blue-400 rounded w-3/5" /><div className="h-3 bg-blue-600 rounded-md w-full mt-1" /></div></div>))}
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-white border-t border-gray-100"><p className="text-xs font-semibold text-slate-700">Padrão</p><p className="text-xs text-muted-foreground">Clássico com botões</p></div>
                </button>
                {/* VTLX */}
                <button onClick={() => set('layout_theme', 'vtlx')} className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${settings.layout_theme === 'vtlx' ? 'border-blue-600 shadow-md' : 'border-border hover:border-slate-300'}`}>
                  {settings.layout_theme === 'vtlx' && <span className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd"/></svg></span>}
                  <div className="bg-gray-50 p-2 space-y-1.5">
                    <div className="h-2 bg-gray-800 rounded-sm w-full" />
                    <div className="h-4 bg-gray-700 rounded-md w-full" />
                    <div className="grid grid-cols-2 gap-1">
                      {[0,1,2,3].map(i => (<div key={i} className="bg-white rounded-lg overflow-hidden border border-gray-100"><div className="relative h-8 bg-gray-200"><div className="absolute top-0 left-0 right-0 h-2 bg-purple-500" /></div><div className="p-1 space-y-0.5"><div className="h-1.5 bg-gray-300 rounded w-4/5" /><div className="h-2 bg-gray-800 rounded w-3/5 font-bold" /></div></div>))}
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-white border-t border-gray-100"><p className="text-xs font-semibold text-slate-700">VTLX</p><p className="text-xs text-muted-foreground">Moderno, estilo marketplace</p></div>
                </button>
                {/* VTClass */}
                <button onClick={() => set('layout_theme', 'vtclass')} className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${settings.layout_theme === 'vtclass' ? 'border-blue-600 shadow-md' : 'border-border hover:border-slate-300'}`}>
                  {settings.layout_theme === 'vtclass' && <span className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd"/></svg></span>}
                  <div className="bg-[#DDDDDD] p-2 space-y-1.5">
                    <div className="h-2 bg-gray-800 rounded-none w-full" />
                    <div className="grid grid-cols-2 gap-1">
                      {[0,1,2,3].map(i => (<div key={i} className="bg-white overflow-hidden"><div className="relative h-8 bg-gray-200"><div className="absolute bottom-0 left-0 right-0 h-2 bg-amber-600" /></div><div className="p-1 space-y-0.5 text-center"><div className="h-1.5 bg-gray-800 rounded-none w-4/5 mx-auto" /><div className="h-2 bg-amber-600 rounded-none w-3/5 mx-auto" /></div></div>))}
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-white border-t border-gray-100"><p className="text-xs font-semibold text-slate-700">VTClass</p><p className="text-xs text-muted-foreground">Clássico, traços retos</p></div>
                </button>
                {/* Premium */}
                <button onClick={() => set('layout_theme', 'premium')} className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${settings.layout_theme === 'premium' ? 'border-blue-600 shadow-md' : 'border-border hover:border-slate-300'}`}>
                  {settings.layout_theme === 'premium' && <span className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd"/></svg></span>}
                  <div className="bg-[#F5F5F0] p-2 space-y-1.5">
                    <div className="h-2 bg-gray-800 rounded-sm w-full" />
                    <div className="grid grid-cols-2 gap-1">
                      {[0,1,2,3].map(i => (<div key={i} className="bg-white rounded-md overflow-hidden shadow-sm"><div className="relative h-8 bg-gray-200"><div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/30 to-transparent" /><div className="absolute bottom-0.5 left-1 h-1.5 bg-white rounded w-3/5" /></div><div className="p-1 space-y-0.5"><div className="h-1 bg-gray-300 rounded w-2/5" /><div className="h-1.5 bg-gray-800 rounded w-4/5" /><div className="h-3 bg-gray-800 rounded-md w-full mt-1" /></div></div>))}
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-white border-t border-gray-100"><p className="text-xs font-semibold text-slate-700">Premium</p><p className="text-xs text-muted-foreground">Sóbrio e elegante</p></div>
                </button>
              </div>
            </div>

          </div>
          <SaveBtn onClick={saveStorefront} label="Salvar layout" />
        </TabsContent>

        {/* ── CONTEÚDO ───────────────────────────────────────────────────── */}
        <TabsContent value="conteudo" className="space-y-4 mt-4">
          {/* Textos */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-800">Textos da página</p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Título da página</Label>
              <Input value={settings.page_title} onChange={e => set('page_title', e.target.value)} placeholder="Ex: Encontre seu próximo carro" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Slogan / subtítulo</Label>
              <Input value={settings.page_slogan} onChange={e => set('page_slogan', e.target.value)} placeholder="Ex: Os melhores veículos seminovos da região" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Texto do botão principal</Label>
              <Input value={settings.cta_label} onChange={e => set('cta_label', e.target.value)} placeholder="Ver detalhes" className="h-10" />
            </div>
          </div>

          {/* Banner */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Banner</p>
                <p className="text-xs text-muted-foreground mt-0.5">Até 3+ imagens rotativas acima dos carros</p>
              </div>
              <Switch checked={settings.banner_enabled} onCheckedChange={v => set('banner_enabled', v)} />
            </div>
            {settings.banner_enabled && (
              <div className="space-y-4">
                <div className="flex gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                  <Info size={14} className="shrink-0 mt-0.5 text-blue-600" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Formato recomendado da imagem</p>
                    <p className="text-blue-800">
                      Dimensão: <strong>1920×760 px</strong> (horizontal, proporção ~2,5:1). Formato: JPG ou WebP, até <strong>500 KB</strong>.
                    </p>
                    <p className="text-blue-800">
                      Deixe o foco da imagem no centro — as bordas podem ser cortadas em telas menores.
                    </p>
                  </div>
                </div>
                {settings.banner_slides.map((slide, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">Banner {idx + 1}</p>
                      {settings.banner_slides.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSlides(settings.banner_slides.filter((_, i) => i !== idx))}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                          aria-label={`Remover banner ${idx + 1}`}
                        >
                          <Trash2 size={13} /> Remover
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">URL da imagem</Label>
                      <Input
                        value={slide.image_url}
                        onChange={e => updateSlide(idx, { image_url: e.target.value })}
                        placeholder="https://..."
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Título</Label>
                      <Input
                        value={slide.title}
                        onChange={e => updateSlide(idx, { title: e.target.value })}
                        placeholder="Ex: Novidades da semana"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Subtítulo</Label>
                      <Input
                        value={slide.subtitle}
                        onChange={e => updateSlide(idx, { subtitle: e.target.value })}
                        placeholder="Ex: Confira os veículos em destaque"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSlides([...settings.banner_slides, { image_url: '', title: '', subtitle: '' }])}
                  className="w-full h-10 rounded-lg border border-dashed border-border text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Adicionar banner
                </button>
                <p className="text-xs text-muted-foreground">
                  Banners com pelo menos a imagem <strong>ou</strong> o título preenchido serão exibidos em rotação (a cada 6s).
                </p>
              </div>
            )}
          </div>

          {/* Sobre */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Sobre a loja</p>
                <p className="text-xs text-muted-foreground mt-0.5">Seção com descrição e foto da loja</p>
              </div>
              <Switch checked={settings.about_enabled} onCheckedChange={v => set('about_enabled', v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Descrição da loja</Label>
              <Textarea value={storeData.description} onChange={e => setStore('description', e.target.value)} placeholder="Conte um pouco sobre sua loja, diferenciais, tempo de mercado..." rows={4} className="resize-none" />
              <p className="text-xs text-muted-foreground">Aparece na seção "Sobre" da vitrine e é usada pelo agente de IA.</p>
            </div>
            {settings.about_enabled && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">URL da foto da loja</Label>
                <Input value={settings.about_image_url} onChange={e => set('about_image_url', e.target.value)} placeholder="https://..." className="h-10" />
              </div>
            )}
          </div>

          <SaveBtn onClick={saveAbout} label="Salvar conteúdo" />
        </TabsContent>

        {/* ── CATÁLOGO ───────────────────────────────────────────────────── */}
        <TabsContent value="catalogo" className="space-y-4 mt-4">
          {/* Ordenação */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-800">Ordenação padrão</p>
            <Select value={settings.sort_by} onValueChange={v => set('sort_by', v as StorefrontSettings['sort_by'])}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Destaques primeiro</SelectItem>
                <SelectItem value="created_at_desc">Mais recentes primeiro</SelectItem>
                <SelectItem value="price_asc">Menor preço primeiro</SelectItem>
                <SelectItem value="price_desc">Maior preço primeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-800">Filtros visíveis</p>
            <p className="text-xs text-muted-foreground -mt-2">Escolha quais filtros aparecem para os visitantes</p>
            {([
              ['filter_brand',        'Filtro por Marca'],
              ['filter_price',        'Filtro por Faixa de Preço'],
              ['filter_fuel',         'Filtro por Combustível'],
              ['filter_transmission', 'Filtro por Câmbio'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <Label className="text-sm text-slate-700 cursor-pointer">{label}</Label>
                <Switch checked={settings[key]} onCheckedChange={v => set(key, v)} />
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-800">Informações nos cards</p>
            <p className="text-xs text-muted-foreground -mt-2">O que aparece nas miniaturas dos veículos</p>
            {([
              ['show_year',         'Ano do modelo'],
              ['show_mileage',      'Quilometragem'],
              ['show_fuel',         'Combustível'],
              ['show_transmission', 'Câmbio'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <Label className="text-sm text-slate-700 cursor-pointer">{label}</Label>
                <Switch checked={settings[key]} onCheckedChange={v => set(key, v)} />
              </div>
            ))}
          </div>

          {/* Botões */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <p className="text-sm font-semibold text-slate-800">Estilo dos botões</p>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Botão "Ver detalhes"</Label>
              <Input value={settings.btn_details_label} onChange={e => set('btn_details_label', e.target.value)} placeholder="Ver detalhes" className="h-10" />
              <div className="flex gap-3">
                {([['filled', 'Preenchido'], ['outline', 'Contorno']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => set('btn_details_style', val)} className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${settings.btn_details_style === val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-border text-muted-foreground hover:border-slate-300'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Botão "WhatsApp"</Label>
              <div className="flex gap-3">
                {([['filled', 'Preenchido (verde)'], ['outline', 'Contorno']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => set('btn_whatsapp_style', val)} className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${settings.btn_whatsapp_style === val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-border text-muted-foreground hover:border-slate-300'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-border pt-4">
              <div>
                <Label className="text-sm text-slate-700 cursor-pointer">Carrossel de destaques</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Exibe os veículos em destaque em uma fila horizontal no topo da vitrine</p>
              </div>
              <Switch checked={settings.featured_carousel} onCheckedChange={v => set('featured_carousel', v)} />
            </div>
            <div className="flex items-center justify-between py-1 border-t border-border pt-4">
              <div>
                <Label className="text-sm text-slate-700 cursor-pointer">Simulador de financiamento</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Exibe simulador de parcelas na página de cada carro</p>
              </div>
              <Switch checked={settings.financing_simulator} onCheckedChange={v => set('financing_simulator', v)} />
            </div>
          </div>

          <SaveBtn onClick={saveStorefront} label="Salvar catálogo" />
        </TabsContent>

        {/* ── CONTATO ────────────────────────────────────────────────────── */}
        <TabsContent value="contato" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-800 mb-3">Endereço</p>
              <Textarea
                value={storeData.address}
                onChange={e => setStore('address', e.target.value)}
                placeholder="Ex: Av. Paulista, 1234 — Bela Vista, São Paulo - SP, 01310-100"
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Aparece no rodapé da vitrine</p>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Redes sociais</p>
              <p className="text-xs text-muted-foreground -mt-1">Cole o link completo. Deixe em branco para não exibir.</p>
              {([
                ['instagram_url', 'Instagram', 'https://instagram.com/suapagina'],
                ['facebook_url',  'Facebook',  'https://facebook.com/suapagina'],
                ['tiktok_url',    'TikTok',    'https://tiktok.com/@suapagina'],
                ['youtube_url',   'YouTube',   'https://youtube.com/@seucanal'],
              ] as const).map(([key, label, placeholder]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-sm text-slate-600">{label}</Label>
                  <Input
                    value={settings[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="h-10"
                  />
                </div>
              ))}
            </div>
          </div>
          <SaveBtn onClick={saveContato} label="Salvar contato" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
