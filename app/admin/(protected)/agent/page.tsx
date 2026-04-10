import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PanelLayout } from '@/components/admin/PanelLayout'
import { AgentContent } from './AgentContent'

const DEFAULT_FOLLOWUP_CONFIG = {
  intervals: [60, 1440, 4320],
  messages: [
    'Olá! Ainda posso te ajudar com alguma informação sobre nossos veículos?',
    'Que tal agendar uma visita para conhecer nosso estoque pessoalmente?',
    'Última mensagem: temos novidades no estoque que podem te interessar!',
  ],
}

export default async function AgentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()
  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) redirect('/admin/login')

  const { data: store } = await admin
    .from('stores')
    .select('follow_up_enabled, follow_up_config, agent_hours')
    .eq('id', storeUser.store_id)
    .single()

  // Reconstrói formato com `enabled` para o componente
  const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const DEFAULT_TIMES: Record<string, { start: string; end: string }> = {
    mon: { start: '08:00', end: '18:00' }, tue: { start: '08:00', end: '18:00' },
    wed: { start: '08:00', end: '18:00' }, thu: { start: '08:00', end: '18:00' },
    fri: { start: '08:00', end: '18:00' }, sat: { start: '09:00', end: '13:00' },
    sun: { start: '09:00', end: '13:00' },
  }
  const dbHours = store?.agent_hours as Record<string, { start: string; end: string }> | null
  const agentHours = dbHours
    ? Object.fromEntries(ALL_DAYS.map(d => [d, {
        enabled: d in dbHours,
        start: dbHours[d]?.start ?? DEFAULT_TIMES[d].start,
        end: dbHours[d]?.end ?? DEFAULT_TIMES[d].end,
      }]))
    : null

  return (
    <PanelLayout topbar={{ title: 'Agente de IA' }}>
      <AgentContent
        storeId={storeUser.store_id}
        followUpEnabled={store?.follow_up_enabled ?? false}
        followUpConfig={store?.follow_up_config ?? DEFAULT_FOLLOWUP_CONFIG}
        agentHours={agentHours}
      />
    </PanelLayout>
  )
}
