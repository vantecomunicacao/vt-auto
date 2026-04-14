import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Rate limiting simples em memória: máx 20 requisições por IP a cada 60s
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) return false

  entry.count++
  return true
}

export async function GET(request: Request) {
  const ip =
    (request as Request & { headers: Headers }).headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { available: false, error: 'Muitas requisições. Aguarde um momento.' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, error: 'Slug muito curto' })
  }

  // IMPORTANTE: Aqui usamos a SERVICE_KEY para ignorar as travas do RLS
  // e conseguir checar em TODAS as lojas se o nome está livre.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  try {
    console.log(`🔍 [API] Checando disponibilidade do slug: ${slug}`)
    
    const { data, error } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('❌ [API] Erro ao consultar banco:', error.message)
      return NextResponse.json({ available: false, error: error.message })
    }

    const available = !data
    console.log(`✅ [API] Resultado para ${slug}: ${available ? 'DISPONÍVEL' : 'OCUPADO'}`)
    
    return NextResponse.json(
      { available },
      { 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    )
  } catch (err: any) {
    console.error('💥 [API] Erro crítico:', err.message)
    return NextResponse.json({ available: false, error: 'Erro interno no servidor' })
  }
}
