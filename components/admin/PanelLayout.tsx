import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { Store, StoreUser } from '@/lib/supabase/types'

interface PanelLayoutProps {
  children: React.ReactNode
  topbar?: {
    title: string
    subtitle?: string
    action?: {
      label: string
      href?: string
    }
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

function formatPlan(plan: string) {
  const map: Record<string, string> = {
    trial: 'Trial',
    basic: 'Basic',
    pro: 'Plano Pro',
    enterprise: 'Enterprise',
  }
  return map[plan] || plan
}

export async function PanelLayout({ children, topbar }: PanelLayoutProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Usa adminClient para bypasear o RLS que depende de store_id no JWT.
  // O JWT só recebe store_id após o hook custom_access_token_hook estar
  // configurado no dashboard do Supabase — sem isso as queries com anon
  // key retornam null e causam loop infinito para o onboarding.
  const admin = createAdminClient()

  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id, role')
    .eq('user_id', user.id)
    .single() as { data: (StoreUser & { store_id: string }) | null }

  if (!storeUser) redirect('/admin/onboarding')

  const { data: store } = await admin
    .from('stores')
    .select('name, plan, agent_active, onboarding_completo')
    .eq('id', storeUser.store_id)
    .single() as { data: Pick<Store, 'name' | 'plan' | 'agent_active' | 'onboarding_completo'> | null }

  // Se a loja não existir, manda para o onboarding
  if (!store) redirect('/admin/onboarding')

  // Se o onboarding não estiver completo, manda para lá
  if (!store.onboarding_completo) redirect('/admin/onboarding')

  // Dados do usuário para a sidebar
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
  const userInitials = getInitials(userName)
  const userRole = storeUser.role === 'owner' ? 'Dono da loja' : 'Vendedor'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        storeName={store.name}
        plan={formatPlan(store.plan)}
        userName={userName}
        userRole={userRole}
        userInitials={userInitials}
      />

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '240px' }}>
        {topbar && (
          <Topbar
            title={topbar.title}
            subtitle={topbar.subtitle ?? `${store.name} · ${topbar.title}`}
            agentActive={store.agent_active}
            action={topbar.action}
          />
        )}
        <main className="flex-1 overflow-y-auto p-6 bg-ds-page">
          {children}
        </main>
      </div>
    </div>
  )
}
