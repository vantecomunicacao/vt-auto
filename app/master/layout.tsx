import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

async function MasterSidebar({ userEmail }: { userEmail: string }) {
  const navItems = [
    { href: '/master/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/master/stores', label: 'Lojas', icon: Store },
    { href: '/master/users', label: 'Usuários', icon: Users },
    { href: '/master/plans', label: 'Planos', icon: CreditCard },
    { href: '/master/settings', label: 'Configurações', icon: Settings },
  ]

  return (
    <aside
      style={{ width: 220, minWidth: 220 }}
      className="flex flex-col h-screen bg-slate-900 border-r border-slate-800 sticky top-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-800 bg-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-600">
          <ShieldCheck size={16} className="text-white" />
        </div>
        <span className="font-semibold text-white text-sm">Master</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        <p className="text-xs text-slate-500 px-1 truncate">{userEmail}</p>
        <form action="/api/master/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut size={15} className="shrink-0" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/master/login')
  }

  // Verify is_master via admin client to avoid spoofing
  const adminClient = createAdminClient()
  const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(user.id)

  if (!adminUser || adminUser.user_metadata?.is_master !== true) {
    redirect('/master/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MasterSidebar userEmail={adminUser.email ?? ''} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
