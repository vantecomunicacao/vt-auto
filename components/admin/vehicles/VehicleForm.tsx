'use client'

import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PhotoUpload } from './PhotoUpload'
import {
  vehicleSchema, type VehicleFormData,
  CAR_FEATURES, FUEL_LABELS, TRANSMISSION_LABELS, BODY_TYPE_LABELS, STATUS_LABELS,
} from '@/lib/schemas/vehicle'
import type { Vehicle } from '@/lib/supabase/types'

interface VehicleFormProps {
  storeId: string
  vehicleId?: string        // se preenchido, é edição
  defaultValues?: Partial<VehicleFormData>
  initialPhotos?: { id: string; url: string; storage_path: string; is_cover: boolean; sort_order: number }[]
}

const TAB_FIELDS: Record<string, (keyof VehicleFormData)[]> = {
  geral:     ['brand', 'model', 'year_model', 'year_manuf', 'color'],
  tecnico:   ['fuel', 'transmission', 'mileage'],
  preco:     ['price'],
}

export function VehicleForm({ storeId, vehicleId, defaultValues, initialPhotos = [] }: VehicleFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [savedVehicleId, setSavedVehicleId] = useState<string | null>(vehicleId || null)
  const [activeTab, setActiveTab] = useState('geral')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as Resolver<VehicleFormData>,
    defaultValues: {
      features: [],
      price_negotiable: true,
      featured: false,
      status: 'available',
      fuel: 'flex',
      transmission: 'automatic',
      ...defaultValues,
    },
  })

  async function onSubmit(data: VehicleFormData) {
    setSaving(true)
    const method = savedVehicleId ? 'PATCH' : 'POST'
    const url = savedVehicleId ? `/api/vehicles/${savedVehicleId}` : '/api/vehicles'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'Erro ao salvar veículo.')
      setSaving(false)
      return
    }

    const result = await res.json()
    if (!savedVehicleId) setSavedVehicleId(result.id)

    toast.success(savedVehicleId ? 'Veículo atualizado!' : 'Veículo criado!')
    router.push('/admin/vehicles')
  }

  function tabHasError(tab: string) {
    const fields = TAB_FIELDS[tab] ?? []
    return fields.some(f => errors[f])
  }

  const TAB_LABELS: Record<string, string> = {
    geral: 'Geral', tecnico: 'Técnico', preco: 'Preço', opcionais: 'Opcionais', fotos: 'Fotos',
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, (errs) => {
      // Navega para a primeira aba com erro
      const firstErrTab = Object.keys(TAB_FIELDS).find(tab =>
        TAB_FIELDS[tab].some(f => errs[f])
      )
      if (firstErrTab) setActiveTab(firstErrTab)

      // Toast com campos faltando
      const missing = Object.keys(errs).map(f => ({
        brand: 'Marca', model: 'Modelo', year_model: 'Ano modelo',
        year_manuf: 'Ano fabricação', color: 'Cor', fuel: 'Combustível',
        transmission: 'Câmbio', mileage: 'Quilometragem', price: 'Preço',
      }[f] ?? f)).filter(Boolean)
      toast.error(`Preencha os campos obrigatórios: ${missing.join(', ')}`)
    })}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-slate-100 p-1 rounded-lg h-auto">
          {['geral', 'tecnico', 'preco', 'opcionais', 'fotos'].map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="text-sm capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 relative"
            >
              {TAB_LABELS[tab]}
              {tabHasError(tab) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tab 1: Geral ──────────────────────────────────────────────── */}
        <TabsContent value="geral" className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca *" error={errors.brand?.message}>
              <Input {...register('brand')} placeholder="Toyota" className="h-10" />
            </Field>
            <Field label="Modelo *" error={errors.model?.message}>
              <Input {...register('model')} placeholder="Corolla" className="h-10" />
            </Field>
          </div>

          <Field label="Versão" error={errors.version?.message}>
            <Input {...register('version')} placeholder="XEi 2.0 Flex" className="h-10" />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Ano modelo *" error={errors.year_model?.message}>
              <Input {...register('year_model', { valueAsNumber: true })} type="number" placeholder="2023" className="h-10" />
            </Field>
            <Field label="Ano fabricação *" error={errors.year_manuf?.message}>
              <Input {...register('year_manuf', { valueAsNumber: true })} type="number" placeholder="2022" className="h-10" />
            </Field>
            <Field label="Cor *" error={errors.color?.message}>
              <Input {...register('color')} placeholder="Branco Pérola" className="h-10" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Carroceria" error={errors.body_type?.message}>
              <Controller name="body_type" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BODY_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Portas">
              <Controller name="doors" control={control} render={({ field }) => (
                <Select onValueChange={v => field.onChange(Number(v))} value={field.value?.toString()}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 portas</SelectItem>
                    <SelectItem value="4">4 portas</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Passageiros">
              <Input {...register('seats', { setValueAs: v => v === '' ? undefined : Number(v) })} type="number" placeholder="5" className="h-10" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <Controller name="status" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Destaque">
              <div className="flex items-center gap-3 h-10">
                <Controller name="featured" control={control} render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <span className="text-sm text-muted-foreground">Exibir em destaque na vitrine</span>
              </div>
            </Field>
          </div>

          <Field label="Descrição pública">
            <Textarea {...register('description')} placeholder="Descreva o veículo para os clientes..." rows={3} className="resize-none" />
          </Field>
        </TabsContent>

        {/* ── Tab 2: Técnico ────────────────────────────────────────────── */}
        <TabsContent value="tecnico" className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Combustível *" error={errors.fuel?.message}>
              <Controller name="fuel" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FUEL_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Câmbio *" error={errors.transmission?.message}>
              <Controller name="transmission" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </Field>
          </div>

          <Field label="Quilometragem *" error={errors.mileage?.message}>
            <Input {...register('mileage', { setValueAs: v => v === '' ? undefined : Number(v) })} type="number" placeholder="35000" className="h-10" />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Motor" error={errors.engine?.message}>
              <Input {...register('engine')} placeholder="2.0 Flex" className="h-10" />
            </Field>
            <Field label="Potência" error={errors.power?.message}>
              <Input {...register('power')} placeholder="177cv" className="h-10" />
            </Field>
            <Field label="Torque" error={errors.torque?.message}>
              <Input {...register('torque')} placeholder="20kgfm" className="h-10" />
            </Field>
          </div>

          <Field label="Notas internas (visível só no painel)">
            <Textarea {...register('internal_notes')} placeholder="Anotações sobre o veículo para sua equipe..." rows={3} className="resize-none" />
          </Field>
        </TabsContent>

        {/* ── Tab 3: Preço ─────────────────────────────────────────────── */}
        <TabsContent value="preco" className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço de venda *" error={errors.price?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input {...register('price', { valueAsNumber: true })} type="number" placeholder="89500" className="h-10 pl-9" />
              </div>
            </Field>
            <Field label="Preço anterior (riscado)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input {...register('price_old', { valueAsNumber: true })} type="number" placeholder="95000" className="h-10 pl-9" />
              </div>
            </Field>
          </div>

          <Field label="Aceita negociação">
            <div className="flex items-center gap-3 h-10">
              <Controller name="price_negotiable" control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <span className="text-sm text-muted-foreground">Exibir "aceita negociação" na vitrine</span>
            </div>
          </Field>

          <Field label="Código FIPE">
            <Input {...register('fipe_code')} placeholder="001004-9" className="h-10" />
            <p className="text-xs text-muted-foreground mt-1">Consulte em fipe.org.br</p>
          </Field>
        </TabsContent>

        {/* ── Tab 4: Opcionais ──────────────────────────────────────────── */}
        <TabsContent value="opcionais">
          <p className="text-sm text-muted-foreground mb-4">Marque todos os itens que este veículo possui:</p>
          <Controller
            name="features"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {CAR_FEATURES.map(feature => {
                  const checked = field.value.includes(feature)
                  return (
                    <label
                      key={feature}
                      className="flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm"
                      style={{
                        borderColor: checked ? 'var(--ds-primary-600)' : 'var(--ds-border)',
                        background: checked ? 'var(--ds-primary-50)' : 'transparent',
                        color: checked ? 'var(--ds-primary-800)' : '#334155',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          if (e.target.checked) {
                            field.onChange([...field.value, feature])
                          } else {
                            field.onChange(field.value.filter((f: string) => f !== feature))
                          }
                        }}
                        className="hidden"
                      />
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs text-white"
                        style={{ background: checked ? 'var(--ds-primary-600)' : 'transparent', border: checked ? 'none' : '1.5px solid #CBD5E1' }}
                      >
                        {checked && '✓'}
                      </span>
                      {feature}
                    </label>
                  )
                })}
              </div>
            )}
          />
        </TabsContent>

        {/* ── Tab 5: Fotos ─────────────────────────────────────────────── */}
        <TabsContent value="fotos">
          {savedVehicleId ? (
            <PhotoUpload
              vehicleId={savedVehicleId}
              storeId={storeId}
              initialPhotos={initialPhotos}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-medium mb-1">Salve o veículo primeiro</p>
              <p className="text-xs">As fotos são adicionadas após a criação do veículo.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <div className="flex justify-between items-center mt-8 pt-5 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/vehicles')}
          className="h-9 px-4 text-sm border-border text-slate-700"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="h-9 px-5 text-sm text-white font-medium"
          style={{ background: 'var(--ds-primary-600)' }}
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin mr-2" />Salvando...</>
          ) : (
            savedVehicleId ? 'Salvar alterações' : 'Criar veículo'
          )}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className={`text-sm font-medium ${error ? 'text-red-600' : 'text-slate-700'}`}>{label}</Label>
      <div className={error ? '[&_input]:border-red-400 [&_input]:focus-visible:ring-red-300 [&_.select-trigger]:border-red-400' : ''}>
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
