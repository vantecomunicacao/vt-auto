'use client'

import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import type { VehicleFilters } from './useVehicleFilters'
import type { ThemeKey } from './theme-variants'
import { themeVariants } from './theme-variants'
import { fuelLabel, transmissionLabel } from './storefront-helpers'
import { SearchIcon, FilterIcon, CloseIcon } from './storefront-icons'

interface Props {
  filters: VehicleFilters
  sf: StorefrontSettings
  theme: ThemeKey
  primaryColor: string
}

export function SearchBar({ filters, sf, theme, primaryColor }: Props) {
  const v = themeVariants[theme]
  const {
    query, setQuery, brandFilter, setBrandFilter, fuelFilter, setFuelFilter,
    transmissionFilter, setTransmissionFilter, minPrice, setMinPrice, maxPrice, setMaxPrice,
    filtersOpen, setFiltersOpen,
    brands, fuels, transmissions, activeFilterCount, hasActiveFilters, clearAll,
  } = filters

  const hasFilterOptions = sf.filter_brand || sf.filter_fuel || sf.filter_transmission || sf.filter_price

  // Themes that use a wrapper card around the search bar
  const hasWrapper = theme === 'padrao' || theme === 'premium'

  return (
    <div className={`mb-4 ${hasWrapper ? `bg-white border ${v.border} ${v.containerRounded} p-3 sm:p-4 ${v.shadow} space-y-2 sm:space-y-3` : ''}`}>
      <div className={`flex ${theme === 'vtclass' ? 'gap-0' : 'gap-2'}`}>
        {/* Search input */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={theme === 'vtclass' ? 'Pesquise por modelo ou marca...' : 'Buscar marca, modelo, cor, ano...'}
            className={`w-full ${v.inputHeight} pl-10 pr-8 ${v.elementRounded} border ${v.border} ${v.searchBg} text-sm focus:outline-none focus:border-gray-400 transition-colors`}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <CloseIcon />
            </button>
          )}
        </div>

        {/* VTClass: BUSCAR button */}
        {theme === 'vtclass' && (
          <button
            className="flex-shrink-0 h-10 px-5 text-white text-sm font-bold tracking-wide transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
            onClick={() => filters.setFiltersOpen(false)}
          >
            BUSCAR
          </button>
        )}

        {/* Filter toggle button */}
        {hasFilterOptions && (
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className={`flex-shrink-0 flex items-center gap-1.5 ${v.filterBtnHeight} ${v.filterBtnPx} ${v.elementRounded} border text-sm font-medium transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? theme === 'padrao' ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : theme === 'premium' ? 'bg-gray-900 text-white border-gray-900'
                  : theme === 'vtlx' ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-gray-700 text-white border-gray-700'
                : theme === 'padrao' ? `${v.border} text-gray-600 hover:bg-gray-50`
                  : theme === 'premium' ? `border-gray-300 text-gray-600 hover:bg-gray-50`
                  : theme === 'vtlx' ? 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  : `bg-white text-gray-600 ${v.border} hover:bg-gray-50`
            } ${theme === 'vtclass' ? 'border-l-0' : ''}`}
          >
            <FilterIcon />
            Filtros
            {activeFilterCount > 0 && (
              <span className={`text-xs w-4 h-4 flex items-center justify-center font-bold leading-none ${
                theme === 'padrao' ? 'bg-blue-600 text-white rounded-full'
                  : theme === 'premium' ? 'bg-white text-gray-900 rounded-full'
                  : theme === 'vtlx' ? 'bg-white text-gray-900 rounded-full ml-0.5'
                  : 'bg-white text-gray-900'
              }`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filter panel */}
      {filtersOpen && hasFilterOptions && (
        <div className={`${
          theme === 'padrao' || theme === 'premium'
            ? 'flex flex-wrap gap-2 pt-2 border-t border-gray-100'
            : theme === 'vtlx' ? 'mt-3 bg-white border border-gray-200 rounded-2xl p-4 space-y-3'
            : 'bg-white border border-t-0 border-gray-300 p-3'
        }`}>
          <div className={theme === 'padrao' || theme === 'premium' ? 'contents' : theme === 'vtlx' ? 'flex flex-wrap gap-2' : 'flex flex-wrap gap-2'}>
            {sf.filter_brand && brands.length > 1 && (
              <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
                className={`${v.filterHeight} px-3 pr-8 ${v.elementRounded} border text-sm bg-white cursor-pointer focus:outline-none transition-colors ${brandFilter ? v.filterActive : v.filterInactive}`}>
                <option value="">Todas as marcas</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            {sf.filter_fuel && fuels.length > 1 && (
              <select value={fuelFilter} onChange={e => setFuelFilter(e.target.value)}
                className={`${v.filterHeight} px-3 pr-8 ${v.elementRounded} border text-sm bg-white cursor-pointer focus:outline-none transition-colors ${fuelFilter ? v.filterActive : v.filterInactive}`}>
                <option value="">Combustível</option>
                {fuels.map(f => <option key={f} value={f}>{fuelLabel[f] ?? f}</option>)}
              </select>
            )}
            {sf.filter_transmission && transmissions.length > 1 && (
              <select value={transmissionFilter} onChange={e => setTransmissionFilter(e.target.value)}
                className={`${v.filterHeight} px-3 pr-8 ${v.elementRounded} border text-sm bg-white cursor-pointer focus:outline-none transition-colors ${transmissionFilter ? v.filterActive : v.filterInactive}`}>
                <option value="">Câmbio</option>
                {transmissions.map(t => <option key={t} value={t}>{transmissionLabel[t] ?? t}</option>)}
              </select>
            )}
            {sf.filter_price && (
              <>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  placeholder="Preço mín." className={`${v.filterHeight} px-3 ${v.elementRounded} border text-sm focus:outline-none w-32 transition-colors ${minPrice ? v.filterActive : `${v.filterInactive} bg-white`}`} />
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Preço máx." className={`${v.filterHeight} px-3 ${v.elementRounded} border text-sm focus:outline-none w-32 transition-colors ${maxPrice ? v.filterActive : `${v.filterInactive} bg-white`}`} />
              </>
            )}
          </div>
          {hasActiveFilters && (
            theme === 'padrao' || theme === 'premium' ? (
              <button onClick={clearAll} className={`${v.filterHeight} px-3 ${v.elementRounded} text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-colors`}>
                Limpar
              </button>
            ) : theme === 'vtlx' ? (
              <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-800 underline">
                Limpar filtros
              </button>
            ) : (
              <button onClick={clearAll} className="h-9 px-3 text-xs text-gray-500 hover:text-gray-800 border border-gray-300 bg-white">
                Limpar
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
