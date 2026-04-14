import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs'

const securityHeaders = [
  // Impede que o site seja embutido em iframes por terceiros (clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Impede que o browser "adivinhe" o tipo de arquivo (MIME sniffing)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Controla quais informações são enviadas ao navegar para outros sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Força HTTPS por 1 ano (ativo apenas em produção)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Desativa funcionalidades de browser que não são usadas
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  org: 'vante-comunicacao',
  project: 'javascript-nextjs',

  // Faz upload dos source maps para o Sentry (erros mostram código original, não minificado)
  silent: !process.env.CI,

  // Desativa tunneling e features que precisam de servidor Sentry próprio
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
})
