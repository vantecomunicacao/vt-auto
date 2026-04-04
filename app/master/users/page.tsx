import { createAdminClient } from '@/lib/supabase/server'
import { ShieldCheck } from 'lucide-react'

export default async function MasterUsersPage() {
  const adminClient = createAdminClient()

  // Fetch all auth users
  const { data: { users } } = await adminClient.auth.admin.listUsers()

  // Fetch all store_users to map user_id -> store info
  const { data: storeUsers } = await adminClient
    .from('store_users')
    .select('user_id, store_id, stores(name)')

  const storeMap: Record<string, string> = {}
  for (const su of storeUsers ?? []) {
    const stores = su.stores as { name: string }[] | { name: string } | null
    const storeName = (Array.isArray(stores) ? stores[0]?.name : stores?.name) ?? ''
    storeMap[su.user_id] = storeName
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} usuários no sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">E-mail</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Perfil</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Loja vinculada</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isMaster = user.user_metadata?.is_master === true
                const storeName = storeMap[user.id] ?? null
                const displayName =
                  user.user_metadata?.name ||
                  user.user_metadata?.full_name ||
                  '—'

                return (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-900">{user.email}</td>
                    <td className="px-5 py-3 text-gray-600">{displayName}</td>
                    <td className="px-5 py-3">
                      {isMaster ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-white">
                          <ShieldCheck size={11} />
                          master
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          usuário
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{storeName ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
