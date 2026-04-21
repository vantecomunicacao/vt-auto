'use client'

import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import type { StorefrontVehicle } from './storefront-helpers'
import type { ThemeKey } from './theme-variants'
import { FavoritesProvider } from './FavoritesContext'
import { useVehicleFilters } from './useVehicleFilters'
import { FeaturedCarousel } from './FeaturedCarousel'
import { BrandStrip } from './BrandStrip'
import { SearchBar } from './SearchBar'
import { ResultsBar } from './ResultsBar'
import { VehicleGrid } from './VehicleGrid'
import { CardPadrao, CardVTLX, CardVTClass, CardPremium } from './cards'

interface Props {
  vehicles: StorefrontVehicle[]
  sf: StorefrontSettings
  storeSlug: string
  primaryColor: string
  secondaryColor: string
  whatsappPhone: string
}

export function StorefrontContent({ vehicles, sf, storeSlug, primaryColor, secondaryColor, whatsappPhone }: Props) {
  const theme = (sf.layout_theme || 'padrao') as ThemeKey
  const filters = useVehicleFilters(vehicles)

  const sharedProps = { sf, storeSlug, primaryColor, secondaryColor, whatsappPhone }

  const renderCard = (vehicle: StorefrontVehicle, index: number) => {
    if (theme === 'vtlx') {
      return <CardVTLX key={vehicle.id} vehicle={vehicle} index={index} {...sharedProps} />
    }
    if (theme === 'vtclass') {
      return <CardVTClass key={vehicle.id} vehicle={vehicle} index={index} {...sharedProps} />
    }
    if (theme === 'premium') {
      return <CardPremium key={vehicle.id} vehicle={vehicle} index={index} {...sharedProps} />
    }
    return <CardPadrao key={vehicle.id} vehicle={vehicle} index={index} {...sharedProps} />
  }

  return (
    <FavoritesProvider storeSlug={storeSlug}>
      <SearchBar filters={filters} sf={sf} theme={theme} primaryColor={primaryColor} />
      {sf.featured_carousel && !filters.hasActiveFilters && (
        <FeaturedCarousel
          vehicles={vehicles}
          sf={sf}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          whatsappPhone={whatsappPhone}
        />
      )}
      <BrandStrip
        vehicles={vehicles}
        activeBrand={filters.brandFilter}
        onBrandClick={filters.setBrandFilter}
      />
      <ResultsBar filters={filters} vehicles={vehicles} sf={sf} theme={theme} storeSlug={storeSlug} primaryColor={primaryColor} />
      <VehicleGrid filters={filters} sf={sf} theme={theme} primaryColor={primaryColor}
        renderCard={renderCard}
      />
    </FavoritesProvider>
  )
}
