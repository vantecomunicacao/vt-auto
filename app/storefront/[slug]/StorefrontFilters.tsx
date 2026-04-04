'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import { AnimatedCard } from './AnimatedCard'
import { CarPlaceholder } from './CarPlaceholder'
import { FavoritesProvider } from './FavoritesContext'
import { FavoriteButton } from './FavoriteButton'
import { FavoritesDrawer } from './FavoritesDrawer'

// ─── Types ──────────────────────────────────────────────────────────────────

export type StorefrontVehicle = {
  id: string
  slug: string
  brand: string
  model: string
  version: string | null
  year_model: number | null
  mileage: number | null
  price: number | null
  price_old: number | null
  price_negotiable: boolean | null
  fuel: string | null
  transmission: string | null
  color: string | null
  cover_image_url: string | null
  featured: boolean | null
}

// ─── Labels ─────────────────────────────────────────────────────────────────

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

// ─── WhatsApp icon ───────────────────────────────────────────────────────────

function WaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L.057 23.852a.5.5 0 0 0 .625.607l6.219-1.63A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 0 1-5.194-1.449l-.39-.23-3.688.968.987-3.594-.243-.38A10 10 0 1 1 12 22z" />
    </svg>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  vehicles: StorefrontVehicle[]
  sf: StorefrontSettings
  storeSlug: string
  primaryColor: string
  secondaryColor: string
  whatsappPhone: string
}

export function StorefrontFilters({ vehicles, sf, storeSlug, primaryColor, secondaryColor, whatsappPhone }: Props) {
  const [query, setQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [fuelFilter, setFuelFilter] = useState('')
  const [transmissionFilter, setTransmissionFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobileGrid, setMobileGrid] = useState<1 | 2>(1)
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc' | 'newest'>('default')

  // Unique values for filter dropdowns
  const brands = useMemo(() =>
    [...new Set(vehicles.map(v => v.brand))].sort(), [vehicles])
  const fuels = useMemo(() =>
    [...new Set(vehicles.map(v => v.fuel).filter(Boolean))].sort() as string[], [vehicles])
  const transmissions = useMemo(() =>
    [...new Set(vehicles.map(v => v.transmission).filter(Boolean))].sort() as string[], [vehicles])

  // Filtered + sorted results
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const min = minPrice ? Number(minPrice) : null
    const max = maxPrice ? Number(maxPrice) : null

    const result = vehicles.filter(v => {
      if (q) {
        const searchable = [v.brand, v.model, v.version, v.color, v.year_model]
          .filter(Boolean).join(' ').toLowerCase()
        if (!searchable.includes(q)) return false
      }
      if (brandFilter && v.brand !== brandFilter) return false
      if (fuelFilter && v.fuel !== fuelFilter) return false
      if (transmissionFilter && v.transmission !== transmissionFilter) return false
      if (min && (v.price ?? 0) < min) return false
      if (max && (v.price ?? 0) > max) return false
      return true
    })

    if (sortOrder === 'price_asc') result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sortOrder === 'price_desc') result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    if (sortOrder === 'newest') result.sort((a, b) => (b.year_model ?? 0) - (a.year_model ?? 0))

    return result
  }, [vehicles, query, brandFilter, fuelFilter, transmissionFilter, minPrice, maxPrice, sortOrder])

  const hasActiveFilters = query || brandFilter || fuelFilter || transmissionFilter || minPrice || maxPrice

  function clearAll() {
    setQuery('')
    setBrandFilter('')
    setFuelFilter('')
    setTransmissionFilter('')
    setMinPrice('')
    setMaxPrice('')
  }

  const activeFilterCount = [brandFilter, fuelFilter, transmissionFilter, minPrice, maxPrice].filter(Boolean).length

  // Theme-aware styles
  const themeStyles = {
    padrao:  { 
      containerRounded: 'rounded-xl sm:rounded-2xl', 
      elementRounded: 'rounded-xl',   
      shadow: 'shadow-sm', 
      hover: 'hover:shadow-md',
      border: 'border-gray-200' 
    },
    vtlx:    { 
      containerRounded: 'rounded-lg',               
      elementRounded: 'rounded-lg',   
      shadow: 'shadow-none', 
      hover: 'hover:border-gray-200',
      border: 'border-gray-100' 
    },
    vtclass: { 
      containerRounded: 'rounded-none',             
      elementRounded: 'rounded-none', 
      shadow: 'shadow-none', 
      hover: 'hover:border-gray-400',
      border: 'border-gray-300' 
    },
  }[sf.layout_theme]

  const cardClass = `bg-white border ${themeStyles.border} ${themeStyles.containerRounded} ${themeStyles.shadow} ${themeStyles.hover}`

  return (
    <FavoritesProvider storeSlug={storeSlug}>
    <div>

      {/* ── Search + Filters bar ── */}
      <div className={`bg-white border ${themeStyles.border} ${themeStyles.containerRounded} p-3 sm:p-4 mb-4 sm:mb-6 ${themeStyles.shadow} space-y-2 sm:space-y-3`}>
        {/* Search + toggle button row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar marca, modelo, cor, ano..."
              className={`w-full h-10 pl-9 pr-8 ${themeStyles.elementRounded} border ${themeStyles.border} text-sm focus:outline-none bg-gray-50 focus:bg-white transition-colors`}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            )}
          </div>

          {/* Toggle grid mobile — só no mobile */}
          <div className="flex sm:hidden gap-1">
            <button
              onClick={() => setMobileGrid(1)}
              className={`w-10 h-10 flex items-center justify-center ${themeStyles.elementRounded} border transition-colors ${mobileGrid === 1 ? 'border-blue-500 bg-blue-50 text-blue-600' : `${themeStyles.border} text-gray-400 hover:bg-gray-50`}`}
              title="1 coluna"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Zm0 8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3Z" />
              </svg>
            </button>
            <button
              onClick={() => setMobileGrid(2)}
              className={`w-10 h-10 flex items-center justify-center ${themeStyles.elementRounded} border transition-colors ${mobileGrid === 2 ? 'border-blue-500 bg-blue-50 text-blue-600' : `${themeStyles.border} text-gray-400 hover:bg-gray-50`}`}
              title="2 colunas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4Zm8 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4Z" />
              </svg>
            </button>
          </div>

          {/* Filtrar button */}
          {(sf.filter_brand || sf.filter_fuel || sf.filter_transmission || sf.filter_price) && (
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className={`flex-shrink-0 flex items-center gap-1.5 h-10 px-3 ${themeStyles.elementRounded} border text-sm font-medium transition-colors ${filtersOpen || activeFilterCount > 0 ? 'border-blue-500 bg-blue-50 text-blue-700' : `${themeStyles.border} text-gray-600 hover:bg-gray-50`}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Filter dropdowns — colapsáveis no mobile */}
        {filtersOpen && (sf.filter_brand || sf.filter_fuel || sf.filter_transmission || sf.filter_price) && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
            {sf.filter_brand && brands.length > 1 && (
              <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
                className={`h-9 px-3 pr-8 ${themeStyles.elementRounded} border text-sm bg-white cursor-pointer focus:outline-none transition-colors ${brandFilter ? 'border-blue-500 text-blue-700 bg-blue-50' : `${themeStyles.border} text-gray-600`}`}>
                <option value="">Todas as marcas</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            {sf.filter_fuel && fuels.length > 1 && (
              <select value={fuelFilter} onChange={e => setFuelFilter(e.target.value)}
                className={`h-9 px-3 pr-8 ${themeStyles.elementRounded} border text-sm bg-white cursor-pointer focus:outline-none transition-colors ${fuelFilter ? 'border-blue-500 text-blue-700 bg-blue-50' : `${themeStyles.border} text-gray-600`}`}>
                <option value="">Combustível</option>
                {fuels.map(f => <option key={f} value={f}>{fuelLabel[f] ?? f}</option>)}
              </select>
            )}
            {sf.filter_transmission && transmissions.length > 1 && (
              <select value={transmissionFilter} onChange={e => setTransmissionFilter(e.target.value)}
                className={`h-9 px-3 pr-8 ${themeStyles.elementRounded} border text-sm bg-white cursor-pointer focus:outline-none transition-colors ${transmissionFilter ? 'border-blue-500 text-blue-700 bg-blue-50' : `${themeStyles.border} text-gray-600`}`}>
                <option value="">Câmbio</option>
                {transmissions.map(t => <option key={t} value={t}>{transmissionLabel[t] ?? t}</option>)}
              </select>
            )}
            {sf.filter_price && (
              <>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  placeholder="Preço mín." className={`h-9 px-3 ${themeStyles.elementRounded} border text-sm focus:outline-none w-32 transition-colors ${minPrice ? 'border-blue-500 text-blue-700 bg-blue-50' : `${themeStyles.border} text-gray-600 bg-white`}`} />
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Preço máx." className={`h-9 px-3 ${themeStyles.elementRounded} border text-sm focus:outline-none w-32 transition-colors ${maxPrice ? 'border-blue-500 text-blue-700 bg-blue-50' : `${themeStyles.border} text-gray-600 bg-white`}`} />
              </>
            )}
            {hasActiveFilters && (
              <button onClick={clearAll} className={`h-9 px-3 ${themeStyles.elementRounded} text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-colors`}>
                Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results counter + favorites + sort ── */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: primaryColor }}>
            {filtered.length === vehicles.length
              ? `${vehicles.length} ${vehicles.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}`
              : `${filtered.length} de ${vehicles.length} veículos`}
          </span>
          <FavoritesDrawer vehicles={vehicles} storeSlug={storeSlug} primaryColor={primaryColor} />
        </div>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
          className={`h-8 px-2 pr-7 ${themeStyles.elementRounded} border ${themeStyles.border} text-xs text-gray-600 bg-white focus:outline-none cursor-pointer`}
        >
          <option value="default">Ordenar: Padrão</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
          <option value="newest">Mais novo</option>
        </select>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14 text-gray-300 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <p className="text-gray-500 text-sm">Nenhum veículo encontrado para estes filtros.</p>
          <button onClick={clearAll} className="mt-3 text-sm underline" style={{ color: primaryColor }}>
            Ver todos os veículos
          </button>
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-6 ${mobileGrid === 2 ? 'grid-cols-2' : 'grid-cols-1'} ${{ '2': 'sm:grid-cols-2', '3': 'sm:grid-cols-2 lg:grid-cols-3', '4': 'sm:grid-cols-3 lg:grid-cols-4' }[sf.grid_cols]}`}>
          {filtered.map((vehicle, index) => {
            const vehicleHref = `/storefront/${storeSlug}/veiculo/${vehicle.slug}`
            const waMsg = encodeURIComponent(
              `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model}${vehicle.year_model ? ` ${vehicle.year_model}` : ''} - Cód: ${vehicle.slug}`
            )
            const waHref = whatsappPhone ? `https://wa.me/55${whatsappPhone}?text=${waMsg}` : null

            const detailsBtnStyle = sf.btn_details_style === 'outline'
              ? { border: `2px solid ${primaryColor}`, color: primaryColor, background: 'transparent' }
              : { backgroundColor: primaryColor, color: '#fff' }

            const waBtnClass = sf.btn_whatsapp_style === 'filled'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'border-2 border-green-500 text-green-600 hover:bg-green-50'

            return (
              <AnimatedCard key={vehicle.id} delay={index * 50}>
              <div className={`group transition-shadow overflow-hidden flex flex-col h-full ${cardClass}`}>
                {/* Image */}
                <Link href={vehicleHref} className="relative aspect-[4/3] bg-gray-100 overflow-hidden block">
                  {vehicle.cover_image_url ? (
                    <img src={vehicle.cover_image_url} alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 bg-gray-50">
                      <CarPlaceholder className="w-full h-full opacity-60" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {vehicle.featured && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: secondaryColor }}>Destaque</span>
                    )}
                    {vehicle.price_negotiable && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: secondaryColor, opacity: 0.85 }}>Negociável</span>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <FavoriteButton vehicleId={vehicle.id} />
                  </div>
                </Link>

                {/* Content */}
                <div className={`flex flex-col flex-1 ${mobileGrid === 2 ? 'p-2.5 sm:p-4' : 'p-4'}`}>
                  <Link href={vehicleHref} className="block mb-1 sm:mb-2">
                    <h2 className={`font-semibold text-gray-900 leading-snug hover:underline ${mobileGrid === 2 ? 'text-xs sm:text-base' : 'text-base'}`}>
                      {vehicle.brand} {vehicle.model}
                      {vehicle.version && <span className="font-normal text-gray-500 hidden sm:inline"> {vehicle.version}</span>}
                    </h2>
                  </Link>

                  {/* Specs — ocultas em 2 col mobile para economizar espaço */}
                  <div className={`flex flex-wrap gap-1 mb-2 ${mobileGrid === 2 ? 'hidden sm:flex' : 'flex mb-3 gap-1.5'}`}>
                    {sf.show_year && vehicle.year_model && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{vehicle.year_model}</span>
                    )}
                    {sf.show_mileage && vehicle.mileage != null && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{formatMileage(vehicle.mileage)}</span>
                    )}
                    {sf.show_fuel && vehicle.fuel && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{fuelLabel[vehicle.fuel] ?? vehicle.fuel}</span>
                    )}
                    {sf.show_transmission && vehicle.transmission && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{transmissionLabel[vehicle.transmission] ?? vehicle.transmission}</span>
                    )}
                  </div>

                  <div className={`flex items-end gap-1.5 flex-wrap mt-auto ${mobileGrid === 2 ? 'mb-2' : 'mb-4'}`}>
                    {vehicle.price_old && mobileGrid !== 2 && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(vehicle.price_old)}</span>
                    )}
                    <span className={`font-bold ${mobileGrid === 2 ? 'text-sm sm:text-lg' : 'text-lg'}`} style={{ color: primaryColor }}>
                      {vehicle.price ? formatPrice(vehicle.price) : 'Consulte'}
                    </span>
                  </div>

                  <div className="flex gap-1.5 sm:gap-2">
                    <Link href={vehicleHref}
                      className={`flex-1 text-center font-medium ${themeStyles.elementRounded} transition-opacity hover:opacity-90 ${mobileGrid === 2 ? 'text-xs py-1.5 sm:text-sm sm:py-2' : 'text-sm py-2'}`}
                      style={detailsBtnStyle}>
                      {mobileGrid === 2 ? 'Ver' : (sf.btn_details_label || 'Ver detalhes')}
                    </Link>
                    {waHref && (
                      <a href={waHref} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-1 ${themeStyles.elementRounded} font-medium transition-colors ${waBtnClass} ${mobileGrid === 2 ? 'px-2 py-1.5 sm:px-3 sm:py-2' : 'gap-1.5 px-3 py-2 text-sm'}`}
                        title="Falar no WhatsApp">
                        <WaIcon />
                        <span className={mobileGrid === 2 ? 'hidden sm:inline text-sm' : 'text-sm'}>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              </AnimatedCard>
            )
          })}
        </div>
      )}
    </div>
    </FavoritesProvider>
  )
}
