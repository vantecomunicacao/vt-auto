'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type StorefrontSettings = {
  // 0. Tema
  layout_theme: 'padrao' | 'vtlx' | 'vtclass'

  // 1. Layout
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

  // 6. Sobre a loja
  about_enabled: boolean
  about_text: string
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
  financing_simulator: boolean

  // 10. Redes sociais & endereço
  instagram_url: string
  facebook_url: string
  tiktok_url: string
  youtube_url: string
  store_address: string
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
  about_enabled: false,
  about_text: '',
  about_image_url: '',
  show_mileage: true,
  show_year: true,
  show_fuel: true,
  show_transmission: true,
  btn_details_style: 'filled',
  btn_whatsapp_style: 'filled',
  btn_details_label: 'Ver detalhes',
  financing_simulator: true,
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
  youtube_url: '',
  store_address: '',
}

interface Props {
  slug: string
  initialSettings: Partial<StorefrontSettings>
}

export function StorefrontSettingsContent({ slug, initialSettings }: Props) {
  const [settings, setSettings] = useState<StorefrontSettings>({ ...DEFAULTS, ...initialSettings })
  const [saving, setSaving] = useState(false)

  function set<K extends keyof StorefrontSettings>(key: K, value: StorefrontSettings[K]) {
    setSettings(s => {
      const next = { ...s, [key]: value }
      // Se mudar para Padrão, força o estilo de card com sombra
      if (key === 'layout_theme' && value === 'padrao') {
        next.card_style = 'shadow'
      }
      return next
    })
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/storefront-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      toast.success('Configurações da vitrine salvas!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const vitrineUrl = slug ? `/storefront/${slug}` : null

  return (
    <div className="max-w-2xl space-y-6">
      {/* Link para a vitrine */}
      {vitrineUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-700 mb-0.5">URL da sua vitrine</p>
            <code className="text-sm text-blue-900 font-mono">/storefront/{slug}</code>
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

      <Tabs defaultValue="layout">
        <TabsList className="bg-slate-100 p-1 rounded-lg h-auto flex-wrap gap-1">
          {[
            ['layout',   'Layout'],
            ['order',    'Ordenação'],
            ['filters',  'Filtros'],
            ['texts',    'Textos'],
            ['banner',   'Banner'],
            ['about',    'Sobre'],
            ['specs',    'Cards'],
            ['buttons',  'Botões'],
            ['contact',  'Contato'],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-2">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 1. LAYOUT */}
        <TabsContent value="layout" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">

            {/* Theme picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Modelo da vitrine</Label>
              <p className="text-xs text-muted-foreground">Escolha o estilo visual da sua loja</p>
              <div className="grid grid-cols-3 gap-3 mt-2">

                {/* Padrão */}
                <button
                  onClick={() => set('layout_theme', 'padrao')}
                  className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${settings.layout_theme === 'padrao' ? 'border-blue-600 shadow-md' : 'border-border hover:border-slate-300'}`}
                >
                  {settings.layout_theme === 'padrao' && (
                    <span className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd"/></svg>
                    </span>
                  )}
                  {/* Preview Padrão */}
                  <div className="bg-white p-2 space-y-1.5">
                    <div className="h-2 bg-blue-600 rounded-sm w-full" />
                    <div className="grid grid-cols-2 gap-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="bg-gray-100 rounded-lg overflow-hidden">
                          <div className="h-8 bg-gray-200" />
                          <div className="p-1 space-y-0.5">
                            <div className="h-1.5 bg-gray-300 rounded w-4/5" />
                            <div className="h-1.5 bg-blue-400 rounded w-3/5" />
                            <div className="h-3 bg-blue-600 rounded-md w-full mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-white border-t border-gray-100">
                    <p className="text-xs font-semibold text-slate-700">Padrão</p>
                    <p className="text-xs text-muted-foreground">Clássico com botões</p>
                  </div>
                </button>

                {/* VTLX */}
                <button
                  onClick={() => set('layout_theme', 'vtlx')}
                  className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${settings.layout_theme === 'vtlx' ? 'border-blue-600 shadow-md' : 'border-border hover:border-slate-300'}`}
                >
                  {settings.layout_theme === 'vtlx' && (
                    <span className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd"/></svg>
                    </span>
                  )}
                  {/* Preview VTLX */}
                  <div className="bg-gray-50 p-2 space-y-1.5">
                    <div className="h-2 bg-gray-800 rounded-sm w-full" />
                    <div className="h-4 bg-gray-700 rounded-md w-full" />
                    <div className="grid grid-cols-2 gap-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="bg-white rounded-lg overflow-hidden border border-gray-100">
                          <div className="relative h-8 bg-gray-200">
                            <div className="absolute top-0 left-0 right-0 h-2 bg-purple-500" />
                          </div>
                          <div className="p-1 space-y-0.5">
                            <div className="h-1.5 bg-gray-300 rounded w-4/5" />
                            <div className="h-2 bg-gray-800 rounded w-3/5 font-bold" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-white border-t border-gray-100">
                    <p className="text-xs font-semibold text-slate-700">VTLX</p>
                    <p className="text-xs text-muted-foreground">Moderno, estilo marketplace</p>
                  </div>
                </button>

                {/* VTClass */}
                <button
                  onClick={() => set('layout_theme', 'vtclass')}
                  className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${settings.layout_theme === 'vtclass' ? 'border-blue-600 shadow-md' : 'border-border hover:border-slate-300'}`}
                >
                  {settings.layout_theme === 'vtclass' && (
                    <span className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd"/></svg>
                    </span>
                  )}
                  {/* Preview VTClass */}
                  <div className="bg-[#DDDDDD] p-2 space-y-1.5">
                    <div className="h-2 bg-gray-800 rounded-none w-full" />
                    <div className="grid grid-cols-2 gap-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="bg-white overflow-hidden">
                          <div className="relative h-8 bg-gray-200">
                            <div className="absolute bottom-0 left-0 right-0 h-2 bg-amber-600" />
                          </div>
                          <div className="p-1 space-y-0.5 text-center">
                            <div className="h-1.5 bg-gray-800 rounded-none w-4/5 mx-auto" />
                            <div className="h-2 bg-amber-600 rounded-none w-3/5 mx-auto" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-white border-t border-gray-100">
                    <p className="text-xs font-semibold text-slate-700">VTClass</p>
                    <p className="text-xs text-muted-foreground">Clássico, traços retos</p>
                  </div>
                </button>

              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Colunas no grid</Label>
              <p className="text-xs text-muted-foreground">Quantos carros por linha na vitrine</p>
              <div className="flex gap-3 mt-2">
                {(['2', '3', '4'] as const).map(col => (
                  <button
                    key={col}
                    onClick={() => set('grid_cols', col)}
                    className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      settings.grid_cols === col
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-border text-muted-foreground hover:border-slate-300'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Mobile sempre exibe 2 colunas</p>
            </div>
          </div>
        </TabsContent>

        {/* 2. ORDENAÇÃO */}
        <TabsContent value="order" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Ordenação padrão dos veículos</Label>
              <p className="text-xs text-muted-foreground">Como os carros são exibidos por padrão na vitrine</p>
              <Select value={settings.sort_by} onValueChange={v => set('sort_by', v as StorefrontSettings['sort_by'])}>
                <SelectTrigger className="h-10 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Destaques primeiro</SelectItem>
                  <SelectItem value="created_at_desc">Mais recentes primeiro</SelectItem>
                  <SelectItem value="price_asc">Menor preço primeiro</SelectItem>
                  <SelectItem value="price_desc">Maior preço primeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* 3. FILTROS */}
        <TabsContent value="filters" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <p className="text-sm text-muted-foreground">Escolha quais filtros aparecem na vitrine para os visitantes</p>
            {([
              ['filter_brand',        'Filtro por Marca'],
              ['filter_price',        'Filtro por Faixa de Preço'],
              ['filter_fuel',         'Filtro por Combustível'],
              ['filter_transmission', 'Filtro por Câmbio'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <Label className="text-sm text-slate-700 cursor-pointer">{label}</Label>
                <Switch
                  checked={settings[key]}
                  onCheckedChange={v => set(key, v)}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 4. TEXTOS */}
        <TabsContent value="texts" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Título da página</Label>
              <Input
                value={settings.page_title}
                onChange={e => set('page_title', e.target.value)}
                placeholder="Ex: Encontre seu próximo carro"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Slogan / subtítulo</Label>
              <Input
                value={settings.page_slogan}
                onChange={e => set('page_slogan', e.target.value)}
                placeholder="Ex: Os melhores veículos seminovos da região"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Texto do botão principal</Label>
              <Input
                value={settings.cta_label}
                onChange={e => set('cta_label', e.target.value)}
                placeholder="Ver detalhes"
                className="h-10"
              />
            </div>
          </div>
        </TabsContent>

        {/* 5. BANNER */}
        <TabsContent value="banner" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-slate-700">Exibir banner no topo</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Bloco de destaque acima dos carros</p>
              </div>
              <Switch
                checked={settings.banner_enabled}
                onCheckedChange={v => set('banner_enabled', v)}
              />
            </div>
            {settings.banner_enabled && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Título do banner</Label>
                  <Input
                    value={settings.banner_title}
                    onChange={e => set('banner_title', e.target.value)}
                    placeholder="Ex: Novidades da semana"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Subtítulo do banner</Label>
                  <Input
                    value={settings.banner_subtitle}
                    onChange={e => set('banner_subtitle', e.target.value)}
                    placeholder="Ex: Confira os veículos em destaque"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">URL da imagem de fundo</Label>
                  <Input
                    value={settings.banner_image_url}
                    onChange={e => set('banner_image_url', e.target.value)}
                    placeholder="https://..."
                    className="h-10"
                  />
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* 6. SOBRE A LOJA */}
        <TabsContent value="about" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-slate-700">Exibir seção "Sobre a loja"</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Bloco com texto livre e foto da loja</p>
              </div>
              <Switch
                checked={settings.about_enabled}
                onCheckedChange={v => set('about_enabled', v)}
              />
            </div>
            {settings.about_enabled && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Texto sobre a loja</Label>
                  <Textarea
                    value={settings.about_text}
                    onChange={e => set('about_text', e.target.value)}
                    placeholder="Conte um pouco sobre sua loja, diferenciais, tempo de mercado..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">URL da foto da loja</Label>
                  <Input
                    value={settings.about_image_url}
                    onChange={e => set('about_image_url', e.target.value)}
                    placeholder="https://..."
                    className="h-10"
                  />
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* 7. SPECS NOS CARDS */}
        <TabsContent value="specs" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <p className="text-sm text-muted-foreground">Escolha quais informações aparecem nas miniaturas dos carros</p>
            {([
              ['show_year',         'Ano do modelo'],
              ['show_mileage',      'Quilometragem'],
              ['show_fuel',         'Combustível'],
              ['show_transmission', 'Câmbio'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <Label className="text-sm text-slate-700 cursor-pointer">{label}</Label>
                <Switch
                  checked={settings[key]}
                  onCheckedChange={v => set(key, v)}
                />
              </div>
            ))}

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-3">Funcionalidades na página do veículo</p>
              <div className="flex items-center justify-between py-1">
                <div>
                  <Label className="text-sm text-slate-700 cursor-pointer">Simulador de financiamento</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Exibe simulador de parcelas na página de cada carro</p>
                </div>
                <Switch
                  checked={settings.financing_simulator}
                  onCheckedChange={v => set('financing_simulator', v)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 10. CONTATO */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Endereço completo</p>
              <p className="text-xs text-muted-foreground mb-2">Aparece no rodapé da vitrine</p>
              <Textarea
                value={settings.store_address}
                onChange={e => set('store_address', e.target.value)}
                placeholder="Ex: Av. Paulista, 1234 — Bela Vista, São Paulo - SP, 01310-100"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">Redes sociais</p>
              <p className="text-xs text-muted-foreground -mt-1">Cole o link completo do perfil. Deixe em branco para não exibir.</p>

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
        </TabsContent>

        {/* 8. BOTÕES */}
        <TabsContent value="buttons" className="space-y-4 mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Botão "Ver detalhes"</Label>
              <div className="space-y-2">
                <Input
                  value={settings.btn_details_label}
                  onChange={e => set('btn_details_label', e.target.value)}
                  placeholder="Ver detalhes"
                  className="h-10"
                />
                <div className="flex gap-3">
                  {([['filled', 'Preenchido'], ['outline', 'Contorno']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => set('btn_details_style', val)}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                        settings.btn_details_style === val
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-border text-muted-foreground hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Botão "WhatsApp"</Label>
              <div className="flex gap-3">
                {([['filled', 'Preenchido (verde)'], ['outline', 'Contorno']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => set('btn_whatsapp_style', val)}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      settings.btn_whatsapp_style === val
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-border text-muted-foreground hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={save}
          disabled={saving}
          className="h-9 px-6 text-sm text-white"
          style={{ background: 'var(--ds-primary-600)' }}
        >
          {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Salvando...</> : 'Salvar configurações'}
        </Button>
      </div>
    </div>
  )
}
