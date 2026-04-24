import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import { StorefrontContent } from './StorefrontContent'
import { StorefrontHeader } from './StorefrontHeader'
import { StorefrontFooter } from './StorefrontFooter'
import { StorefrontBanner, type BannerSlide } from './StorefrontBanner'
import { BackToTop } from './BackToTop'
import { WhatsAppFAB } from './WhatsAppFAB'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const adminClient = createAdminClient()
  const { data: store } = await adminClient.from('stores').select('name,logo_url,favicon_url,city,state').eq('slug', slug).single()
  if (!store) return {}

  const title = store.name
  const description = [store.city, store.state].filter(Boolean).join(' — ')

  return {
    title,
    description: description || undefined,
    icons: store.favicon_url ? { icon: store.favicon_url } : undefined,
    openGraph: {
      title,
      description: description || undefined,
      images: store.logo_url ? [{ url: store.logo_url }] : [],
    },
  }
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const adminClient = createAdminClient()

  const { data: store, error: storeError } = await adminClient
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .single()

  if (storeError || !store) {
    notFound()
  }

  // Configurações da vitrine com defaults
  const sf: StorefrontSettings = {
    layout_theme: 'padrao',
    grid_cols: '3',
    card_style: 'shadow',
    sort_by: 'featured',
    filter_brand: true,
    filter_price: true,
    filter_fuel: true,
    filter_transmission: true,
    page_title: '',
    page_slogan: '',
    cta_label: 'Ver detalhes',
    banner_enabled: false,
    banner_title: '',
    banner_subtitle: '',
    banner_image_url: '',
    banner_slides: [],
    about_enabled: false,
    about_image_url: '',
    show_mileage: true,
    show_year: true,
    show_fuel: true,
    show_transmission: true,
    btn_details_style: 'filled',
    btn_whatsapp_style: 'filled',
    btn_details_label: 'Ver detalhes',
    featured_carousel: true,
    financing_simulator: true,
    instagram_url: '',
    facebook_url: '',
    tiktok_url: '',
    youtube_url: '',
    ...(store.storefront_settings ?? {}),
  }
  // Campos que migraram para colunas diretas da tabela stores
  const aboutText: string = store.description ?? ''

  // Ordenação dinâmica
  const orderMap: Record<string, { col: string; asc: boolean }[]> = {
    featured:        [{ col: 'featured', asc: false }, { col: 'created_at', asc: false }],
    created_at_desc: [{ col: 'created_at', asc: false }],
    price_asc:       [{ col: 'price', asc: true }],
    price_desc:      [{ col: 'price', asc: false }],
  }
  const orders = orderMap[sf.sort_by] ?? orderMap.featured

  let query = adminClient
    .from('vehicles')
    .select('id,slug,brand,model,version,year_model,mileage,price,price_old,price_negotiable,fuel,transmission,color,cover_image_url,featured,status')
    .eq('store_id', store.id)
    .eq('status', 'available')

  for (const o of orders) {
    query = query.order(o.col, { ascending: o.asc })
  }

  const { data: vehicles } = await query

  const availableVehicles = vehicles ?? []
  const whatsappPhone = store.phone?.replace(/\D/g, '') ?? ''
  const primaryColor = store.primary_color ?? '#1e40af'
  const secondaryColor = store.secondary_color ?? '#1e40af'

  const isPremium = sf.layout_theme === 'premium'
  const bgColor = sf.layout_theme === 'vtclass' ? '#DDDDDD' : isPremium ? '#F5F5F0' : '#F9FAFB'

  // Slides do banner: usa banner_slides se houver conteúdo; caso contrário, cai nos campos legados.
  const rawSlides: BannerSlide[] = Array.isArray(sf.banner_slides) ? sf.banner_slides : []
  const cleanedSlides = rawSlides
    .map(s => ({ image_url: s?.image_url ?? '', title: s?.title ?? '', subtitle: s?.subtitle ?? '' }))
    .filter(s => s.image_url || s.title || s.subtitle)
  const bannerSlides: BannerSlide[] = cleanedSlides.length > 0
    ? cleanedSlides
    : (sf.banner_image_url || sf.banner_title || sf.banner_subtitle)
      ? [{ image_url: sf.banner_image_url, title: sf.banner_title, subtitle: sf.banner_subtitle }]
      : []

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <StorefrontHeader store={store} whatsappPhone={whatsappPhone} primaryColor={primaryColor} sf={sf} />

      {/* Banner */}
      {sf.banner_enabled && bannerSlides.length > 0 && (
        <StorefrontBanner slides={bannerSlides} isPremium={isPremium} primaryColor={primaryColor} />
      )}

      {/* Description / slogan */}
      {(sf.page_title || sf.page_slogan) && (
        <div className={isPremium ? 'bg-white border-b border-gray-200' : 'bg-white border-b border-gray-200'}>
          <div className={`max-w-6xl mx-auto px-4 text-center space-y-0.5 ${isPremium ? 'py-4 sm:py-6' : 'py-2.5 sm:py-4'}`}>
            {sf.page_title && <h2 className={`font-bold text-gray-900 ${isPremium ? 'text-lg sm:text-2xl tracking-tight' : 'text-base sm:text-xl'}`}>{sf.page_title}</h2>}
            {sf.page_slogan && <p className={`text-gray-500 hidden sm:block ${isPremium ? 'text-sm' : 'text-xs sm:text-sm'}`}>{sf.page_slogan}</p>}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {availableVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-300 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum veículo disponível</h2>
            <p className="text-gray-500">Não há veículos disponíveis no momento. Volte em breve!</p>
            {whatsappPhone && (
              <a href={`https://wa.me/55${whatsappPhone}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Falar com a loja no WhatsApp
              </a>
            )}
          </div>
        ) : (
          <StorefrontContent
            vehicles={availableVehicles}
            sf={sf}
            storeSlug={slug}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            whatsappPhone={whatsappPhone}
          />
        )}

        {/* Sobre a loja */}
        {sf.about_enabled && aboutText && (
          <div className="mt-12 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`${sf.about_image_url ? 'md:grid md:grid-cols-2' : ''}`}>
              {sf.about_image_url && (
                <img src={sf.about_image_url} alt="Sobre a loja" className="w-full h-64 md:h-full object-cover" />
              )}
              <div className="p-8 flex flex-col justify-center">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Sobre {store.name}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{aboutText}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <BackToTop />
      {whatsappPhone && <WhatsAppFAB phone={whatsappPhone} />}

      <StorefrontFooter store={store} whatsappPhone={whatsappPhone} sf={sf} />
    </div>
  )
}
