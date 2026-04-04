import { PanelLayout } from '@/components/admin/PanelLayout'
import { CheckCircle, Clock } from 'lucide-react'

const INTEGRATIONS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Conecte um número para o agente de IA responder clientes automaticamente.',
    status: 'available',
    icon: '💬',
  },
  {
    id: 'fipe',
    name: 'Tabela FIPE',
    description: 'Consulte preços FIPE automaticamente ao cadastrar veículos.',
    status: 'soon',
    icon: '📊',
  },
  {
    id: 'olx',
    name: 'OLX Autos',
    description: 'Sincronize seu estoque automaticamente com a OLX.',
    status: 'soon',
    icon: '🔄',
  },
  {
    id: 'webmotors',
    name: 'Webmotors',
    description: 'Publique veículos na Webmotors diretamente do painel.',
    status: 'soon',
    icon: '🚗',
  },
]

export default function IntegrationsPage() {
  return (
    <PanelLayout topbar={{ title: 'Integrações' }}>
      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        {INTEGRATIONS.map(integration => (
          <div key={integration.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{integration.name}</p>
                  {integration.status === 'available' ? (
                    <span className="flex items-center gap-1 text-xs text-ds-success">
                      <CheckCircle size={11} />
                      Disponível
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} />
                      Em breve
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{integration.description}</p>
            {integration.status === 'available' ? (
              <button
                className="w-full h-8 text-xs font-medium rounded-lg text-white"
                style={{ background: 'var(--ds-primary-600)' }}
              >
                Configurar
              </button>
            ) : (
              <button
                disabled
                className="w-full h-8 text-xs font-medium rounded-lg bg-slate-100 text-muted-foreground cursor-not-allowed"
              >
                Em breve
              </button>
            )}
          </div>
        ))}
      </div>
    </PanelLayout>
  )
}
