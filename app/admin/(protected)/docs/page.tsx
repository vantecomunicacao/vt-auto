import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PanelLayout } from '@/components/admin/PanelLayout'
import { DocsContent } from './DocsContent'

export default async function DocsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  return (
    <PanelLayout topbar={{ title: 'Documentação' }}>
      <DocsContent />
    </PanelLayout>
  )
}
