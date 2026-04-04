import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PanelLayout } from '@/components/admin/PanelLayout'
import TeamContent from './TeamContent'

export type Member = {
  id: string
  user_id: string
  role: 'owner' | 'seller' | string
  is_active: boolean
  created_at: string
  email: string
  name: string
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) redirect('/admin/onboarding')

  const storeId = storeUser.store_id

  const { data: rawMembers } = await admin
    .from('store_users')
    .select('id, user_id, role, is_active, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true })

  const members: Member[] = await Promise.all(
    (rawMembers ?? []).map(async (m) => {
      const { data: authUser } = await admin.auth.admin.getUserById(m.user_id)
      const email = authUser?.user?.email ?? ''
      const name = (authUser?.user?.user_metadata?.full_name as string | undefined)
        ?? email.split('@')[0]
        ?? 'Sem nome'
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        is_active: m.is_active,
        created_at: m.created_at,
        email,
        name,
      }
    })
  )

  return (
    <PanelLayout topbar={{ title: 'Equipe' }}>
      <TeamContent members={members} storeId={storeId} />
    </PanelLayout>
  )
}
