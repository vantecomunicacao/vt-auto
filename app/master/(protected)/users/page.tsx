import { createAdminClient, createClient } from '@/lib/supabase/server'
import UsersContent from './UsersContent'

export default async function MasterUsersPage() {
  const adminClient = createAdminClient()

  const [{ data: { users } }, supabase] = await Promise.all([
    adminClient.auth.admin.listUsers(),
    createClient(),
  ])

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Fetch all store_users to map user_id -> store name
  const { data: storeUsers } = await adminClient
    .from('store_users')
    .select('user_id, store_id, stores(name)')

  const storeMap: Record<string, string> = {}
  for (const su of storeUsers ?? []) {
    const stores = su.stores as { name: string }[] | { name: string } | null
    const storeName = (Array.isArray(stores) ? stores[0]?.name : stores?.name) ?? ''
    storeMap[su.user_id] = storeName
  }

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    full_name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? '',
    is_master: u.user_metadata?.is_master === true,
    store_name: storeMap[u.id] ?? null,
    created_at: u.created_at,
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} usuários no sistema</p>
      </div>

      <UsersContent users={rows} currentUserId={currentUser?.id ?? ''} />
    </div>
  )
}
