'use client'

import { formatPhone } from '@/lib/formatPhone'
import { FavoritesProvider } from '../../FavoritesContext'
import { FavoriteButton } from '../../FavoriteButton'

interface VehicleSidebarProps {
  price: number | null
  priceOld: number | null
  priceNegotiable: boolean | null
  waLink: string | null
  storeName: string
  storeSlug: string
  storeCity: string | null
  storeState: string | null
  storePhone: string | null
  storeLandline: string | null
  primaryColor: string
  secondaryColor: string
  vehicleName: string
  storeId: string
  vehicleId: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

function WaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L.057 23.852a.5.5 0 0 0 .625.607l6.219-1.63A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 0 1-5.194-1.449l-.39-.23-3.688.968.987-3.594-.243-.38A10 10 0 1 1 12 22z" />
    </svg>
  )
}

export function VehicleSidebarVTLX({
  price, priceOld, priceNegotiable, waLink, storeName, storeSlug, storeCity, storeState, storePhone, storeLandline,
  primaryColor, vehicleId,
}: VehicleSidebarProps) {
  return (
    <FavoritesProvider storeSlug={storeSlug}>
      <div className="lg:sticky lg:top-6 bg-white border border-gray-100 rounded-lg shadow-none p-6 space-y-4">
        {/* Price + favorite */}
        <div className="flex items-start justify-between gap-2">
          <div>
            {priceOld && (
              <p className="text-sm text-gray-400 line-through mb-0.5">{formatPrice(priceOld)}</p>
            )}
            <p className="text-3xl font-bold" style={{ color: primaryColor }}>
              {price ? formatPrice(price) : 'Consulte o preço'}
            </p>
            {priceNegotiable && (
              <span className="inline-block mt-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Preço negociável
              </span>
            )}
          </div>
          <FavoriteButton vehicleId={vehicleId} className="flex-shrink-0 mt-1 w-10 h-10 border border-gray-100 shadow-none" />
        </div>

        {/* WhatsApp CTA */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-lg transition-colors text-base"
          >
            <WaIcon />
            Falar no WhatsApp
          </a>
        )}

        {/* Store contact info */}
        <div className="border-t border-gray-50 pt-4 text-sm text-gray-400 space-y-1">
          <p className="font-semibold text-gray-800">{storeName}</p>
          {(storeCity || storeState) && (
            <p>{[storeCity, storeState].filter(Boolean).join(' — ')}</p>
          )}
          {storePhone && <p>WhatsApp {formatPhone(storePhone)}</p>}
          {storeLandline && <p>Telefone {formatPhone(storeLandline)}</p>}
        </div>
      </div>

    </FavoritesProvider>
  )
}
