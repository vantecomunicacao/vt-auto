import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import { StorefrontFilters, type StorefrontVehicle } from './StorefrontFilters'
import { StorefrontVTLX } from './StorefrontVTLX'
import { StorefrontVTClass } from './StorefrontVTClass'
import { BackToTop } from './BackToTop'
import { WhatsAppFAB } from './WhatsAppFAB'
import { formatPhone } from '@/lib/formatPhone'

const fuelLabel: Record<string, string> = {
  flex: 'Flex',
  gasoline: 'Gasolina',
  diesel: 'Diesel',
  electric: 'Elétrico',
  hybrid: 'Híbrido',
  gas: 'GNV',
}

const transmissionLabel: Record<string, string> = {
  manual: 'Manual',
  automatic: 'Automático',
  automated: 'Automatizado',
  cvt: 'CVT',
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

function formatMileage(mileage: number) {
  return new Intl.NumberFormat('pt-BR').format(mileage) + ' km'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const adminClient = createAdminClient()
  const { data: store } = await adminClient.from('stores').select('name,logo_url,city,state').eq('slug', slug).single()
  if (!store) return {}

  const title = store.name
  const description = [store.city, store.state].filter(Boolean).join(' — ')

  return {
    title,
    description: description || undefined,
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
    about_enabled: false,
    about_image_url: '',
    show_mileage: true,
    show_year: true,
    show_fuel: true,
    show_transmission: true,
    btn_details_style: 'filled',
    btn_whatsapp_style: 'filled',
    btn_details_label: 'Ver detalhes',
    financing_simulator: true,
    instagram_url: '',
    facebook_url: '',
    tiktok_url: '',
    youtube_url: '',
    ...(store.storefront_settings ?? {}),
  }
  // Campos que migraram para colunas diretas da tabela stores
  const aboutText: string = store.description ?? ''
  const storeAddress: string = store.address ?? ''

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
  const landline: string = store.landline ?? ''

  return (
    <div className="min-h-screen" style={{ backgroundColor: sf.layout_theme === 'vtclass' ? '#DDDDDD' : '#F9FAFB' }}>
      {/* Header — compacto no mobile */}
      <header
        style={{ backgroundColor: primaryColor }}
        className="text-white shadow-md"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {store.logo_url && (
              <img
                src={store.logo_url}
                alt={`Logo ${store.name}`}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover bg-white flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight truncate">{store.name}</h1>
              {(store.city || store.state) && (
                <p className="text-xs opacity-75 hidden sm:block">
                  {[store.city, store.state].filter(Boolean).join(' — ')}
                </p>
              )}
            </div>
          </div>
          {whatsappPhone && (
            <a
              href={`https://wa.me/55${whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L.057 23.852a.5.5 0 0 0 .625.607l6.219-1.63A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 0 1-5.194-1.449l-.39-.23-3.688.968.987-3.594-.243-.38A10 10 0 1 1 12 22z" />
              </svg>
              <span className="hidden sm:inline">{store.phone}</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          )}
        </div>
      </header>

      {/* Banner — menor no mobile */}
      {sf.banner_enabled && (sf.banner_title || sf.banner_image_url) && (
        <div
          className="relative text-white"
          style={{
            background: sf.banner_image_url
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${sf.banner_image_url}) center/cover no-repeat`
              : primaryColor,
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12 text-center">
            {sf.banner_title && <h2 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">{sf.banner_title}</h2>}
            {sf.banner_subtitle && <p className="text-sm sm:text-lg opacity-90">{sf.banner_subtitle}</p>}
          </div>
        </div>
      )}

      {/* Description / slogan — oculto no mobile se for redundante */}
      {(sf.page_title || sf.page_slogan) && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-4 text-center space-y-0.5">
            {sf.page_title && <h2 className="text-base sm:text-xl font-bold text-gray-900">{sf.page_title}</h2>}
            {sf.page_slogan && <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">{sf.page_slogan}</p>}
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
        ) : sf.layout_theme === 'vtclass' ? (
          <StorefrontVTClass
            vehicles={availableVehicles}
            sf={sf}
            storeSlug={slug}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            whatsappPhone={whatsappPhone}
          />
        ) : sf.layout_theme === 'vtlx' ? (
          <StorefrontVTLX
            vehicles={availableVehicles}
            sf={sf}
            storeSlug={slug}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            whatsappPhone={whatsappPhone}
          />
        ) : (
          <StorefrontFilters
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

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 space-y-6">

          {/* Top row: info + social */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Store info */}
            <div className="space-y-4">
              {/* Nome + logo */}
              <div className="flex items-center gap-2.5">
                {store.logo_url && (
                  <img src={store.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                )}
                <span className="font-bold text-gray-900 text-base">{store.name}</span>
              </div>

              {/* Contatos */}
              <div className="flex flex-col gap-2">
                {whatsappPhone && (
                  <a
                    href={`https://wa.me/55${whatsappPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 self-start bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L.057 23.852a.5.5 0 0 0 .625.607l6.219-1.63A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 0 1-5.194-1.449l-.39-.23-3.688.968.987-3.594-.243-.38A10 10 0 1 1 12 22z" />
                    </svg>
                    WhatsApp {formatPhone(store.phone)}
                  </a>
                )}
                {landline && (
                  <a
                    href={`tel:${landline.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-2 self-start text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    Telefone {formatPhone(landline)}
                  </a>
                )}
                {store.email && (
                  <a
                    href={`mailto:${store.email}`}
                    className="inline-flex items-center gap-2 self-start text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    {store.email}
                  </a>
                )}
              </div>

              {storeAddress && (
                <p className="text-xs text-gray-400 flex items-start gap-1.5 max-w-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {storeAddress}
                </p>
              )}
            </div>

            {/* Social icons */}
            {(sf.instagram_url || sf.facebook_url || sf.tiktok_url || sf.youtube_url) && (
              <div className="flex items-center gap-2">
                {sf.instagram_url && (
                  <a href={sf.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-pink-50 hover:text-pink-600 text-gray-500 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                  </a>
                )}
                {sf.facebook_url && (
                  <a href={sf.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {sf.tiktok_url && (
                  <a href={sf.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/>
                    </svg>
                  </a>
                )}
                {sf.youtube_url && (
                  <a href={sf.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Bottom row */}
          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} {store.name}. Todos os direitos reservados.
            </span>
            <a
              href="https://vtauto.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity"
              title="Desenvolvido por VT Auto"
            >
              <span className="text-xs text-gray-400">Desenvolvido por</span>
              <img src="/vt-auto-logo.svg" alt="VT Auto" className="h-5 w-auto" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
