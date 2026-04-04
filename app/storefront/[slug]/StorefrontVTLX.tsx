'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import type { StorefrontVehicle } from './StorefrontFilters'
import { CarPlaceholder } from './CarPlaceholder'
import { AnimatedCard } from './AnimatedCard'
import { FavoritesProvider } from './FavoritesContext'
import { FavoriteButton } from './FavoriteButton'
import { FavoritesDrawer } from './FavoritesDrawer'

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

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  vehicles: StorefrontVehicle[]
  sf: StorefrontSettings
  storeSlug: string
  primaryColor: string
  secondaryColor: string
  whatsappPhone: string
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function StorefrontVTLX({ vehicles, sf, storeSlug, primaryColor, secondaryColor, whatsappPhone }: Props) {
  const [query, setQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [fuelFilter, setFuelFilter] = useState('')
  const [transmissionFilter, setTransmissionFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc' | 'newest'>('default')

  const brands = useMemo(() => [...new Set(vehicles.map(v => v.brand))].sort(), [vehicles])
  const fuels = useMemo(() => [...new Set(vehicles.map(v => v.fuel).filter(Boolean))].sort() as string[], [vehicles])
  const transmissions = useMemo(() => [...new Set(vehicles.map(v => v.transmission).filter(Boolean))].sort() as string[], [vehicles])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const min = minPrice ? Number(minPrice) : null
    const max = maxPrice ? Number(maxPrice) : null

    const result = vehicles.filter(v => {
      if (q) {
        const searchable = [v.brand, v.model, v.version, v.color, v.year_model].filter(Boolean).join(' ').toLowerCase()
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

  const activeFilterCount = [brandFilter, fuelFilter, transmissionFilter, minPrice, maxPrice].filter(Boolean).length
  const hasActiveFilters = !!(query || brandFilter || fuelFilter || transmissionFilter || minPrice || maxPrice)

  function clearAll() {
    setQuery(''); setBrandFilter(''); setFuelFilter('')
    setTransmissionFilter(''); setMinPrice(''); setMaxPrice('')
  }

  return (
    <FavoritesProvider storeSlug={storeSlug}>

      {/* ── Search bar ── */}
      <div className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar marca, modelo, cor, ano..."
              className="w-full h-11 pl-10 pr-9 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:border-gray-400 "
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter toggle */}
          {(sf.filter_brand || sf.filter_fuel || sf.filter_transmission || sf.filter_price) && (
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className={`flex-shrink-0 flex items-center gap-1.5 h-11 px-4 rounded-full border text-sm font-medium  transition-colors ${filtersOpen || activeFilterCount > 0 ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-white text-gray-900 text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Filter panel — empilhado */}
        {filtersOpen && (
          <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-4  space-y-3">
            <div className="flex flex-wrap gap-2">
              {sf.filter_brand && brands.length > 1 && (
                <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
                  className={`h-10 px-3 pr-8 rounded-full border text-sm bg-white cursor-pointer focus:outline-none ${brandFilter ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-600'}`}>
                  <option value="">Todas as marcas</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
              {sf.filter_fuel && fuels.length > 1 && (
                <select value={fuelFilter} onChange={e => setFuelFilter(e.target.value)}
                  className={`h-10 px-3 pr-8 rounded-full border text-sm bg-white cursor-pointer focus:outline-none ${fuelFilter ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-600'}`}>
                  <option value="">Combustível</option>
                  {fuels.map(f => <option key={f} value={f}>{fuelLabel[f] ?? f}</option>)}
                </select>
              )}
              {sf.filter_transmission && transmissions.length > 1 && (
                <select value={transmissionFilter} onChange={e => setTransmissionFilter(e.target.value)}
                  className={`h-10 px-3 pr-8 rounded-full border text-sm bg-white cursor-pointer focus:outline-none ${transmissionFilter ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-600'}`}>
                  <option value="">Câmbio</option>
                  {transmissions.map(t => <option key={t} value={t}>{transmissionLabel[t] ?? t}</option>)}
                </select>
              )}
              {sf.filter_price && (
                <>
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                    placeholder="Preço mín." className="h-10 px-4 rounded-full border border-gray-200 text-sm focus:outline-none w-32 bg-white" />
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                    placeholder="Preço máx." className="h-10 px-4 rounded-full border border-gray-200 text-sm focus:outline-none w-32 bg-white" />
                </>
              )}
            </div>
            {hasActiveFilters && (
              <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-800 underline">
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results bar ── */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span>
            {' '}{filtered.length === 1 ? 'veículo' : 'veículos'}
            {filtered.length !== vehicles.length && <span className="text-gray-400"> de {vehicles.length}</span>}
          </span>
          <FavoritesDrawer vehicles={vehicles} storeSlug={storeSlug} primaryColor={primaryColor} />
        </div>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
          className="h-9 px-3 pr-7 rounded-full border border-gray-200 text-xs text-gray-600 bg-white focus:outline-none cursor-pointer"
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
          <p className="text-gray-500 text-sm">Nenhum veículo encontrado.</p>
          {hasActiveFilters && (
            <button onClick={clearAll} className="mt-3 text-sm underline text-gray-500 hover:text-gray-800">
              Ver todos os veículos
            </button>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${{ '2': 'sm:grid-cols-2', '3': 'sm:grid-cols-2 lg:grid-cols-3', '4': 'sm:grid-cols-3 lg:grid-cols-4' }[sf.grid_cols]}`}>
          {filtered.map((vehicle, index) => {
            const vehicleHref = `/storefront/${storeSlug}/veiculo/${vehicle.slug}`
            const waMsg = encodeURIComponent(
              `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model}${vehicle.year_model ? ` ${vehicle.year_model}` : ''} - Cód: ${vehicle.slug}`
            )
            const waHref = whatsappPhone ? `https://wa.me/55${whatsappPhone}?text=${waMsg}` : null

            return (
              <AnimatedCard key={vehicle.id} delay={index * 40}>
                <Link href={vehicleHref} className="group block bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-gray-300 transition-colors h-full">

                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {vehicle.cover_image_url ? (
                      <img
                        src={vehicle.cover_image_url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50">
                        <CarPlaceholder className="w-full h-full opacity-50" />
                      </div>
                    )}

                    {/* Badges — canto superior esquerdo */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {vehicle.featured && (
                        <span className="text-white text-xs font-semibold px-2.5 py-1 rounded-md leading-none" style={{ backgroundColor: secondaryColor }}>
                          Destaque
                        </span>
                      )}
                      {vehicle.price_negotiable && (
                        <span className="text-white text-xs font-semibold px-2.5 py-1 rounded-md leading-none" style={{ backgroundColor: secondaryColor, opacity: 0.85 }}>
                          Aceita trocas
                        </span>
                      )}
                    </div>

                    {/* Favorite — fundo branco sólido */}
                    <div className="absolute top-2 right-2">
                      <FavoriteButton vehicleId={vehicle.id} solid />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    {/* Title */}
                    <h2 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">
                      {vehicle.brand} {vehicle.model}
                      {vehicle.version && <span className="font-normal text-gray-500"> {vehicle.version}</span>}
                    </h2>

                    {/* Specs pills */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {sf.show_year && vehicle.year_model && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{vehicle.year_model}</span>
                      )}
                      {sf.show_mileage && vehicle.mileage != null && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{formatMileage(vehicle.mileage)}</span>
                      )}
                      {sf.show_fuel && vehicle.fuel && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{fuelLabel[vehicle.fuel] ?? vehicle.fuel}</span>
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      {vehicle.price_old && (
                        <p className="text-xs text-gray-400 line-through leading-none mb-0.5">{formatPrice(vehicle.price_old)}</p>
                      )}
                      <p className="text-base font-bold text-gray-900 leading-tight">
                        {vehicle.price ? formatPrice(vehicle.price) : 'Consulte'}
                      </p>
                    </div>

                    {/* WhatsApp link — discreto */}
                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="mt-2 flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L.057 23.852a.5.5 0 0 0 .625.607l6.219-1.63A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 0 1-5.194-1.449l-.39-.23-3.688.968.987-3.594-.243-.38A10 10 0 1 1 12 22z" />
                        </svg>
                        Falar no WhatsApp
                      </a>
                    )}
                  </div>
                </Link>
              </AnimatedCard>
            )
          })}
        </div>
      )}
    </FavoritesProvider>
  )
}
