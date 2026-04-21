'use client'

import type { ReactNode } from 'react'
import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import type { StorefrontVehicle } from './storefront-helpers'
import type { VehicleFilters } from './useVehicleFilters'
import type { ThemeKey } from './theme-variants'
import { EmptySearchIcon } from './storefront-icons'

interface Props {
  filters: VehicleFilters
  sf: StorefrontSettings
  theme: ThemeKey
  primaryColor: string
  renderCard: (vehicle: StorefrontVehicle, index: number) => ReactNode
}

export function VehicleGrid({ filters, sf, theme, primaryColor, renderCard }: Props) {
  const { filtered, hasActiveFilters, clearAll } = filters

  const gapClass = theme === 'vtclass' ? 'gap-2 sm:gap-3' : theme === 'vtlx' ? 'gap-3 sm:gap-4' : theme === 'premium' ? 'gap-4 sm:gap-5' : 'gap-3 sm:gap-6'

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <EmptySearchIcon className={`w-14 h-14 ${theme === 'vtclass' ? 'text-gray-400' : 'text-gray-300'} mb-4`} />
        <p className={`text-sm ${theme === 'vtclass' ? 'text-gray-600 uppercase tracking-wide' : 'text-gray-500'}`}>
          {theme === 'vtclass' ? 'Nenhum veículo encontrado' : 'Nenhum veículo encontrado.'}
        </p>
        {hasActiveFilters && (
          theme === 'padrao' ? (
            <button onClick={clearAll} className="mt-3 text-sm underline" style={{ color: primaryColor }}>
              Ver todos os veículos
            </button>
          ) : (
            <button onClick={clearAll} className="mt-3 text-sm underline text-gray-500 hover:text-gray-800">
              Ver todos os veículos
            </button>
          )
        )}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${gapClass}`}>
      {filtered.map((vehicle, index) => renderCard(vehicle, index))}
    </div>
  )
}
