import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import GalleryClient from './GalleryClient'
import { FinancingSimulator } from './FinancingSimulator'
import { VehicleSidebar } from './VehicleSidebar'
import { VehicleDetailVTClass } from './VehicleDetailVTClass'
import { VehicleDetailVTLX } from './VehicleDetailVTLX'

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ backgroundColor: primaryColor }} className="text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {store.logo_url && (
              <img
                src={store.logo_url}
                alt={`Logo ${store.name}`}
                className="h-10 w-10 rounded-full object-cover bg-white"
              />
            )}
            <span className="font-bold text-lg">{store.name}</span>
          </div>
          <Link
            href={`/storefront/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Voltar para a vitrine
          </Link>
        </div>
      </header>

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
          <div className="mt-6 lg:mt-0">
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
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              vehicleName={`${vehicle.brand} ${vehicle.model}${vehicle.year_model ? ' ' + vehicle.year_model : ''}`}
              storeId={store.id}
              vehicleId={vehicle.id}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span>
            &copy; {new Date().getFullYear()} {store.name}. Todos os direitos reservados.
          </span>
          {whatsappPhone && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L.057 23.852a.5.5 0 0 0 .625.607l6.219-1.63A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 0 1-5.194-1.449l-.39-.23-3.688.968.987-3.594-.243-.38A10 10 0 1 1 12 22z" />
              </svg>
              {store.phone}
            </a>
          )}
        </div>
      </footer>
    </div>
  )
}
