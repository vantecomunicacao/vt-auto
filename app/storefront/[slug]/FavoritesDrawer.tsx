'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFavorites } from './FavoritesContext'
import type { StorefrontVehicle } from './StorefrontFilters'

interface FavoritesDrawerProps {
  vehicles: StorefrontVehicle[]
  storeSlug: string
  primaryColor: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

export function FavoritesDrawer({ vehicles, storeSlug, primaryColor }: FavoritesDrawerProps) {
  const { favorites, toggle } = useFavorites()
  const [open, setOpen] = useState(false)

  const favVehicles = vehicles.filter(v => favorites.includes(v.id))

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ver favoritos"
        className={`relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg border transition-colors text-xs font-medium ${favorites.length > 0 ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={favorites.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
        <span>Favoritos{favorites.length > 0 ? ` (${favorites.length})` : ''}</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 bg-white shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center gap-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <span className="font-bold text-sm">Favoritos ({favorites.length})</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {favVehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <p className="text-gray-500 text-sm">Nenhum favorito ainda.</p>
              <p className="text-gray-400 text-xs mt-1">Clique no coração nos cards para salvar.</p>
            </div>
          ) : (
            favVehicles.map(vehicle => (
              <div key={vehicle.id} className="flex gap-3 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <Link href={`/veiculo/${vehicle.slug}`} onClick={() => setOpen(false)}>
                  {vehicle.cover_image_url ? (
                    <img src={vehicle.cover_image_url} alt={`${vehicle.brand} ${vehicle.model}`} className="w-24 h-20 object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-20 bg-gray-200 flex-shrink-0" />
                  )}
                </Link>
                <div className="flex-1 min-w-0 py-2 pr-2">
                  <Link href={`/veiculo/${vehicle.slug}`} onClick={() => setOpen(false)}>
                    <p className="text-sm font-semibold text-gray-900 truncate hover:underline">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    {vehicle.year_model && (
                      <p className="text-xs text-gray-500">{vehicle.year_model}</p>
                    )}
                    <p className="text-sm font-bold mt-1" style={{ color: primaryColor }}>
                      {vehicle.price ? formatPrice(vehicle.price) : 'Consulte'}
                    </p>
                  </Link>
                </div>
                <button
                  onClick={() => toggle(vehicle.id)}
                  aria-label="Remover dos favoritos"
                  className="flex-shrink-0 self-start p-2 mt-1 mr-1 text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
