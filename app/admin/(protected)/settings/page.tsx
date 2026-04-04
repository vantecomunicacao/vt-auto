import { PanelLayout } from '@/components/admin/PanelLayout'
import { SettingsContent } from './SettingsContent'

export default function SettingsPage() {
  return (
    <PanelLayout topbar={{ title: 'Configurações' }}>
      <SettingsContent />
    </PanelLayout>
  )
}
