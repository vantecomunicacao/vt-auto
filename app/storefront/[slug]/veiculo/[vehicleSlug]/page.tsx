import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import GalleryClient from './GalleryClient'
import { FinancingSimulator } from './FinancingSimulator'
import { VehicleSidebar } from './VehicleSidebar'
import { VehicleDetailVTClass } from './VehicleDetailVTClass'
import { VehicleDetailVTLX } from './VehicleDetailVTLX'
import { StorefrontHeader } from '../../StorefrontHeader'
import { StorefrontFooter } from '../../StorefrontFooter'
import { VehicleMobileBar } from './VehicleMobileBar'

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
  params: Promise<{ slug: string; vehicleSlug: string }>
}): Promise<Metadata> {
  const { slug, vehicleSlug } = await params
  const adminClient = createAdminClient()

  const { data: store } = await adminClient.from('stores').select('id,name').eq('slug', slug).single()
  if (!store) return {}

  const { data: vehicle } = await adminClient
    .from('vehicles')
    .select('brand,model,version,year_model,price,cover_image_url')
    .eq('store_id', store.id)
    .eq('slug', vehicleSlug)
    .single()
  if (!vehicle) return {}

  const title = `${vehicle.brand} ${vehicle.model}${vehicle.version ? ' ' + vehicle.version : ''}${vehicle.year_model ? ' ' + vehicle.year_model : ''} — ${store.name}`
  const description = vehicle.price
    ? `${vehicle.brand} ${vehicle.model} por ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vehicle.price)} em ${store.name}`
    : `${vehicle.brand} ${vehicle.model} disponível em ${store.name}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: vehicle.cover_image_url ? [{ url: vehicle.cover_image_url }] : [],
    },
  }
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; vehicleSlug: string }>
}) {
  const { slug, vehicleSlug } = await params
  const adminClient = createAdminClient()

  const { data: store, error: storeError } = await adminClient
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .single()

  if (storeError || !store) {
    notFound()
  }

  const { data: vehicle, error: vehicleError } = await adminClient
    .from('vehicles')
    .select('*')
    .eq('store_id', store.id)
    .eq('slug', vehicleSlug)
    .eq('status', 'available')
    .single()

  if (vehicleError || !vehicle) {
    notFound()
  }

  const { data: imagesData } = await adminClient
    .from('vehicle_images')
    .select('url, is_cover, sort_order')
    .eq('vehicle_id', vehicle.id)
    .order('sort_order')

  // Build images array: cover first, then the rest
  const allImages: string[] = []
  if (imagesData && imagesData.length > 0) {
    const coverImages = imagesData.filter((img) => img.is_cover).map((img) => img.url)
    const otherImages = imagesData.filter((img) => !img.is_cover).map((img) => img.url)
    allImages.push(...coverImages, ...otherImages)
  } else if (vehicle.cover_image_url) {
    allImages.push(vehicle.cover_image_url)
  }

  const sf = store.storefront_settings ?? {}
  const showFinancingSimulator = sf.financing_simulator !== false // default true

  const whatsappPhone = store.phone?.replace(/\D/g, '') ?? ''
  const secondaryColor = store.secondary_color ?? store.primary_color ?? '#1e40af'
  const waMessage = encodeURIComponent(
    `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year_model}`
  )
  const waLink = `https://wa.me/55${whatsappPhone}?text=${waMessage}`

  const specs: { label: string; value: string }[] = []
  if (vehicle.year_model) specs.push({ label: 'Ano modelo', value: String(vehicle.year_model) })
  if (vehicle.year_manuf) specs.push({ label: 'Ano fabricação', value: String(vehicle.year_manuf) })
  if (vehicle.mileage != null) specs.push({ label: 'Quilometragem', value: formatMileage(vehicle.mileage) })
  if (vehicle.fuel) specs.push({ label: 'Combustível', value: fuelLabel[vehicle.fuel] ?? vehicle.fuel })
  if (vehicle.transmission) specs.push({ label: 'Câmbio', value: transmissionLabel[vehicle.transmission] ?? vehicle.transmission })
  if (vehicle.color) specs.push({ label: 'Cor', value: vehicle.color })
  if (vehicle.body_type) specs.push({ label: 'Carroceria', value: vehicle.body_type })
  if (vehicle.doors) specs.push({ label: 'Portas', value: String(vehicle.doors) })
  if (vehicle.seats) specs.push({ label: 'Lugares', value: String(vehicle.seats) })
  if (vehicle.engine) specs.push({ label: 'Motor', value: vehicle.engine })
  if (vehicle.power) specs.push({ label: 'Potência', value: vehicle.power })

  const primaryColor = store.primary_color ?? '#1e40af'
  const layoutTheme = (store.storefront_settings as Record<string, unknown>)?.layout_theme ?? 'padrao'

  if (layoutTheme === 'vtclass') {
    return (
      <VehicleDetailVTClass
        store={store}
        vehicle={vehicle}
        allImages={allImages}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        whatsappPhone={whatsappPhone}
        waLink={waLink}
        slug={slug}
        storeSlug={slug}
        showFinancingSimulator={showFinancingSimulator}
        sf={sf}
      />
    )
  }

  if (layoutTheme === 'vtlx') {
    return (
      <VehicleDetailVTLX
        store={store}
        vehicle={vehicle}
        allImages={allImages}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        whatsappPhone={whatsappPhone}
        waLink={waLink}
        slug={slug}
        showFinancingSimulator={showFinancingSimulator}
        sf={sf}
      />
    )
  }

  const isPremium = layoutTheme === 'premium'
  const bgColor = isPremium ? '#F5F5F0' : '#F9FAFB'

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <StorefrontHeader store={store} whatsappPhone={whatsappPhone} primaryColor={primaryColor} sf={sf} backHref={`/storefront/${slug}`} />

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left column: gallery + specs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
                {vehicle.version && (
                  <span className="font-normal text-gray-500"> {vehicle.version}</span>
                )}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {vehicle.year_model && (
                  <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {vehicle.year_model}
                  </span>
                )}
                {vehicle.mileage != null && (
                  <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {formatMileage(vehicle.mileage)}
                  </span>
                )}
                {vehicle.fuel && (
                  <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {fuelLabel[vehicle.fuel] ?? vehicle.fuel}
                  </span>
                )}
                {vehicle.transmission && (
                  <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {transmissionLabel[vehicle.transmission] ?? vehicle.transmission}
                  </span>
                )}
              </div>
            </div>

            {/* Gallery */}
            <GalleryClient images={allImages} />

            {/* Specs */}
            {specs.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Especificações</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {specs.map((spec) => (
                    <div key={spec.label}>
                      <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                        {spec.label}
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">{spec.value}</dd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features / Opcionais */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Opcionais</h2>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature: string) => (
                    <span
                      key={feature}
                      className="text-sm px-3 py-1 rounded-full border border-gray-200 text-gray-700 bg-gray-50"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Financing simulator */}
            {showFinancingSimulator && vehicle.price && (
              <FinancingSimulator price={vehicle.price} primaryColor={primaryColor} />
            )}

            {/* Description */}
            {vehicle.description && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h2>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {vehicle.description}
                </p>
              </div>
            )}

          </div>

          {/* Right column: price + CTA (sticky on desktop) */}
          <div id="vehicle-sidebar" className="mt-6 lg:mt-0">
            <VehicleSidebar
              price={vehicle.price}
              priceOld={vehicle.price_old}
              priceNegotiable={vehicle.price_negotiable}
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
