'use client'

import Link from 'next/link'
import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import type { StorefrontVehicle } from '../storefront-helpers'
import { fuelLabel, transmissionLabel, formatPrice, formatMileage, buildWhatsAppHref } from '../storefront-helpers'
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

export function CardPremium({ vehicle, sf, storeSlug, primaryColor, secondaryColor, whatsappPhone, index }: Props) {
  const vehicleHref = `/veiculo/${vehicle.slug}`
  const waHref = whatsappPhone ? buildWhatsAppHref(whatsappPhone, vehicle) : null

  return (
    <AnimatedCard key={vehicle.id} delay={index * 60}>
      <div className="group bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full">

        {/* Image with gradient overlay */}
        <Link href={vehicleHref} className="relative aspect-[4/3] bg-gray-100 overflow-hidden block">
          {vehicle.cover_image_url ? (
            <img
              src={vehicle.cover_image_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 bg-gray-50">
              <CarPlaceholder className="w-full h-full opacity-50" />
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Price on image */}
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
            {vehicle.price_old && (
              <span className="text-xs text-white/70 line-through mr-1 hidden sm:inline">{formatPrice(vehicle.price_old)}</span>
            )}
            <span className="text-sm sm:text-lg font-bold text-white drop-shadow-md">
              {vehicle.price ? formatPrice(vehicle.price) : 'Consulte'}
            </span>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1">
            {vehicle.featured && (
              <span
                className="text-xs font-semibold tracking-wide px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-white backdrop-blur-sm"
                style={{ backgroundColor: `${secondaryColor}CC` }}
              >
                Destaque
              </span>
            )}
            {vehicle.price_negotiable && (
              <span className="text-xs font-semibold tracking-wide px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-white backdrop-blur-sm bg-white/20">
                Negociável
              </span>
            )}
          </div>

          {/* Favorite */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <FavoriteButton vehicleId={vehicle.id} solid />
          </div>
        </Link>

        {/* Content */}
        <div className="flex flex-col flex-1 p-2.5 sm:p-4">
          {/* Brand + Model */}
          <Link href={vehicleHref} className="block mb-1 sm:mb-2">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-0.5 truncate">
              {vehicle.brand}
            </p>
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
              {vehicle.model}
              {vehicle.version && <span className="font-normal text-gray-500 hidden sm:inline"> {vehicle.version}</span>}
            </h2>
          </Link>

          {/* Specs — hidden on mobile, shown on sm+ */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 mb-3 flex-wrap">
            {sf.show_year && vehicle.year_model && (
              <>
                <span>{vehicle.year_model}</span>
                <span className="w-px h-3 bg-gray-300" />
              </>
            )}
            {sf.show_mileage && vehicle.mileage != null && (
              <>
                <span>{formatMileage(vehicle.mileage)}</span>
                <span className="w-px h-3 bg-gray-300" />
              </>
            )}
            {sf.show_fuel && vehicle.fuel && (
              <>
                <span>{fuelLabel[vehicle.fuel] ?? vehicle.fuel}</span>
                {sf.show_transmission && vehicle.transmission && <span className="w-px h-3 bg-gray-300" />}
              </>
            )}
            {sf.show_transmission && vehicle.transmission && (
              <span>{transmissionLabel[vehicle.transmission] ?? vehicle.transmission}</span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-auto flex gap-1.5 sm:gap-2">
            <Link
              href={vehicleHref}
              className="flex-1 text-center text-xs sm:text-sm font-semibold py-1.5 sm:py-2.5 rounded-md transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              {sf.btn_details_label || 'Ver detalhes'}
            </Link>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-md font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
                title="WhatsApp"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  )
}
