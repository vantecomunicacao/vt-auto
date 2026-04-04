'use client'

import Link from 'next/link'
import GalleryClient from './GalleryClient'
import { FinancingSimulator } from './FinancingSimulator'
import { VehicleSidebarVTLX } from './VehicleSidebarVTLX'
import { FavoritesProvider } from '../../FavoritesContext'
import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'

const fuelLabel: Record<string, string> = {
  flex: 'Flex', gasoline: 'Gasolina', diesel: 'Diesel',
  electric: 'Elétrico', hybrid: 'Híbrido', gas: 'GNV',
}
const transmissionLabel: Record<string, string> = {
  manual: 'Manual', automatic: 'Automático', automated: 'Automatizado', cvt: 'CVT',
}

function formatMileage(mileage: number) {
  return new Intl.NumberFormat('pt-BR').format(mileage) + ' km'
}

interface Props {
  store: {
    id: string
    name: string
    logo_url?: string | null
    phone?: string | null
    city?: string | null
    state?: string | null
  }
  vehicle: {
    id: string
    brand: string
    model: string
    version?: string | null
    year_model?: number | null
    year_manuf?: number | null
    mileage?: number | null
    fuel?: string | null
    transmission?: string | null
    color?: string | null
    body_type?: string | null
    doors?: number | null
    seats?: number | null
    engine?: string | null
    power?: string | null
    price?: number | null
    price_old?: number | null
    price_negotiable?: boolean | null
    features?: string[] | null
    description?: string | null
  }
  allImages: string[]
  primaryColor: string
  secondaryColor: string
  whatsappPhone: string
  waLink: string
  slug: string
  showFinancingSimulator: boolean
  sf: StorefrontSettings
}

export function VehicleDetailVTLX({
  store, vehicle, allImages, primaryColor, secondaryColor,
  whatsappPhone, waLink, slug, showFinancingSimulator, sf,
}: Props) {
  const specs: { label: string; value: string }[] = []
  if (vehicle.year_model) specs.push({ label: 'Ano modelo', value: String(vehicle.year_model) })
  if (vehicle.year_manuf) specs.push({ label: 'Ano fab.', value: String(vehicle.year_manuf) })
  if (vehicle.mileage != null) specs.push({ label: 'Quilometragem', value: formatMileage(vehicle.mileage) })
  if (vehicle.fuel) specs.push({ label: 'Combustível', value: fuelLabel[vehicle.fuel] ?? vehicle.fuel })
  if (vehicle.transmission) specs.push({ label: 'Câmbio', value: transmissionLabel[vehicle.transmission] ?? vehicle.transmission })
  if (vehicle.color) specs.push({ label: 'Cor', value: vehicle.color })
  if (vehicle.body_type) specs.push({ label: 'Carroceria', value: vehicle.body_type })
  if (vehicle.doors) specs.push({ label: 'Portas', value: String(vehicle.doors) })
  if (vehicle.seats) specs.push({ label: 'Lugares', value: String(vehicle.seats) })
  if (vehicle.engine) specs.push({ label: 'Motor', value: vehicle.engine })
  if (vehicle.power) specs.push({ label: 'Potência', value: vehicle.power })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header — Identical to Home */}
      <header
        style={{ backgroundColor: primaryColor }}
        className="text-white shadow-md sticky top-0 z-50 transition-all duration-300"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {store.logo_url && (
              <img src={store.logo_url} alt={store.name} className="h-9 w-9 rounded-full object-cover bg-white" />
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight truncate">{store.name}</h1>
              {(store.city || store.state) && (
                <p className="text-xs opacity-75 hidden sm:block truncate">
                  {[store.city, store.state].filter(Boolean).join(' — ')}
                </p>
              )}
            </div>
          </div>
          <Link
            href={`/storefront/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-full font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span className="hidden sm:inline">Voltar para a vitrine</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8">
        {/* Title + badges */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {vehicle.price_negotiable && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-amber-100 text-amber-700">
                Negociável
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-slate-900 text-white">
              VTLX CHOICE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
            {vehicle.brand} <span className="text-slate-700 font-bold">{vehicle.model}</span>
          </h1>
          {vehicle.version && (
            <p className="text-lg text-slate-500 mt-1 font-medium">{vehicle.version}</p>
          )}

          {/* Specs pills — matching VTLX Home pill style */}
          <div className="flex flex-wrap gap-2 mt-4">
            {vehicle.year_model && (
              <span className="text-xs bg-white border border-gray-100 text-gray-500 px-3 py-1 rounded-full">
                {vehicle.year_model}
              </span>
            )}
            {vehicle.mileage != null && (
              <span className="text-xs bg-white border border-gray-100 text-gray-500 px-3 py-1 rounded-full">
                {formatMileage(vehicle.mileage)}
              </span>
            )}
            {vehicle.fuel && (
              <span className="text-xs bg-white border border-gray-100 text-gray-500 px-3 py-1 rounded-full">
                {fuelLabel[vehicle.fuel] ?? vehicle.fuel}
              </span>
            )}
            {vehicle.transmission && (
              <span className="text-xs bg-white border border-gray-100 text-gray-500 px-3 py-1 rounded-full">
                {transmissionLabel[vehicle.transmission] ?? vehicle.transmission}
              </span>
            )}
          </div>
        </div>

        {/* 2-column layout */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left: gallery + specs + simulator + description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg overflow-hidden border border-gray-100 bg-white p-1">
              <GalleryClient images={allImages} />
            </div>

            {/* Specs grid — clean and flat */}
            {specs.length > 0 && (
              <section className="bg-white border border-gray-100 rounded-lg p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-5 bg-slate-900 rounded-full"></span>
                  Detalhes Técnicos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {specs.map(spec => (
                    <div key={spec.label}>
                      <dt className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                        {spec.label}
                      </dt>
                      <dd className="text-sm font-bold text-slate-800">{spec.value}</dd>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Opcionais */}
            {vehicle.features && vehicle.features.length > 0 && (
              <section className="bg-white border border-gray-100 rounded-lg p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-5 bg-slate-900 rounded-full"></span>
                  Equipamentos
                </h2>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((f: string) => (
                    <span key={f} className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-50 text-slate-600 bg-slate-50/50">
                      {f}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Simulador */}
            {showFinancingSimulator && vehicle.price && (
              <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <FinancingSimulator price={vehicle.price} primaryColor={primaryColor} />
              </div>
            )}

            {/* Descrição */}
            {vehicle.description && (
              <section className="bg-white border border-gray-100 rounded-lg p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Sobre este veículo</h2>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed antialiased">
                  {vehicle.description}
                </p>
              </section>
            )}
          </div>

          {/* Right: sidebar — preço + CTAs */}
          <div className="mt-8 lg:mt-0">
            <FavoritesProvider storeSlug={slug}>
              <div className="lg:sticky lg:top-24">
                <VehicleSidebarVTLX
                  price={vehicle.price ?? null}
                  priceOld={vehicle.price_old ?? null}
                  priceNegotiable={vehicle.price_negotiable ?? null}
                  waLink={whatsappPhone ? waLink : null}
                  storeName={store.name}
                  storeSlug={slug}
                  storeCity={store.city ?? null}
                  storeState={store.state ?? null}
                  storePhone={store.phone ?? null}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  vehicleName={`${vehicle.brand} ${vehicle.model}${vehicle.year_model ? ' ' + vehicle.year_model : ''}`}
                  storeId={store.id}
                  vehicleId={vehicle.id}
                />
              </div>
            </FavoritesProvider>
          </div>
        </div>
      </main>

      {/* Footer — Full and Identical to Home */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {store.logo_url && (
                  <img src={store.logo_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                )}
                <span className="font-bold text-gray-900 text-sm">{store.name}</span>
              </div>
              {whatsappPhone && (
                <a
                  href={`https://wa.me/55${whatsappPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L.057 23.852a.5.5 0 0 0 .625.607l6.219-1.63A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 0 1-5.194-1.449l-.39-.23-3.688.968.987-3.594-.243-.38A10 10 0 1 1 12 22z" />
                  </svg>
                  {store.phone}
                </a>
              )}
              {sf.store_address && (
                <p className="text-xs text-gray-500 flex items-start gap-1.5 max-w-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {sf.store_address}
                </p>
              )}
            </div>

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
