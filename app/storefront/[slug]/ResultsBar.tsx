'use client'

import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import type { StorefrontVehicle } from './storefront-helpers'
import type { VehicleFilters } from './useVehicleFilters'
import type { ThemeKey } from './theme-variants'
import { themeVariants } from './theme-variants'
import { FavoritesDrawer } from './FavoritesDrawer'

interface Props {
  filters: VehicleFilters
  vehicles: StorefrontVehicle[]
  sf: StorefrontSettings
  theme: ThemeKey
  storeSlug: string
  primaryColor: string
}

export function ResultsBar({ filters, vehicles, sf, theme, storeSlug, primaryColor }: Props) {
  const v = themeVariants[theme]
  const { filtered, sortOrder, setSortOrder } = filters

  return (
    <div className={`flex items-center justify-between ${v.resultsMargin} gap-3 flex-wrap`}>
      <div className="flex items-center gap-2">
        {theme === 'padrao' ? (
          <span className="text-sm font-medium" style={{ color: primaryColor }}>
            {filtered.length === vehicles.length
              ? `${vehicles.length} ${vehicles.length === 1 ? 'veículo disponível' : 'veículos disponíveis'}`
              : `${filtered.length} de ${vehicles.length} veículos`}
          </span>
        ) : theme === 'premium' ? (
          <span className="text-sm text-gray-600">
            <span className="font-bold text-gray-900">{filtered.length}</span>
            {' '}{filtered.length === 1 ? 'veículo encontrado' : 'veículos encontrados'}
            {filtered.length !== vehicles.length && <span className="text-gray-400"> de {vehicles.length}</span>}
          </span>
        ) : theme === 'vtlx' ? (
          <span className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span>
            {' '}{filtered.length === 1 ? 'veículo' : 'veículos'}
            {filtered.length !== vehicles.length && <span className="text-gray-400"> de {vehicles.length}</span>}
          </span>
        ) : (
          <span className="text-sm text-gray-600 font-medium uppercase tracking-wide">
            {filtered.length} {filtered.length === 1 ? 'veículo' : 'veículos'}
            {filtered.length !== vehicles.length && <span className="text-gray-400 font-normal"> de {vehicles.length}</span>}
          </span>
        )}
        <FavoritesDrawer vehicles={vehicles} storeSlug={storeSlug} primaryColor={primaryColor} />
      </div>
      <select
        value={sortOrder}
        onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
        className={`${v.sortHeight} ${v.sortPx} pr-7 ${v.elementRounded} border ${v.border} text-xs text-gray-600 bg-white focus:outline-none cursor-pointer`}
      >
        <option value="default">Ordenar: Padrão</option>
        <option value="price_asc">Menor preço</option>
        <option value="price_desc">Maior preço</option>
        <option value="newest">Mais novo</option>
      </select>
    </div>
  )
}
