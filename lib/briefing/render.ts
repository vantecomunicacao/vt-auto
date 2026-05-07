import type { Briefing } from '@/lib/schemas/briefing'
import { PAYMENT_METHOD_OPTIONS } from '@/lib/schemas/briefing'

const TONE_LABEL: Record<Briefing['agent_tone'], string> = {
  professional: 'Profissional',
  friendly:     'Amigável',
  casual:       'Descontraído',
}

const YES_NO: Record<string, string> = {
  yes:        'Sim',
  no:         'Não',
  with_rules: 'Sim, com regras',
  unknown:    'Não sei informar',
}

const WHATSAPP_AGE_LABEL: Record<Briefing['whatsapp_age'], string> = {
  lt_30d:     'Menos de 30 dias',
  '1_3m':     'Entre 1 e 3 meses',
  '3_12m':    'Entre 3 e 12 meses',
  gt_12m:     'Mais de 1 ano',
  no_number:  'Ainda não tenho número ativo',
}

const WHATSAPP_TYPE_LABEL: Record<Briefing['whatsapp_type'], string> = {
  common:   'WhatsApp comum',
  business: 'WhatsApp Business',
  unknown:  'Não sei informar',
}

const OFF_HOURS_LABEL: Record<Briefing['off_hours_behavior'], string> = {
  continue:      'Agente continua respondendo fora do horário',
  inform_return: 'Agente avisa que time humano retorna no próximo dia útil',
}

function paymentLabels(values: string[]): string {
  return values
    .map(v => PAYMENT_METHOD_OPTIONS.find(o => o.value === v)?.label ?? v)
    .join(', ')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br>')
}

function row(label: string, value: string | undefined | null): string {
  if (!value) return ''
  return `<tr><th>${escapeHtml(label)}</th><td>${nl2br(value)}</td></tr>`
}

function section(title: string, rows: string): string {
  if (!rows) return ''
  return `<section><h2>${escapeHtml(title)}</h2><table>${rows}</table></section>`
}

/**
 * Gera HTML formatado do briefing — usado tanto para PDF (via window.print)
 * quanto para download .doc (via Blob application/msword).
 * Logo CarGrow embutido em base64 não é necessário — referência por URL absoluta
 * seria quebrada no .doc offline; usamos texto estilizado como cabeçalho.
 */
export function renderBriefingHtml(b: Briefing, opts: { logoUrl?: string } = {}): string {
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const logoBlock = opts.logoUrl
    ? `<img src="${opts.logoUrl}" alt="CarGrow" class="logo">`
    : `<div class="logo-text">CarGrow</div>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Briefing — ${escapeHtml(b.store_name)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; font-size: 11pt; line-height: 1.45; max-width: 780px; margin: 0 auto; padding: 24px; }
  header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 24px; }
  .logo { height: 38px; width: auto; }
  .logo-text { font-weight: 800; font-size: 22pt; letter-spacing: -0.5px; color: #2563EB; }
  header .meta { margin-left: auto; text-align: right; font-size: 9pt; color: #6b7280; }
  h1 { font-size: 20pt; margin: 0 0 4px; color: #111827; }
  .subtitle { color: #6b7280; font-size: 10pt; margin: 0; }
  section { margin-bottom: 22px; page-break-inside: avoid; }
  h2 { font-size: 12pt; color: #2563EB; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; vertical-align: top; width: 38%; padding: 6px 10px 6px 0; color: #6b7280; font-weight: 600; font-size: 10pt; }
  td { vertical-align: top; padding: 6px 0; color: #111827; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin-bottom: 2px; }
  footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 9pt; text-align: center; }
  .swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; vertical-align: middle; margin-right: 6px; border: 1px solid #e5e7eb; }
</style>
</head>
<body>
<header>
  ${logoBlock}
  <div>
    <h1>Briefing de configuração</h1>
    <p class="subtitle">${escapeHtml(b.store_name)}</p>
  </div>
  <div class="meta">${date}</div>
</header>

${section('1. Identidade da loja', [
  row('Nome da loja', b.store_name),
  row('Razão social', b.legal_name),
  row('CNPJ', b.cnpj),
  row('Responsável', b.responsible_name),
  row('WhatsApp comercial', b.whatsapp),
  row('Telefone fixo', b.landline),
  row('E-mail', b.email),
  row('Endereço', b.address),
  row('Cidade / UF', `${b.city} / ${b.state}`),
  row('CEP', b.zip_code),
  row('Site', b.website_url),
  row('Redes sociais', b.social_links),
].join(''))}

${section('2. Marca e visual', [
  row('Logo', b.logo_note || 'Enviado em anexo'),
  row('Cor primária', `<span class="swatch" style="background:${escapeHtml(b.primary_color)}"></span>${escapeHtml(b.primary_color)}`),
  row('Cor secundária', `<span class="swatch" style="background:${escapeHtml(b.secondary_color)}"></span>${escapeHtml(b.secondary_color)}`),
  row('Slogan', b.slogan),
].join(''))}

${section('3. O negócio', [
  row('Resumo do negócio', b.business_summary),
  row('Diferenciais', b.differentiators),
  row('Formas de pagamento', paymentLabels(b.payment_methods) + (b.payment_methods_other ? ` — ${b.payment_methods_other}` : '')),
  row('Aceita troca?', YES_NO[b.accepts_trade_in]),
  row('Regras da troca', b.trade_in_rules),
  row('Política de test drive', b.test_drive_policy),
  row('Frete / entrega', b.delivery_policy),
].join(''))}

${section('4. Personalidade do agente', [
  row('Nome do agente', b.agent_name),
  row('Tom de voz', TONE_LABEL[b.agent_tone]),
  row('Como deve soar', b.agent_voice_note),
  row('Pode usar gírias?', YES_NO[b.allow_slang]),
  row('Pode usar emoji?', YES_NO[b.allow_emoji]),
  row('Saudação inicial', b.greeting),
  row('Frases / promessas proibidas', b.forbidden_phrases),
].join(''))}

${section('5. Qualificação e handoff', [
  row('Informações que o agente deve coletar', b.qualification_fields),
  row('Quando passar para um humano', b.handoff_triggers),
  row('Quando encerrar a conversa', b.end_conversation_triggers),
].join(''))}

${section('6. Vendedores (round-robin)', `
  <tr><th>Vendedores cadastrados</th><td><ul>${
    b.salespeople.map(s => `<li>${escapeHtml(s.name)} — ${escapeHtml(s.phone)}</li>`).join('')
  }</ul></td></tr>
  ${row('Telefone do gerente (notificações)', b.manager_phone)}
`)}

${section('7. Horário e operação', [
  row('Horário de atendimento', b.business_hours),
  row('Fora do horário', OFF_HOURS_LABEL[b.off_hours_behavior]),
  row('Follow-up automático?', YES_NO[b.follow_up_enabled]),
  row('Janela de follow-up', b.follow_up_window),
].join(''))}

${section('8. Base de conhecimento', [
  row('Materiais que serão enviados', b.knowledge_assets),
  row('Perguntas frequentes', b.faq),
].join(''))}

${section('9. Integrações', [
  row('Tempo do número de WhatsApp', WHATSAPP_AGE_LABEL[b.whatsapp_age]),
  row('Tipo do número', WHATSAPP_TYPE_LABEL[b.whatsapp_type]),
  row('Número exclusivo para a plataforma?', YES_NO[b.whatsapp_exclusive]),
  row('Domínio personalizado', b.custom_domain),
  row('Quem cuida do DNS', b.dns_owner),
].join(''))}

<footer>
  Briefing gerado em ${date} via plataforma CarGrow.
</footer>
</body>
</html>`
}

/**
 * Versão em texto puro (para WhatsApp). Usa formatação simples do WhatsApp:
 * *negrito* e quebras de linha. Sem markdown complexo.
 */
export function renderBriefingText(b: Briefing): string {
  const lines: string[] = []
  const sec = (title: string) => lines.push('', `*${title}*`)
  const item = (label: string, value: string | undefined | null) => {
    if (value) lines.push(`• ${label}: ${value}`)
  }

  lines.push(`*Briefing — ${b.store_name}*`)

  sec('1. Identidade da loja')
  item('Nome da loja', b.store_name)
  item('Razão social', b.legal_name)
  item('CNPJ', b.cnpj)
  item('Responsável', b.responsible_name)
  item('WhatsApp', b.whatsapp)
  item('Telefone fixo', b.landline)
  item('E-mail', b.email)
  item('Endereço', `${b.address}, ${b.city}/${b.state}${b.zip_code ? ` — ${b.zip_code}` : ''}`)
  item('Site', b.website_url)
  item('Redes', b.social_links)

  sec('2. Marca e visual')
  item('Cor primária', b.primary_color)
  item('Cor secundária', b.secondary_color)
  item('Slogan', b.slogan)
  item('Logo', b.logo_note)

  sec('3. O negócio')
  item('Resumo', b.business_summary)
  item('Diferenciais', b.differentiators)
  item('Pagamento', paymentLabels(b.payment_methods) + (b.payment_methods_other ? ` — ${b.payment_methods_other}` : ''))
  item('Aceita troca', YES_NO[b.accepts_trade_in])
  item('Regras de troca', b.trade_in_rules)
  item('Test drive', b.test_drive_policy)
  item('Entrega', b.delivery_policy)

  sec('4. Agente')
  item('Nome', b.agent_name)
  item('Tom', TONE_LABEL[b.agent_tone])
  item('Como soar', b.agent_voice_note)
  item('Gírias', YES_NO[b.allow_slang])
  item('Emoji', YES_NO[b.allow_emoji])
  item('Saudação', b.greeting)
  item('Proibido', b.forbidden_phrases)

  sec('5. Qualificação e handoff')
  item('Coletar', b.qualification_fields)
  item('Passar pra humano', b.handoff_triggers)
  item('Encerrar', b.end_conversation_triggers)

  sec('6. Vendedores')
  b.salespeople.forEach((s, i) => lines.push(`• Vendedor ${i + 1}: ${s.name} — ${s.phone}`))
  item('Gerente', b.manager_phone)

  sec('7. Horário')
  item('Atendimento', b.business_hours)
  item('Fora do horário', OFF_HOURS_LABEL[b.off_hours_behavior])
  item('Follow-up', YES_NO[b.follow_up_enabled])
  item('Janela follow-up', b.follow_up_window)

  sec('8. Base de conhecimento')
  item('Materiais', b.knowledge_assets)
  item('FAQ', b.faq)

  sec('9. Integrações')
  item('Tempo do WhatsApp', WHATSAPP_AGE_LABEL[b.whatsapp_age])
  item('Tipo', WHATSAPP_TYPE_LABEL[b.whatsapp_type])
  item('Exclusivo?', YES_NO[b.whatsapp_exclusive])
  item('Domínio', b.custom_domain)
  item('DNS', b.dns_owner)

  return lines.join('\n')
}
