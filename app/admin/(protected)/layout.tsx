import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Layout raiz do /admin — apenas garante autenticação.
// O PanelLayout (sidebar + topbar) é usado pelas páginas internas.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return <>{children}</>
}
