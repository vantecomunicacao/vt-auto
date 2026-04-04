import { PanelLayout } from '@/components/admin/PanelLayout'
import { AgentContent } from './AgentContent'

export default function AgentPage() {
  return (
    <PanelLayout topbar={{ title: 'Agente de IA' }}>
      <AgentContent />
    </PanelLayout>
  )
}
