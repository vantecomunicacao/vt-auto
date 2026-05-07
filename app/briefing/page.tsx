import type { Metadata } from 'next'
import { BriefingForm } from './BriefingForm'

export const metadata: Metadata = {
  title: 'Briefing — CarGrow',
  description: 'Preencha o briefing para configurar sua loja na CarGrow.',
}

export default function BriefingPage() {
  return <BriefingForm />
}
