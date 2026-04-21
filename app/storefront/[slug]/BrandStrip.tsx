'use client'

import { useMemo } from 'react'
import type { StorefrontVehicle } from './storefront-helpers'

/** Maps brand names (lowercased) to public logo URLs. */
const brandLogos: Record<string, string> = {
  audi: 'https://www.carlogos.org/car-logos/audi-logo.png',
  bmw: 'https://www.carlogos.org/car-logos/bmw-logo.png',
  chevrolet: 'https://www.carlogos.org/car-logos/chevrolet-logo.png',
  citroen: 'https://www.carlogos.org/car-logos/citroen-logo.png',
  fiat: 'https://www.carlogos.org/car-logos/fiat-logo.png',
  ford: 'https://www.carlogos.org/car-logos/ford-logo.png',
  honda: 'https://www.carlogos.org/car-logos/honda-logo.png',
  hyundai: 'https://www.carlogos.org/car-logos/hyundai-logo.png',
  jeep: 'https://www.carlogos.org/car-logos/jeep-logo.png',
  kia: 'https://www.carlogos.org/car-logos/kia-logo.png',
  mercedes: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  'mercedes-benz': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  mitsubishi: 'https://www.carlogos.org/car-logos/mitsubishi-logo.png',
  nissan: 'https://www.carlogos.org/car-logos/nissan-logo.png',
  peugeot: 'https://www.carlogos.org/car-logos/peugeot-logo.png',
  porsche: 'https://www.carlogos.org/car-logos/porsche-logo.png',
  ram: 'https://www.carlogos.org/car-logos/ram-logo.png',
  renault: 'https://www.carlogos.org/car-logos/renault-logo.png',
  suzuki: 'https://www.carlogos.org/car-logos/suzuki-logo.png',
  toyota: 'https://www.carlogos.org/car-logos/toyota-logo.png',
  volkswagen: 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  volvo: 'https://www.carlogos.org/car-logos/volvo-logo.png',
}

interface Props {
  vehicles: StorefrontVehicle[]
  activeBrand: string
  onBrandClick: (brand: string) => void
}

export function BrandStrip({ vehicles, activeBrand, onBrandClick }: Props) {
  const brands = useMemo(() => {
    const unique = [...new Set(vehicles.map(v => v.brand?.trim()).filter(Boolean))]
    return unique
      .map(name => ({ name: name!, logo: brandLogos[name!.toLowerCase()] }))
      .filter(b => b.logo)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [vehicles])

  if (brands.length < 2) return null

  const isActive = (name: string) => activeBrand === name

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-4">
      <div className="px-3 sm:px-4 py-3 sm:py-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth">
        <div className="flex items-center sm:justify-center gap-4 sm:gap-8 w-max sm:w-auto sm:flex-wrap">
          {brands.map(b => (
            <button
              key={b.name}
              onClick={() => onBrandClick(isActive(b.name) ? '' : b.name)}
              title={isActive(b.name) ? `Remover filtro: ${b.name}` : `Filtrar por ${b.name}`}
              className={`relative flex-shrink-0 rounded-lg px-2 py-1.5 transition-all duration-300 cursor-pointer ${
                isActive(b.name)
                  ? 'opacity-100 grayscale-0 bg-gray-100 ring-2 ring-gray-300'
                  : activeBrand && !isActive(b.name)
                    ? 'opacity-25 grayscale hover:opacity-60 hover:grayscale-0'
                    : 'opacity-40 grayscale hover:opacity-80 hover:grayscale-0'
              }`}
            >
              <img
                src={b.logo}
                alt={b.name}
                className="h-7 sm:h-9 w-auto object-contain"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
