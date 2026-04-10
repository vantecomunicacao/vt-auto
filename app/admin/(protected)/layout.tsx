import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/admin/Sidebar'
import { StoreProvider } from '@/components/admin/StoreContext'
import type { Store, StoreUser } from '@/lib/supabase/types'

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

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

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

  if (!store) redirect('/admin/onboarding')
  if (!store.onboarding_completo) redirect('/admin/onboarding')

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
  const userInitials = getInitials(userName)
  const userRole = storeUser.role === 'owner' ? 'Dono da loja' : 'Vendedor'
  const isMaster = user.user_metadata?.is_master === true

  return (
    <StoreProvider value={{
      storeName: store.name,
      plan: formatPlan(store.plan),
      agentActive: store.agent_active ?? false,
      userName,
      userRole,
      userInitials,
      isMaster,
      newLeadsCount: 0,
    }}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          storeName={store.name}
          plan={formatPlan(store.plan)}
          userName={userName}
          userRole={userRole}
          userInitials={userInitials}
          isMaster={isMaster}
        />
        <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '240px' }}>
          {children}
        </div>
      </div>
    </StoreProvider>
  )
}
