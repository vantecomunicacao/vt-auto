import type { Metadata } from 'next'
import LandingPage from './_landing/LandingPage'

export const metadata: Metadata = {
  title: 'CarGrow — Sua concessionária vendendo no WhatsApp 24/7',
  description:
    'Plataforma completa para concessionárias: vitrine personalizada, agente de IA no WhatsApp e CRM com permissões. Capte, qualifique e venda sem perder cliente por demora.',
}

export default function Home() {
  return <LandingPage />
}
