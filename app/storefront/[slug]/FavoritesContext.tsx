'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface FavoritesContextValue {
  favorites: string[]
  toggle: (id: string) => void
  isFav: (id: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  toggle: () => {},
  isFav: () => false,
})

const STORAGE_KEY = 'ag_storefront_favorites'

export function FavoritesProvider({ children, storeSlug }: { children: React.ReactNode; storeSlug: string }) {
  const key = `${STORAGE_KEY}_${storeSlug}`
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) setFavorites(JSON.parse(stored))
    } catch {}
  }, [key])

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }, [key])

  const isFav = useCallback((id: string) => favorites.includes(id), [favorites])

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFav }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
