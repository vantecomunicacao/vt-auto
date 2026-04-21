'use client'

import Link from 'next/link'
import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import type { StorefrontVehicle } from '../storefront-helpers'
import { fuelLabel, formatPrice, formatMileage, buildWhatsAppHref } from '../storefront-helpers'
import { WhatsAppIcon } from '../storefront-icons'
import { CarPlaceholder } from '../CarPlaceholder'
import { AnimatedCard } from '../AnimatedCard'
import { FavoriteButton } from '../FavoriteButton'

interface Props {
  vehicle: StorefrontVehicle
  sf: StorefrontSettings
  storeSlug: string
  primaryColor: string
  secondaryColor: string
  whatsappPhone: string
  index: number
}

export function CardVTClass({ vehicle, sf, storeSlug, primaryColor, secondaryColor, whatsappPhone, index }: Props) {
  const vehicleHref = `/veiculo/${vehicle.slug}`
  const waHref = whatsappPhone ? buildWhatsAppHref(whatsappPhone, vehicle) : null

  // Specs row
  const specParts: string[] = []
  if (sf.show_year && vehicle.year_model) specParts.push(`Ano: ${vehicle.year_model}`)
  if (sf.show_mileage && vehicle.mileage != null) specParts.push(`Km: ${formatMileage(vehicle.mileage, false)}`)
  if (sf.show_fuel && vehicle.fuel) specParts.push(`Comb: ${(fuelLabel[vehicle.fuel] ?? vehicle.fuel).toUpperCase()}`)

  return (
    <AnimatedCard key={vehicle.id} delay={index * 40}>
      <Link href={vehicleHref} className="group block bg-white overflow-hidden hover:opacity-95 transition-opacity h-full">

        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
          {vehicle.cover_image_url ? (
            <img
              src={vehicle.cover_image_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4 bg-gray-100">
              <CarPlaceholder className="w-full h-full opacity-40" />
            </div>
          )}

          {/* Brand tag */}
          <div
            className="absolute bottom-0 left-0 px-2.5 py-1 text-white text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: primaryColor }}
          >
            {vehicle.brand}
          </div>

          {/* Negociável */}
          {vehicle.price_negotiable && (
            <div className="absolute top-0 right-0 text-white text-xs font-bold uppercase px-2 py-0.5 tracking-wide" style={{ backgroundColor: secondaryColor }}>
              Negociável
            </div>
          )}

          {/* Favorite */}
          <div className="absolute top-2 right-2">
            <FavoriteButton vehicleId={vehicle.id} solid />
          </div>
        </div>

        {/* Content — centralizado */}
        <div className="p-3 text-center">
          <h2 className="text-xs sm:text-sm font-bold text-gray-900 uppercase leading-snug line-clamp-2 mb-2">
            {vehicle.model}
            {vehicle.version && <span className="font-normal"> {vehicle.version}</span>}
          </h2>

          {/* Preço */}
          <p className="text-base sm:text-lg font-bold mb-1" style={{ color: primaryColor }}>
            {vehicle.price ? formatPrice(vehicle.price) : 'Consulte'}
          </p>
          {vehicle.price_old && (
            <p className="text-xs text-gray-400 line-through mb-1">{formatPrice(vehicle.price_old)}</p>
          )}

          {/* Specs inline */}
          {specParts.length > 0 && (
            <p className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1">
              {specParts.join(' · ')}
            </p>
          )}

          {/* WhatsApp link */}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              Falar no WhatsApp
            </a>
          )}
        </div>
      </Link>
    </AnimatedCard>
  )
}
