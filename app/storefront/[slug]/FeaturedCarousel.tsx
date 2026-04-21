'use client'

import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { StorefrontVehicle } from './storefront-helpers'
import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import { formatPrice, buildWhatsAppHref } from './storefront-helpers'
import { WhatsAppIcon } from './storefront-icons'
import { CarPlaceholder } from './CarPlaceholder'
import { FavoriteButton } from './FavoriteButton'
import Link from 'next/link'

interface Props {
  vehicles: StorefrontVehicle[]
  sf: StorefrontSettings
  primaryColor: string
  secondaryColor: string
  whatsappPhone: string
}

export function FeaturedCarousel({ vehicles, sf, primaryColor, secondaryColor, whatsappPhone }: Props) {
  const featured = vehicles.filter(v => v.featured)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect() }
  }, [checkScroll])

  if (featured.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector(':scope > div')?.clientWidth ?? 300
    el.scrollBy({ left: dir === 'left' ? -cardWidth - 16 : cardWidth + 16, behavior: 'smooth' })
  }

  return (
    <div className="mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <h2 className="text-sm sm:text-base font-bold text-gray-900">Destaques</h2>
          <span className="text-xs text-gray-400 font-medium">{featured.length} {featured.length === 1 ? 'veículo' : 'veículos'}</span>
        </div>
        {featured.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors"
              aria-label="Anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors"
              aria-label="Próximo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable cards — uses its own compact card to guarantee uniform height */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth snap-x snap-mandatory"
      >
        {featured.map(vehicle => {
          const vehicleHref = `/veiculo/${vehicle.slug}`
          const waHref = whatsappPhone ? buildWhatsAppHref(whatsappPhone, vehicle) : null

          return (
            <div
              key={vehicle.id}
              className="flex-shrink-0 w-[46%] sm:w-[32%] lg:w-[calc(25%-12px)] snap-start"
            >
              <div className="group bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                {/* Image */}
                <Link href={vehicleHref} className="relative aspect-[4/3] bg-gray-100 overflow-hidden block flex-shrink-0">
                  {vehicle.cover_image_url ? (
                    <img src={vehicle.cover_image_url} alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50">
                      <CarPlaceholder className="w-full h-full opacity-50" />
                    </div>
                  )}
                  {/* Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
                  {/* Price */}
                  <div className="absolute bottom-2 left-2">
                    <span className="text-sm sm:text-base font-bold text-white drop-shadow-md">
                      {vehicle.price ? formatPrice(vehicle.price) : 'Consulte'}
                    </span>
                  </div>
                  {/* Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: `${secondaryColor}CC` }}>
                      Destaque
                    </span>
                  </div>
                  {/* Favorite */}
                  <div className="absolute top-2 right-2">
                    <FavoriteButton vehicleId={vehicle.id} solid />
                  </div>
                </Link>

                {/* Content — fixed structure, no variable specs */}
                <div className="p-2 sm:p-3 flex flex-col flex-1">
                  <Link href={vehicleHref} className="block mb-auto">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-1">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    {vehicle.version && (
                      <p className="text-xs text-gray-400 line-clamp-1 hidden sm:block">{vehicle.version}</p>
                    )}
                  </Link>
                  <div className="flex gap-1.5 mt-2">
                    <Link href={vehicleHref}
                      className="flex-1 text-center text-xs font-semibold py-1.5 rounded-md transition-opacity hover:opacity-90"
                      style={{ backgroundColor: primaryColor, color: '#fff' }}>
                      {sf.btn_details_label || 'Ver detalhes'}
                    </Link>
                    {waHref && (
                      <a href={waHref} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center px-2 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
                        title="WhatsApp">
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
