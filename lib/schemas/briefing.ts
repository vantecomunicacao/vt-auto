import { z } from 'zod'

const trimmed = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`)

const requiredText = (max: number, msg: string) =>
  trimmed(max).min(1, msg)

const optionalText = (max: number) =>
  trimmed(max).optional().or(z.literal('').transform(() => undefined))

const phoneRegex = /^\+?\d[\d\s().\-]{8,18}\d$/

const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/

const colorRegex = /^#[0-9A-Fa-f]{6}$/

export const salespersonSchema = z.object({
  name:  requiredText(80, 'Informe o nome do vendedor'),
  phone: trimmed(20).regex(phoneRegex, 'Telefone inválido'),
})

export const briefingSchema = z.object({
  // Honeypot — campo invisível. Se chegar preenchido, é bot.
  website: z.string().max(0, 'spam detected').optional().or(z.literal('')),

  // 1. Identidade da loja
  store_name:        requiredText(120, 'Informe o nome da loja'),
  legal_name:        optionalText(160),
  cnpj:              trimmed(20).regex(cnpjRegex, 'CNPJ inválido'),
  responsible_name:  requiredText(120, 'Informe o nome do responsável'),
  whatsapp:          trimmed(20).regex(phoneRegex, 'WhatsApp inválido'),
  landline:          optionalText(20),
  email:             trimmed(160).email('E-mail inválido'),
  address:           requiredText(240, 'Informe o endereço'),
  city:              requiredText(80, 'Informe a cidade'),
  state:             trimmed(2).length(2, 'UF deve ter 2 letras'),
  zip_code:          optionalText(12),
  website_url:       optionalText(240),
  social_links:      optionalText(500),

  // 2. Marca e visual
  logo_note:         optionalText(500),
  primary_color:     trimmed(7).regex(colorRegex, 'Use formato HEX (#RRGGBB)'),
  secondary_color:   trimmed(7).regex(colorRegex, 'Use formato HEX (#RRGGBB)'),
  slogan:            optionalText(160),

  // 3. O negócio
  business_summary:  requiredText(1000, 'Descreva o negócio em poucas linhas'),
  differentiators:   requiredText(800, 'Liste os 3 principais diferenciais'),
  payment_methods:   z.array(z.string().max(40)).min(1, 'Selecione pelo menos uma forma de pagamento'),
  payment_methods_other: optionalText(160),
  accepts_trade_in:  z.enum(['yes', 'no', 'with_rules'], { message: 'Selecione uma opção' }),
  trade_in_rules:    optionalText(500),
  test_drive_policy: optionalText(500),
  delivery_policy:   optionalText(500),

  // 4. Personalidade do agente
  agent_name:        requiredText(60, 'Informe o nome do agente'),
  agent_tone:        z.enum(['professional', 'friendly', 'casual'], { message: 'Selecione um tom' }),
  agent_voice_note:  requiredText(500, 'Descreva como o agente deve soar'),
  allow_slang:       z.enum(['yes', 'no']),
  allow_emoji:       z.enum(['yes', 'no']),
  greeting:          requiredText(500, 'Escreva a saudação inicial'),
  forbidden_phrases: optionalText(800),

  // 5. Qualificação e handoff
  qualification_fields: requiredText(800, 'Liste as informações que o agente deve coletar'),
  handoff_triggers:     requiredText(800, 'Descreva quando passar pra um humano'),
  end_conversation_triggers: optionalText(800),

  // 6. Vendedores
  salespeople:        z.array(salespersonSchema).min(1, 'Inclua pelo menos um vendedor').max(20, 'Máximo 20 vendedores'),
  manager_phone:      optionalText(20),

  // 7. Horário e operação
  business_hours:     requiredText(500, 'Descreva o horário de atendimento'),
  off_hours_behavior: z.enum(['continue', 'inform_return'], { message: 'Selecione uma opção' }),
  follow_up_enabled:  z.enum(['yes', 'no']),
  follow_up_window:   optionalText(120),

  // 8. Base de conhecimento
  knowledge_assets:   optionalText(1000),
  faq:                optionalText(2000),

  // 9. Integrações
  whatsapp_age:       z.enum(['lt_30d', '1_3m', '3_12m', 'gt_12m', 'no_number'], { message: 'Selecione uma opção' }),
  whatsapp_type:      z.enum(['common', 'business', 'unknown']),
  whatsapp_exclusive: z.enum(['yes', 'no', 'unknown']),
  custom_domain:      optionalText(120),
  dns_owner:          optionalText(120),
})

export type Briefing = z.infer<typeof briefingSchema>
export type Salesperson = z.infer<typeof salespersonSchema>

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash',         label: 'À vista' },
  { value: 'financing',    label: 'Financiamento' },
  { value: 'consortium',   label: 'Consórcio' },
  { value: 'trade_in',     label: 'Troca' },
  { value: 'card',         label: 'Cartão' },
  { value: 'pix',          label: 'PIX' },
  { value: 'other',        label: 'Outro' },
] as const
