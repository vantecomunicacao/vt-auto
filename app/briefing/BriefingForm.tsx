'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import {
  briefingSchema,
  PAYMENT_METHOD_OPTIONS,
  type Briefing,
  type Salesperson,
} from '@/lib/schemas/briefing'

import { BriefingSuccess } from './BriefingSuccess'

type FormState = {
  store_name: string
  legal_name: string
  cnpj: string
  responsible_name: string
  whatsapp: string
  landline: string
  email: string
  address: string
  city: string
  state: string
  zip_code: string
  website_url: string
  social_links: string

  logo_note: string
  primary_color: string
  secondary_color: string
  slogan: string

  business_summary: string
  differentiators: string
  payment_methods: string[]
  payment_methods_other: string
  accepts_trade_in: 'yes' | 'no' | 'with_rules' | ''
  trade_in_rules: string
  test_drive_policy: string
  delivery_policy: string

  agent_name: string
  agent_tone: 'professional' | 'friendly' | 'casual' | ''
  agent_voice_note: string
  allow_slang: 'yes' | 'no' | ''
  allow_emoji: 'yes' | 'no' | ''
  greeting: string
  forbidden_phrases: string

  qualification_fields: string
  handoff_triggers: string
  end_conversation_triggers: string

  salespeople: Salesperson[]
  manager_phone: string

  business_hours: string
  off_hours_behavior: 'continue' | 'inform_return' | ''
  follow_up_enabled: 'yes' | 'no' | ''
  follow_up_window: string

  knowledge_assets: string
  faq: string

  whatsapp_age: 'lt_30d' | '1_3m' | '3_12m' | 'gt_12m' | 'no_number' | ''
  whatsapp_type: 'common' | 'business' | 'unknown' | ''
  whatsapp_exclusive: 'yes' | 'no' | 'unknown' | ''
  custom_domain: string
  dns_owner: string

  /** Honeypot: humano deixa vazio. */
  website: string
}

const INITIAL: FormState = {
  store_name: '', legal_name: '', cnpj: '', responsible_name: '',
  whatsapp: '', landline: '', email: '', address: '',
  city: '', state: '', zip_code: '', website_url: '', social_links: '',
  logo_note: '', primary_color: '#2563EB', secondary_color: '#1E40AF', slogan: '',
  business_summary: '', differentiators: '',
  payment_methods: [], payment_methods_other: '',
  accepts_trade_in: '', trade_in_rules: '', test_drive_policy: '', delivery_policy: '',
  agent_name: '', agent_tone: '', agent_voice_note: '',
  allow_slang: '', allow_emoji: '', greeting: '', forbidden_phrases: '',
  qualification_fields: '', handoff_triggers: '', end_conversation_triggers: '',
  salespeople: [{ name: '', phone: '' }],
  manager_phone: '',
  business_hours: '', off_hours_behavior: '', follow_up_enabled: '', follow_up_window: '',
  knowledge_assets: '', faq: '',
  whatsapp_age: '', whatsapp_type: '', whatsapp_exclusive: '',
  custom_domain: '', dns_owner: '',
  website: '',
}

const SECTIONS = [
  { id: 's1', title: '1. Identidade da loja' },
  { id: 's2', title: '2. Marca e visual' },
  { id: 's3', title: '3. O negócio' },
  { id: 's4', title: '4. Personalidade do agente' },
  { id: 's5', title: '5. Qualificação e handoff' },
  { id: 's6', title: '6. Vendedores' },
  { id: 's7', title: '7. Horário e operação' },
  { id: 's8', title: '8. Base de conhecimento' },
  { id: 's9', title: '9. Integrações' },
] as const

export function BriefingForm() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<Briefing | null>(null)

  const totalRequired = 30 // referência aproximada para a barra de progresso
  const filledCount = useMemo(() => {
    const required: (keyof FormState)[] = [
      'store_name','cnpj','responsible_name','whatsapp','email','address','city','state',
      'primary_color','secondary_color',
      'business_summary','differentiators','accepts_trade_in',
      'agent_name','agent_tone','agent_voice_note','allow_slang','allow_emoji','greeting',
      'qualification_fields','handoff_triggers',
      'business_hours','off_hours_behavior','follow_up_enabled',
      'whatsapp_age','whatsapp_type','whatsapp_exclusive',
    ]
    let count = required.filter(k => {
      const v = form[k]
      return Array.isArray(v) ? v.length > 0 : Boolean(v)
    }).length
    if (form.payment_methods.length > 0) count++
    if (form.salespeople.some(s => s.name && s.phone)) count++
    return count
  }, [form])

  const progress = Math.min(100, Math.round((filledCount / totalRequired) * 100))

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key as string]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[key as string]
        return next
      })
    }
  }

  function togglePayment(value: string) {
    setForm(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(value)
        ? prev.payment_methods.filter(v => v !== value)
        : [...prev.payment_methods, value],
    }))
  }

  function addSalesperson() {
    if (form.salespeople.length >= 20) return
    setForm(prev => ({ ...prev, salespeople: [...prev.salespeople, { name: '', phone: '' }] }))
  }

  function updateSalesperson(idx: number, field: keyof Salesperson, value: string) {
    setForm(prev => ({
      ...prev,
      salespeople: prev.salespeople.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }))
    const errKey = `salespeople.${idx}.${field}`
    if (errors[errKey]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[errKey]
        return next
      })
    }
  }

  function removeSalesperson(idx: number) {
    if (form.salespeople.length <= 1) return
    setForm(prev => ({
      ...prev,
      salespeople: prev.salespeople.filter((_, i) => i !== idx),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    // Remove vendedores totalmente vazios (cartão criado por engano e nunca preenchido)
    const cleanedSalespeople = form.salespeople.filter(s => s.name.trim() || s.phone.trim())
    const payload: FormState = {
      ...form,
      salespeople: cleanedSalespeople.length > 0 ? cleanedSalespeople : form.salespeople,
    }
    if (cleanedSalespeople.length !== form.salespeople.length && cleanedSalespeople.length > 0) {
      setForm(payload)
    }

    const parsed = briefingSchema.safeParse(payload)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      // rola para o primeiro erro
      const firstKey = parsed.error.issues[0]?.path[0]
      if (firstKey) {
        const el = document.querySelector(`[data-field="${String(firstKey)}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      toast.error('Confira os campos destacados antes de enviar.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error || 'Erro ao enviar o briefing. Tente novamente.')
        setSubmitting(false)
        return
      }
      if (json.duplicated) {
        toast.success('Recebemos seu briefing! (já tínhamos um envio recente, então só atualizamos)')
      } else {
        toast.success('Briefing enviado com sucesso!')
      }
      setSubmitted(parsed.data)
    } catch {
      toast.error('Erro de rede. Verifique sua conexão e tente novamente.')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return <BriefingSuccess briefing={submitted} />
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Image
            src="/brand/cargrow-logo-light.png"
            alt="CarGrow"
            width={120}
            height={32}
            className="h-7 w-auto dark:hidden"
            priority
          />
          <Image
            src="/brand/cargrow-logo-dark.png"
            alt="CarGrow"
            width={120}
            height={32}
            className="hidden h-7 w-auto dark:block"
            priority
          />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {progress}% preenchido
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Briefing de configuração</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha as informações abaixo para configurarmos sua loja na CarGrow. Leva entre 10 e 15 minutos.
            Ao final, você poderá baixar uma cópia em PDF, Word ou enviar por WhatsApp.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Honeypot — invisível pra humano */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Não preencha este campo
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={e => update('website', e.target.value)}
              />
            </label>
          </div>

          {/* SEÇÃO 1 */}
          <Section title="1. Identidade da loja" subtitle="Dados básicos da empresa">
            <Field id="store_name" label="Nome da loja" required error={errors.store_name}>
              <Input value={form.store_name} onChange={e => update('store_name', e.target.value)} placeholder="Ex.: AutoX Veículos" />
            </Field>
            <Field id="legal_name" label="Razão social" hint="Como aparece no CNPJ" error={errors.legal_name}>
              <Input value={form.legal_name} onChange={e => update('legal_name', e.target.value)} />
            </Field>
            <Field id="cnpj" label="CNPJ" required error={errors.cnpj}>
              <Input value={form.cnpj} onChange={e => update('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            </Field>
            <Field id="responsible_name" label="Nome do responsável (dono / decisor)" required error={errors.responsible_name}>
              <Input value={form.responsible_name} onChange={e => update('responsible_name', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="whatsapp" label="WhatsApp comercial" required error={errors.whatsapp}>
                <Input value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="(11) 99999-9999" />
              </Field>
              <Field id="landline" label="Telefone fixo" error={errors.landline}>
                <Input value={form.landline} onChange={e => update('landline', e.target.value)} placeholder="(11) 3333-3333" />
              </Field>
            </div>
            <Field id="email" label="E-mail comercial" required error={errors.email}>
              <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            </Field>
            <Field id="address" label="Endereço completo" required hint="Rua, número, complemento, bairro" error={errors.address}>
              <Input value={form.address} onChange={e => update('address', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_120px_140px]">
              <Field id="city" label="Cidade" required error={errors.city}>
                <Input value={form.city} onChange={e => update('city', e.target.value)} />
              </Field>
              <Field id="state" label="UF" required error={errors.state}>
                <Input maxLength={2} value={form.state} onChange={e => update('state', e.target.value.toUpperCase())} placeholder="SP" />
              </Field>
              <Field id="zip_code" label="CEP" error={errors.zip_code}>
                <Input value={form.zip_code} onChange={e => update('zip_code', e.target.value)} placeholder="00000-000" />
              </Field>
            </div>
            <Field id="website_url" label="Site atual" error={errors.website_url}>
              <Input value={form.website_url} onChange={e => update('website_url', e.target.value)} placeholder="https://" />
            </Field>
            <Field id="social_links" label="Redes sociais" hint="Instagram, Facebook, etc — uma por linha" error={errors.social_links}>
              <Textarea rows={2} value={form.social_links} onChange={e => update('social_links', e.target.value)} />
            </Field>
          </Section>

          {/* SEÇÃO 2 */}
          <Section title="2. Marca e visual" subtitle="Como sua marca se apresenta">
            <Field id="logo_note" label="Logo" hint="Você poderá enviar o arquivo PNG/SVG depois — descreva aqui se já tem (ex.: 'Tenho em PNG fundo transparente')" error={errors.logo_note}>
              <Textarea rows={2} value={form.logo_note} onChange={e => update('logo_note', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="primary_color" label="Cor primária" required hint="Formato HEX (#RRGGBB)" error={errors.primary_color}>
                <ColorInput value={form.primary_color} onChange={v => update('primary_color', v)} />
              </Field>
              <Field id="secondary_color" label="Cor secundária" required error={errors.secondary_color}>
                <ColorInput value={form.secondary_color} onChange={v => update('secondary_color', v)} />
              </Field>
            </div>
            <Field id="slogan" label="Slogan / posicionamento" hint="1 linha, opcional" error={errors.slogan}>
              <Input value={form.slogan} onChange={e => update('slogan', e.target.value)} />
            </Field>
          </Section>

          {/* SEÇÃO 3 */}
          <Section title="3. O negócio" subtitle="O que a IA precisa saber sobre sua loja">
            <Field id="business_summary" label="Em 2-3 frases: o que vocês vendem (e o que NÃO vendem)" required error={errors.business_summary}>
              <Textarea rows={3} value={form.business_summary} onChange={e => update('business_summary', e.target.value)} placeholder="Ex.: Vendemos seminovos populares até R$ 80 mil. Não trabalhamos com motos nem veículos importados." />
            </Field>
            <Field id="differentiators" label="3 diferenciais que o agente deve sempre destacar" required error={errors.differentiators}>
              <Textarea rows={3} value={form.differentiators} onChange={e => update('differentiators', e.target.value)} placeholder="Ex.: 1) Garantia de 1 ano em todos os carros. 2) Laudo cautelar incluso. 3) Financiamento aprovado em 1 hora." />
            </Field>
            <Field id="payment_methods" label="Formas de pagamento aceitas" required error={errors.payment_methods}>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHOD_OPTIONS.map(opt => (
                  <Chip
                    key={opt.value}
                    selected={form.payment_methods.includes(opt.value)}
                    onClick={() => togglePayment(opt.value)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </Field>
            {form.payment_methods.includes('other') && (
              <Field id="payment_methods_other" label="Detalhe a forma 'Outro'" error={errors.payment_methods_other}>
                <Input value={form.payment_methods_other} onChange={e => update('payment_methods_other', e.target.value)} />
              </Field>
            )}
            <Field id="accepts_trade_in" label="Aceitam veículo na troca?" required error={errors.accepts_trade_in}>
              <RadioGroup
                value={form.accepts_trade_in}
                onChange={v => update('accepts_trade_in', v as FormState['accepts_trade_in'])}
                options={[
                  { value: 'yes', label: 'Sim' },
                  { value: 'no', label: 'Não' },
                  { value: 'with_rules', label: 'Sim, com regras' },
                ]}
              />
            </Field>
            {form.accepts_trade_in === 'with_rules' && (
              <Field id="trade_in_rules" label="Quais regras?" error={errors.trade_in_rules}>
                <Textarea rows={2} value={form.trade_in_rules} onChange={e => update('trade_in_rules', e.target.value)} placeholder="Ex.: só carros até 10 anos, não aceitamos motos" />
              </Field>
            )}
            <Field id="test_drive_policy" label="Política de test drive" hint="Precisa agendar? Exige CNH? Cobra algo?" error={errors.test_drive_policy}>
              <Textarea rows={2} value={form.test_drive_policy} onChange={e => update('test_drive_policy', e.target.value)} />
            </Field>
            <Field id="delivery_policy" label="Frete / entrega para outras cidades" hint="Como funciona, qual o custo, até onde entregam" error={errors.delivery_policy}>
              <Textarea rows={2} value={form.delivery_policy} onChange={e => update('delivery_policy', e.target.value)} />
            </Field>
          </Section>

          {/* SEÇÃO 4 */}
          <Section title="4. Personalidade do agente" subtitle="O DNA da IA — alimenta o prompt">
            <Field id="agent_name" label="Nome do agente" required hint="Como ele se apresenta no WhatsApp" error={errors.agent_name}>
              <Input value={form.agent_name} onChange={e => update('agent_name', e.target.value)} placeholder="Ex.: Léo da AutoX" />
            </Field>
            <Field id="agent_tone" label="Tom de voz" required error={errors.agent_tone}>
              <RadioGroup
                value={form.agent_tone}
                onChange={v => update('agent_tone', v as FormState['agent_tone'])}
                options={[
                  { value: 'professional', label: 'Profissional' },
                  { value: 'friendly', label: 'Amigável' },
                  { value: 'casual', label: 'Descontraído' },
                ]}
              />
            </Field>
            <Field id="agent_voice_note" label="Em 1 frase: como gostaria que ele 'soasse'?" required error={errors.agent_voice_note}>
              <Textarea rows={2} value={form.agent_voice_note} onChange={e => update('agent_voice_note', e.target.value)} placeholder="Ex.: amigo que entende de carro, sem forçar venda" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="allow_slang" label="Pode usar gírias?" required error={errors.allow_slang}>
                <RadioGroup
                  value={form.allow_slang}
                  onChange={v => update('allow_slang', v as FormState['allow_slang'])}
                  options={[{ value: 'yes', label: 'Sim' }, { value: 'no', label: 'Não' }]}
                />
              </Field>
              <Field id="allow_emoji" label="Pode usar emoji?" required error={errors.allow_emoji}>
                <RadioGroup
                  value={form.allow_emoji}
                  onChange={v => update('allow_emoji', v as FormState['allow_emoji'])}
                  options={[{ value: 'yes', label: 'Sim' }, { value: 'no', label: 'Não' }]}
                />
              </Field>
            </div>
            <Field id="greeting" label="Saudação inicial" required hint="Primeira mensagem que o agente envia ao receber um lead novo" error={errors.greeting}>
              <Textarea rows={3} value={form.greeting} onChange={e => update('greeting', e.target.value)} placeholder="Ex.: Olá! Sou o Léo da AutoX. Vi seu interesse no nosso estoque — qual carro chamou sua atenção?" />
            </Field>
            <Field id="forbidden_phrases" label="Algo que o agente JAMAIS pode dizer ou prometer?" error={errors.forbidden_phrases}>
              <Textarea rows={2} value={form.forbidden_phrases} onChange={e => update('forbidden_phrases', e.target.value)} placeholder="Ex.: nunca prometer aprovação de financiamento; nunca dar preço de avaliação sem ver o carro" />
            </Field>
          </Section>

          {/* SEÇÃO 5 */}
          <Section title="5. Qualificação e handoff" subtitle="O que coletar e quando passar pra um humano">
            <Field id="qualification_fields" label="Informações OBRIGATÓRIAS que o agente deve coletar antes de passar pro vendedor" required error={errors.qualification_fields}>
              <Textarea rows={3} value={form.qualification_fields} onChange={e => update('qualification_fields', e.target.value)} placeholder="Ex.: veículo de interesse, orçamento, forma de pagamento, se tem carro na troca, cidade do cliente" />
            </Field>
            <Field id="handoff_triggers" label="Quando o agente deve passar a conversa para um humano?" required error={errors.handoff_triggers}>
              <Textarea rows={3} value={form.handoff_triggers} onChange={e => update('handoff_triggers', e.target.value)} placeholder="Ex.: quando o cliente pedir desconto, quando quiser agendar visita, quando perguntar sobre financiamento específico" />
            </Field>
            <Field id="end_conversation_triggers" label="Quando a conversa deve ser encerrada pelo agente?" error={errors.end_conversation_triggers}>
              <Textarea rows={2} value={form.end_conversation_triggers} onChange={e => update('end_conversation_triggers', e.target.value)} placeholder="Ex.: quando o cliente disser que não tem interesse" />
            </Field>
          </Section>

          {/* SEÇÃO 6 */}
          <Section title="6. Vendedores (round-robin)" subtitle="A IA distribui leads entre os vendedores em rodízio. Preencha o cartão abaixo — só clique em 'Adicionar' se houver mais de um vendedor.">
            <div data-field="salespeople" className="space-y-3">
              {form.salespeople.map((s, idx) => {
                const nameError = errors[`salespeople.${idx}.name`]
                const phoneError = errors[`salespeople.${idx}.phone`]
                return (
                  <div key={idx} className="rounded-lg border bg-background p-3">
                    <div className="flex items-start gap-2">
                      <div className="grid flex-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Nome do vendedor {idx + 1}</Label>
                          <Input
                            value={s.name}
                            onChange={e => updateSalesperson(idx, 'name', e.target.value)}
                            placeholder="Ex.: João Silva"
                            aria-invalid={Boolean(nameError)}
                          />
                          {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                          <Input
                            value={s.phone}
                            onChange={e => updateSalesperson(idx, 'phone', e.target.value)}
                            placeholder="(11) 99999-9999"
                            aria-invalid={Boolean(phoneError)}
                          />
                          {phoneError && <p className="mt-1 text-xs text-destructive">{phoneError}</p>}
                        </div>
                      </div>
                      {form.salespeople.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSalesperson(idx)}
                          aria-label="Remover vendedor"
                          className="mt-5"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
              {errors['salespeople'] && <p className="text-xs text-destructive">{errors['salespeople']}</p>}
              <Button type="button" variant="outline" size="sm" onClick={addSalesperson}>
                <Plus size={14} /> Adicionar outro vendedor
              </Button>
            </div>
            <Field id="manager_phone" label="Telefone do gerente para notificações" hint="Recebe alerta quando IA é interrompida — opcional" error={errors.manager_phone}>
              <Input value={form.manager_phone} onChange={e => update('manager_phone', e.target.value)} placeholder="(11) 99999-9999" />
            </Field>
          </Section>

          {/* SEÇÃO 7 */}
          <Section title="7. Horário e operação" subtitle="Quando o time humano está disponível">
            <Field id="business_hours" label="Horário de atendimento por dia da semana" required error={errors.business_hours}>
              <Textarea rows={3} value={form.business_hours} onChange={e => update('business_hours', e.target.value)} placeholder="Ex.: seg-sex 8h-18h, sáb 8h-12h, dom fechado" />
            </Field>
            <Field id="off_hours_behavior" label="Fora do horário, o agente:" required error={errors.off_hours_behavior}>
              <RadioGroup
                value={form.off_hours_behavior}
                onChange={v => update('off_hours_behavior', v as FormState['off_hours_behavior'])}
                options={[
                  { value: 'continue', label: 'Continua respondendo normalmente' },
                  { value: 'inform_return', label: 'Avisa que time humano retorna no próximo dia útil' },
                ]}
              />
            </Field>
            <Field id="follow_up_enabled" label="Quer follow-up automático para leads que não respondem?" required error={errors.follow_up_enabled}>
              <RadioGroup
                value={form.follow_up_enabled}
                onChange={v => update('follow_up_enabled', v as FormState['follow_up_enabled'])}
                options={[{ value: 'yes', label: 'Sim' }, { value: 'no', label: 'Não' }]}
              />
            </Field>
            {form.follow_up_enabled === 'yes' && (
              <Field id="follow_up_window" label="Em quantas horas / dias?" error={errors.follow_up_window}>
                <Input value={form.follow_up_window} onChange={e => update('follow_up_window', e.target.value)} placeholder="Ex.: 24h, depois 3 dias, depois 7 dias" />
              </Field>
            )}
          </Section>

          {/* SEÇÃO 8 */}
          <Section title="8. Base de conhecimento" subtitle="Material que o agente consulta para responder dúvidas">
            <Field id="knowledge_assets" label="Material pronto que será enviado" hint="FAQ, tabela de financiamento, política de troca etc — descreva aqui o que existe; arquivos serão enviados depois" error={errors.knowledge_assets}>
              <Textarea rows={3} value={form.knowledge_assets} onChange={e => update('knowledge_assets', e.target.value)} />
            </Field>
            <Field id="faq" label="5 perguntas frequentes + resposta ideal" hint="As que você responde toda semana — o agente vai usar como referência" error={errors.faq}>
              <Textarea rows={6} value={form.faq} onChange={e => update('faq', e.target.value)} placeholder="P: Vocês fazem entrega?\nR: Sim, em toda região metropolitana sem custo." />
            </Field>
          </Section>

          {/* SEÇÃO 9 */}
          <Section title="9. Integrações" subtitle="Sobre o número de WhatsApp e domínio">
            <Field id="whatsapp_age" label="Já tem um número de WhatsApp ativo há quanto tempo?" required hint="Importante: número novo tem risco de bloqueio ao disparar muitas mensagens. O ideal é pelo menos 30-60 dias de uso real." error={errors.whatsapp_age}>
              <RadioGroup
                value={form.whatsapp_age}
                onChange={v => update('whatsapp_age', v as FormState['whatsapp_age'])}
                options={[
                  { value: 'lt_30d', label: 'Menos de 30 dias' },
                  { value: '1_3m', label: 'Entre 1 e 3 meses' },
                  { value: '3_12m', label: 'Entre 3 e 12 meses' },
                  { value: 'gt_12m', label: 'Mais de 1 ano' },
                  { value: 'no_number', label: 'Ainda não tenho número ativo' },
                ]}
              />
            </Field>
            <Field id="whatsapp_type" label="Esse número é WhatsApp comum ou Business?" required error={errors.whatsapp_type}>
              <RadioGroup
                value={form.whatsapp_type}
                onChange={v => update('whatsapp_type', v as FormState['whatsapp_type'])}
                options={[
                  { value: 'common', label: 'WhatsApp comum' },
                  { value: 'business', label: 'WhatsApp Business' },
                  { value: 'unknown', label: 'Não sei informar' },
                ]}
              />
            </Field>
            <Field id="whatsapp_exclusive" label="O número está livre para uso exclusivo na nossa plataforma?" required hint="Não pode estar conectado em outro CRM ou chip ao mesmo tempo" error={errors.whatsapp_exclusive}>
              <RadioGroup
                value={form.whatsapp_exclusive}
                onChange={v => update('whatsapp_exclusive', v as FormState['whatsapp_exclusive'])}
                options={[
                  { value: 'yes', label: 'Sim, está livre' },
                  { value: 'no', label: 'Não, está em uso em outro sistema' },
                  { value: 'unknown', label: 'Não sei informar' },
                ]}
              />
            </Field>
            <Field id="custom_domain" label="Domínio próprio para o storefront" hint="Opcional — ex.: estoque.autox.com.br" error={errors.custom_domain}>
              <Input value={form.custom_domain} onChange={e => update('custom_domain', e.target.value)} placeholder="estoque.suaempresa.com.br" />
            </Field>
            {form.custom_domain && (
              <Field id="dns_owner" label="Quem cuida do DNS?" error={errors.dns_owner}>
                <Input value={form.dns_owner} onChange={e => update('dns_owner', e.target.value)} placeholder="Ex.: agência X / TI interna / eu mesmo" />
              </Field>
            )}
          </Section>

          {/* Submit */}
          <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Ao enviar, você poderá baixar uma cópia em PDF, Word ou compartilhar por WhatsApp.
              </p>
              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Enviar briefing
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

// ───────────── helpers de UI ─────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
      <div className="mb-5 border-b pb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({
  id,
  label,
  hint,
  required,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div data-field={id} className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div aria-invalid={Boolean(error)}>{children}</div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <div
        className="h-8 w-10 rounded-lg border"
        style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(value) ? value : 'transparent' }}
      />
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder="#2563EB" className="font-mono" />
    </div>
  )
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}

function RadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | ''
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-sm transition-colors',
            value === opt.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background hover:bg-muted'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
