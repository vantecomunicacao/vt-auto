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

export function CardPadrao({ vehicle, sf, storeSlug, primaryColor, secondaryColor, whatsappPhone, index }: Props) {
  const vehicleHref = `/veiculo/${vehicle.slug}`
  const waHref = whatsappPhone ? buildWhatsAppHref(whatsappPhone, vehicle) : null

  const detailsBtnStyle = sf.btn_details_style === 'outline'
    ? { border: `2px solid ${primaryColor}`, color: primaryColor, background: 'transparent' }
    : { backgroundColor: primaryColor, color: '#fff' }

  const waBtnClass = sf.btn_whatsapp_style === 'filled'
    ? 'bg-green-500 hover:bg-green-600 text-white'
    : 'border-2 border-green-500 text-green-600 hover:bg-green-50'

  return (
    <AnimatedCard key={vehicle.id} delay={index * 50}>
      <div className="group transition-shadow overflow-hidden flex flex-col h-full bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md">
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
        <div className="flex flex-col flex-1 p-2.5 sm:p-4">
          <Link href={vehicleHref} className="block mb-1 sm:mb-2">
            <h2 className="text-xs sm:text-base font-semibold text-gray-900 leading-snug hover:underline">
              {vehicle.brand} {vehicle.model}
              {vehicle.version && <span className="font-normal text-gray-500 hidden sm:inline"> {vehicle.version}</span>}
            </h2>
          </Link>

          {/* Specs */}
          <div className="hidden sm:flex flex-wrap gap-1.5 mb-3">
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

          <div className="flex items-end gap-1.5 flex-wrap mt-auto mb-2 sm:mb-4">
            {vehicle.price_old && (
              <span className="text-xs text-gray-400 line-through hidden sm:inline">{formatPrice(vehicle.price_old)}</span>
            )}
            <span className="text-sm sm:text-lg font-bold" style={{ color: primaryColor }}>
              {vehicle.price ? formatPrice(vehicle.price) : 'Consulte'}
            </span>
          </div>

          <div className="flex gap-1.5 sm:gap-2">
            <Link href={vehicleHref}
              className="flex-1 text-center font-medium rounded-xl transition-opacity hover:opacity-90 text-xs py-1.5 sm:text-sm sm:py-2"
              style={detailsBtnStyle}>
              {sf.btn_details_label || 'Ver detalhes'}
            </Link>
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-center gap-1 rounded-xl font-medium transition-colors ${waBtnClass} px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2`}
                title="Falar no WhatsApp">
                <WhatsAppIcon />
                <span className="hidden sm:inline text-sm">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  )
}
