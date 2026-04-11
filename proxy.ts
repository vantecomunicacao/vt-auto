import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

  // 1. PRIORIDADE MÁXIMA: Ignorar rotas de API e arquivos estáticos
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 2. SEGURANÇA: Se acessar por IP direto (ex: 127.0.0.1), não tratar como subdomínio
  const isIP = /^\d+\.\d+\.\d+\.\d+/.test(hostname)
  if (isIP) {
    return await updateSession(request, NextResponse.next())
  }

  // 3. Extrair o subdomínio de forma robusta
  const subdomain = hostname.replace(`.${rootDomain}`, '')
  const isSubdomain = hostname !== rootDomain && subdomain !== hostname

  // Roteamento por subdomínio
  if (isSubdomain) {
    if (subdomain === 'master') {
      const url = request.nextUrl.clone()
      url.pathname = `/master${pathname}`
      const response = NextResponse.rewrite(url)
      return await updateSession(request, response)
    }

    if (subdomain === 'app') {
      const url = request.nextUrl.clone()
      url.pathname = `/admin${pathname}`
      const response = NextResponse.rewrite(url)
      return await updateSession(request, response)
    }

    // EXCEÇÃO: Se for uma rota de admin ou auth, não redireciona para storefront
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/reset-password')
    ) {
      return await updateSession(request, NextResponse.next())
    }

    // [slug].autoagente.com.br → /storefront/[slug]/...
    const url = request.nextUrl.clone()
    url.pathname = `/storefront/${subdomain}${pathname}`
    const response = NextResponse.rewrite(url)
    response.headers.set('x-store-slug', subdomain)
    return response
  }

  // Domínio principal — atualiza sessão normalmente
  return await updateSession(request, NextResponse.next())
}

async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
