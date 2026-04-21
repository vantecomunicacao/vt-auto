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

export function CardVTLX({ vehicle, sf, storeSlug, primaryColor, secondaryColor, whatsappPhone, index }: Props) {
  const vehicleHref = `/veiculo/${vehicle.slug}`
  const waHref = whatsappPhone ? buildWhatsAppHref(whatsappPhone, vehicle) : null

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

          {/* Badges */}
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

          {/* Favorite */}
          <div className="absolute top-2 right-2">
            <FavoriteButton vehicleId={vehicle.id} solid />
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
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

          {/* WhatsApp link */}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="mt-2 flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
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
