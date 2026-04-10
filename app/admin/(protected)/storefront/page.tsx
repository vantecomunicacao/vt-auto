import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PanelLayout } from '@/components/admin/PanelLayout'
import { StorefrontSettingsContent } from './StorefrontSettingsContent'

export default async function StorefrontSettingsPage() {
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

  const { data: store } = await admin
    .from('stores')
    .select('slug, storefront_settings, primary_color, secondary_color, logo_url, description, address')
    .eq('id', storeUser.store_id)
    .single()

  return (
    <PanelLayout topbar={{ title: 'Vitrine' }}>
      <StorefrontSettingsContent
        slug={store?.slug ?? ''}
        initialSettings={store?.storefront_settings ?? {}}
        initialStoreData={{
          primary_color: store?.primary_color ?? '',
          secondary_color: store?.secondary_color ?? '',
          logo_url: store?.logo_url ?? '',
          description: store?.description ?? '',
          address: store?.address ?? '',
        }}
      />
    </PanelLayout>
  )
}
