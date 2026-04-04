import Link from 'next/link'
import GalleryClient from './GalleryClient'
import { FinancingSimulator } from './FinancingSimulator'
import { VehicleSidebarVTClass } from './VehicleSidebarVTClass'

const fuelLabel: Record<string, string> = {
  flex: 'Flex', gasoline: 'Gasolina', diesel: 'Diesel',
  electric: 'Elétrico', hybrid: 'Híbrido', gas: 'GNV',
}
const transmissionLabel: Record<string, string> = {
  manual: 'Manual', automatic: 'Automático', automated: 'Automatizado', cvt: 'CVT',
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}
function formatMileage(mileage: number) {
  return new Intl.NumberFormat('pt-BR').format(mileage) + ' km'
}

// ─── Spec icons ──────────────────────────────────────────────────────────────

function IconFuel() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
    </svg>
  )
}
function IconColor() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
    </svg>
  )
}
function IconKm() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}
function IconYear() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}
function IconTransmission() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
  )
}
function IconDoors() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  store: {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    phone?: string | null
    city?: string | null
    state?: string | null
    primary_color?: string | null
    secondary_color?: string | null
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
    doors?: number | null
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
  storeSlug: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VehicleDetailVTClass({
  store, vehicle, allImages, primaryColor, secondaryColor,
  whatsappPhone, waLink, slug, showFinancingSimulator, storeSlug,
}: Props) {
  const specItems: { icon: React.ReactNode; label: string; value: string }[] = []
  if (vehicle.fuel) specItems.push({ icon: <IconFuel />, label: 'Combustível', value: fuelLabel[vehicle.fuel] ?? vehicle.fuel })
  if (vehicle.color) specItems.push({ icon: <IconColor />, label: 'Cor', value: vehicle.color })
  if (vehicle.transmission) specItems.push({ icon: <IconTransmission />, label: 'Câmbio', value: transmissionLabel[vehicle.transmission] ?? vehicle.transmission })
  if (vehicle.mileage != null) specItems.push({ icon: <IconKm />, label: 'Quilometragem', value: formatMileage(vehicle.mileage) })
  if (vehicle.year_model) specItems.push({ icon: <IconYear />, label: 'Ano', value: vehicle.year_manuf ? `${vehicle.year_manuf} / ${vehicle.year_model}` : String(vehicle.year_model) })
  if (vehicle.doors) specItems.push({ icon: <IconDoors />, label: 'Portas', value: String(vehicle.doors) })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#DDDDDD' }}>

      {/* Header — igual ao da vitrine */}
      <header className="text-white shadow-md" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {store.logo_url && (
              <img src={store.logo_url} alt={store.name} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover bg-white" />
            )}
            <span className="font-bold text-lg">{store.name}</span>
          </div>
          <Link
            href={`/storefront/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Voltar para a vitrine
          </Link>
        </div>
      </header>


      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-5">

        {/* Title + Price row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 uppercase leading-tight">
            {vehicle.year_model && <span>{vehicle.year_model} </span>}
            {vehicle.brand} {vehicle.model}
            {vehicle.version && ` ${vehicle.version}`}
          </h1>
          {vehicle.price && (
            <div className="text-right flex-shrink-0">
              {vehicle.price_old && (
                <p className="text-sm text-gray-500 line-through">{formatPrice(vehicle.price_old)}</p>
              )}
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: primaryColor }}>
                {formatPrice(vehicle.price)}
              </p>
              {vehicle.price_negotiable && (
                <span className="text-xs font-semibold px-2 py-0.5 text-white" style={{ backgroundColor: secondaryColor }}>
                  Negociável
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_280px] gap-4">

          {/* Gallery */}
          <div className="bg-white">
            <GalleryClient images={allImages} squared />
          </div>

          {/* Resumo */}
          {specItems.length > 0 && (
            <div className="bg-white p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3 text-center border-b border-gray-100 pb-2">Resumo</p>
              <div className="space-y-4">
                {specItems.map(spec => (
                  <div key={spec.label} className="flex flex-col items-center text-center gap-1">
                    <span style={{ color: primaryColor }}>{spec.icon}</span>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <VehicleSidebarVTClass
              price={vehicle.price ?? null}
              priceOld={vehicle.price_old ?? null}
              priceNegotiable={vehicle.price_negotiable ?? null}
              waLink={whatsappPhone ? waLink : null}
              storeName={store.name}
              storeSlug={storeSlug}
              storeCity={store.city ?? null}
              storeState={store.state ?? null}
              storePhone={store.phone ?? null}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              vehicleName={`${vehicle.year_model ? vehicle.year_model + ' ' : ''}${vehicle.brand} ${vehicle.model}${vehicle.version ? ' ' + vehicle.version : ''}`}
              storeId={store.id}
              vehicleId={vehicle.id}
            />
          </div>
        </div>

        {/* Simulator + Features + Description — below grid */}
        <div className="mt-4 space-y-4">
          {showFinancingSimulator && vehicle.price && (
            <FinancingSimulator price={vehicle.price} primaryColor={primaryColor} squared />
          )}

          {vehicle.features && vehicle.features.length > 0 && (
            <div className="bg-white p-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Opcionais</h2>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((f: string) => (
                  <span key={f} className="text-xs px-3 py-1 border border-gray-300 text-gray-700 bg-gray-50 uppercase tracking-wide">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {vehicle.description && (
            <div className="bg-white p-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Descrição</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{vehicle.description}</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer — igual ao da vitrine */}
      <footer className="mt-8 border-t border-gray-300 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>&copy; {new Date().getFullYear()} {store.name}. Todos os direitos reservados.</span>
          <a href="https://vtauto.com.br" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity">
            <span>Desenvolvido por</span>
            <img src="/vt-auto-logo.svg" alt="VT Auto" className="h-4 w-auto" />
          </a>
        </div>
      </footer>
    </div>
  )
}
