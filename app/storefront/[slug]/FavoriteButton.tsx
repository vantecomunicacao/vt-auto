'use client'

import { useFavorites } from './FavoritesContext'

interface FavoriteButtonProps {
  vehicleId: string
  className?: string
  solid?: boolean
}

export function FavoriteButton({ vehicleId, className = '', solid = false }: FavoriteButtonProps) {
  const { isFav, toggle } = useFavorites()
  const active = isFav(vehicleId)

  const bg = solid
    ? active ? 'bg-white text-red-500 hover:text-red-600' : 'bg-white text-gray-400 hover:text-red-400'
    : active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-white/80 text-gray-400 hover:text-red-400 hover:bg-white'

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(vehicleId) }}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${bg} ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    </button>
  )
}
