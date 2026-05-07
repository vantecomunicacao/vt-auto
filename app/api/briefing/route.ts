import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { briefingSchema } from '@/lib/schemas/briefing'

// Rate limit por IP (in-memory): 3 envios por hora + 10 por dia
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const HOURLY_MAX = 3
const DAILY_MAX = 10

type Bucket = { count: number; resetAt: number }
const hourMap = new Map<string, Bucket>()
const dayMap = new Map<string, Bucket>()

function bumpAndCheck(map: Map<string, Bucket>, ip: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = map.get(ip)
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip')?.trim() ??
    'unknown'
  )
}

export async function POST(request: Request) {
  const ip = getIp(request)

  if (!bumpAndCheck(hourMap, ip, HOURLY_MAX, HOUR_MS) ||
      !bumpAndCheck(dayMap, ip, DAILY_MAX, DAY_MS)) {
    return NextResponse.json(
      { ok: false, error: 'Muitos envios. Tente novamente mais tarde.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = briefingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Dados inválidos', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Honeypot — humano deixa vazio. Bot enche. Retorna sucesso silencioso pra não alertar o bot.
  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true, id: 'silent' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Idempotência — se já houver envio com mesmo CNPJ + email nas últimas 24h, retorna o existente
  const since = new Date(Date.now() - DAY_MS).toISOString()
  const { data: existing } = await supabase
    .from('briefing_submissions')
    .select('id')
    .eq('cnpj', data.cnpj)
    .eq('email', data.email)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    return NextResponse.json({ ok: true, id: existing.id, duplicated: true })
  }

  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null

  // Remove o honeypot antes de gravar
  const { website: _honeypot, ...payload } = data

  const { data: inserted, error } = await supabase
    .from('briefing_submissions')
    .insert({
      store_name:       payload.store_name,
      responsible_name: payload.responsible_name,
      cnpj:             payload.cnpj,
      email:            payload.email,
      whatsapp:         payload.whatsapp,
      data:             payload,
      ip_address:       ip,
      user_agent:       userAgent,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[briefing] insert error', error)
    return NextResponse.json({ ok: false, error: 'Erro ao salvar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: inserted.id })
}
