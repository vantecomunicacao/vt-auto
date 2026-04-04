'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HexColorPicker } from 'react-colorful'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Store, 
  Palette, 
  Layout, 
  Globe, 
  PartyPopper,
  Car,
  Loader2,
  Check,
  X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type OnboardingData = {
  name: string
  phone: string
  city: string
  state: string
  primary_color: string
  secondary_color: string
  layout: 'classic' | 'modern' | 'marketplace'
  slug: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    name: '',
    phone: '',
    city: '',
    state: '',
    primary_color: '#2563EB',
    secondary_color: '#F59E0B',
    layout: 'classic',
    slug: '',
  })

  // Debounce para checagem de slug
  useEffect(() => {
    if (data.slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true)
      try {
        const res = await fetch(`/api/check-subdomain?slug=${data.slug}`)
        const result = await res.json()
        setSlugAvailable(result.available)
      } catch (error) {
        toast.error('Erro ao verificar disponibilidade do subdomínio')
      } finally {
        setCheckingSlug(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [data.slug])

  const nextStep = () => setStep((s) => s + 1)
  const prevStep = () => setStep((s) => s - 1)

  const handleComplete = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Falha ao concluir onboarding')

      // Força novo JWT com store_id — sem isso o PanelLayout não consegue
      // ler a loja via RLS e redireciona de volta para o onboarding (loop).
      const supabase = createClient()
      await supabase.auth.refreshSession()

      toast.success('Loja configurada com sucesso!')
      router.push('/admin/dashboard')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, title: 'Boas-vindas', icon: PartyPopper },
    { id: 2, title: 'Dados da Loja', icon: Store },
    { id: 3, title: 'Visual', icon: Palette },
    { id: 4, title: 'Layout', icon: Layout },
    { id: 5, title: 'Endereço Web', icon: Globe },
    { id: 6, title: 'Conclusão', icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        
        {/* Barra de Progresso */}
        <div className="mb-8 px-4 flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -z-10 -translate-y-1/2" />
          {steps.map((s) => (
            <div 
              key={s.id} 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                step >= s.id 
                  ? "bg-ds-primary-600 border-ds-primary-600 text-white shadow-lg shadow-ds-primary-600/30" 
                  : "bg-white border-slate-200 text-slate-400"
              )}
            >
              {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
            </div>
          ))}
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px] flex flex-col">
          {/* Passo 1: Boas-vindas */}
          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-ds-primary-600/10 rounded-3xl flex items-center justify-center">
                <Car className="w-10 h-10 text-ds-primary-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Seja bem-vindo ao AutoAgente!</h1>
                <p className="text-slate-500 text-lg">Vamos configurar seu portal de revenda em menos de 2 minutos.</p>
              </div>
              <Button onClick={nextStep} size="lg" className="px-10 h-14 text-lg font-bold">
                Começar Configuração
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Passo 2: Dados da Loja */}
          {step === 2 && (
            <div className="flex-1 flex flex-col p-10 animate-in fade-in slide-in-from-right-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Store className="w-6 h-6 text-ds-primary-600" />
                  Identidade da Loja
                </h2>
                <p className="text-slate-500">Insira as informações básicas para o seu site vitrine.</p>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-2">
                  <Label>Nome Fantasia da Loja</Label>
                  <Input 
                    placeholder="Ex: Carros Silva Multimarcas" 
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp de Contato</Label>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Cidade</Label>
                    <Input 
                      placeholder="Ex: São Paulo" 
                      value={data.city}
                      onChange={(e) => setData({ ...data, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado (UF)</Label>
                    <Input 
                      placeholder="Ex: SP" 
                      maxLength={2}
                      value={data.state}
                      onChange={(e) => setData({ ...data, state: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!data.name || !data.phone || !data.city || !data.state}
                >
                  Próximo <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Passo 3: Visual */}
          {step === 3 && (
            <div className="flex-1 flex flex-col p-10 animate-in fade-in slide-in-from-right-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Palette className="w-6 h-6 text-ds-primary-600" />
                  Sua Marca
                </h2>
                <p className="text-slate-500">Escolha a cor principal que dará identidade ao seu site vitrine.</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-10 flex-1">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Cor Primária</Label>
                    <HexColorPicker color={data.primary_color} onChange={(c) => setData({...data, primary_color: c})} className="w-full !h-40" />
                    <Input value={data.primary_color} onChange={(e) => setData({...data, primary_color: e.target.value})} className="mt-2 text-center font-mono" />
                  </div>
                </div>
                
                {/* Preview sutil */}
                <div className="bg-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-full bg-white rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: data.primary_color }}>
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </div>
                    <div className="h-10 w-full rounded-md mt-2" style={{ backgroundColor: data.primary_color }} />
                  </div>
                  <p className="text-xs text-slate-400">Preview dinâmico do seu cabeçalho</p>
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                <Button onClick={nextStep}>Próximo <ChevronRight className="ml-1 w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* Passo 4: Layout */}
          {step === 4 && (
            <div className="flex-1 flex flex-col p-10 animate-in fade-in slide-in-from-right-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Layout className="w-6 h-6 text-ds-primary-600" />
                  Escolha o Estilo
                </h2>
                <p className="text-slate-500">Escolha um layout base para o seu site vitrine.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 flex-1">
                {['classic', 'modern', 'marketplace'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setData({ ...data, layout: l as any })}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                      data.layout === l ? "border-ds-primary-600 bg-ds-primary-600/[0.03]" : "border-slate-100 hover:border-slate-200 bg-white"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", data.layout === l ? "bg-ds-primary-600 text-white" : "bg-slate-100 text-slate-400")}>
                      <Layout className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold capitalize">{l}</h3>
                      <p className="text-xs text-slate-500">{l === 'classic' ? 'Ideal para lojas tradicionais.' : 'Layout moderno focado em fotos.'}</p>
                    </div>
                    {data.layout === l && <CheckCircle2 className="w-6 h-6 text-ds-primary-600" />}
                  </button>
                ))}
              </div>

              <div className="mt-10 flex justify-between">
                <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                <Button onClick={nextStep}>Próximo <ChevronRight className="ml-1 w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* Passo 5: Subdomínio */}
          {step === 5 && (
            <div className="flex-1 flex flex-col p-10 animate-in fade-in slide-in-from-right-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Globe className="w-6 h-6 text-ds-primary-600" />
                  Endereço do Site
                </h2>
                <p className="text-slate-500">Escolha um nome único para o seu subdomínio.</p>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-3">
                  <Label>Subdomínio Desejado</Label>
                  <div className="relative">
                    <Input 
                      placeholder="minhaloja" 
                      className={cn(
                        "h-14 text-xl font-bold pr-40",
                        slugAvailable === true && "border-ds-success focus-visible:ring-ds-success/20",
                        slugAvailable === false && "border-ds-error focus-visible:ring-ds-error/20"
                      )}
                      value={data.slug}
                      onChange={(e) => setData({ ...data, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-slate-400 font-semibold">.autoagente.com.br</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2">
                    {checkingSlug ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span className="text-sm text-slate-500">Verificando...</span>
                      </>
                    ) : slugAvailable === true ? (
                      <>
                        <div className="w-5 h-5 bg-ds-success/10 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-ds-success" />
                        </div>
                        <span className="text-sm text-ds-success font-semibold">Disponível para você!</span>
                      </>
                    ) : slugAvailable === false ? (
                      <>
                        <div className="w-5 h-5 bg-ds-error/10 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-ds-error" />
                        </div>
                        <span className="text-sm text-ds-error font-semibold">Já está em uso. Tente outro.</span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-400">Min. 3 caracteres, apenas letras e números.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!slugAvailable}
                >
                  Próximo <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Passo 6: Conclusão */}
          {step === 6 && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-24 h-24 bg-ds-success/10 rounded-full flex items-center justify-center">
                <PartyPopper className="w-12 h-12 text-ds-success" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight">Tudo pronto!</h1>
                <p className="text-slate-500 text-lg">Sua loja <span className="font-bold text-slate-900">{data.name}</span> foi criada com sucesso.</p>
              </div>
              <div className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sua Vitrine Pública:</span>
                <span className="text-lg font-bold text-ds-primary-600">{data.slug}.autoagente.com.br</span>
              </div>
              <Button 
                onClick={handleComplete} 
                disabled={loading}
                size="lg" 
                className="w-full h-14 text-lg font-bold bg-ds-primary-600"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                {loading ? 'Finalizando...' : 'Concluir e Ir para o Painel'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
