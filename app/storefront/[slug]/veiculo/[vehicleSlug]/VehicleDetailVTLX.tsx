'use client'

import GalleryClient from './GalleryClient'
import { FinancingSimulator } from './FinancingSimulator'
import { VehicleSidebarVTLX } from './VehicleSidebarVTLX'
import { FavoritesProvider } from '../../FavoritesContext'
import { StorefrontHeader } from '../../StorefrontHeader'
import { StorefrontFooter } from '../../StorefrontFooter'
import { VehicleMobileBar } from './VehicleMobileBar'
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
    landline?: string | null
    email?: string | null
    address?: string | null
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
      <StorefrontHeader
        store={store}
        whatsappPhone={whatsappPhone}
        primaryColor={primaryColor}
        sf={{ ...sf, layout_theme: 'vtlx' }}
        backHref={`/storefront/${slug}`}
      />

      {/* Main */}
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8">
        {/* Title + badges */}
        <div className="mb-8">
          {vehicle.price_negotiable && (
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-amber-100 text-amber-700">
                Negociável
              </span>
            </div>
          )}
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
          <div id="vehicle-sidebar" className="mt-8 lg:mt-0">
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
                  storeLandline={store.landline ?? null}
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

      <StorefrontFooter store={store} whatsappPhone={whatsappPhone} sf={sf} />
      <VehicleMobileBar
        waLink={whatsappPhone ? waLink : null}
        price={vehicle.price ?? null}
        primaryColor={primaryColor}
        sidebarId="vehicle-sidebar"
      />
    </div>
  )
}
