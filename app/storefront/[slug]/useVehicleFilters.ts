'use client'

import { useState, useMemo } from 'react'
import type { StorefrontVehicle } from './storefront-helpers'

export function useVehicleFilters(vehicles: StorefrontVehicle[]) {
  const [query, setQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [fuelFilter, setFuelFilter] = useState('')
  const [transmissionFilter, setTransmissionFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc' | 'newest'>('default')
  const [mobileGrid, setMobileGrid] = useState<1 | 2>(1)

  const brands = useMemo(() => [...new Set(vehicles.map(v => v.brand))].sort(), [vehicles])
  const fuels = useMemo(() => [...new Set(vehicles.map(v => v.fuel).filter(Boolean))].sort() as string[], [vehicles])
  const transmissions = useMemo(() => [...new Set(vehicles.map(v => v.transmission).filter(Boolean))].sort() as string[], [vehicles])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const min = minPrice ? Number(minPrice) : null
    const max = maxPrice ? Number(maxPrice) : null

    const result = vehicles.filter(v => {
      if (q) {
        const searchable = [v.brand, v.model, v.version, v.color, v.year_model].filter(Boolean).join(' ').toLowerCase()
        if (!searchable.includes(q)) return false
      }
      if (brandFilter && v.brand !== brandFilter) return false
      if (fuelFilter && v.fuel !== fuelFilter) return false
      if (transmissionFilter && v.transmission !== transmissionFilter) return false
      if (min && (v.price ?? 0) < min) return false
      if (max && (v.price ?? 0) > max) return false
      return true
    })

    if (sortOrder === 'price_asc') result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sortOrder === 'price_desc') result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    if (sortOrder === 'newest') result.sort((a, b) => (b.year_model ?? 0) - (a.year_model ?? 0))

    return result
  }, [vehicles, query, brandFilter, fuelFilter, transmissionFilter, minPrice, maxPrice, sortOrder])

  const activeFilterCount = [brandFilter, fuelFilter, transmissionFilter, minPrice, maxPrice].filter(Boolean).length
  const hasActiveFilters = !!(query || brandFilter || fuelFilter || transmissionFilter || minPrice || maxPrice)

  function clearAll() {
    setQuery('')
    setBrandFilter('')
    setFuelFilter('')
    setTransmissionFilter('')
    setMinPrice('')
    setMaxPrice('')
  }

  return {
    query, setQuery,
    brandFilter, setBrandFilter,
    fuelFilter, setFuelFilter,
    transmissionFilter, setTransmissionFilter,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    filtersOpen, setFiltersOpen,
    sortOrder, setSortOrder,
    mobileGrid, setMobileGrid,
    brands, fuels, transmissions,
    filtered,
    activeFilterCount,
    hasActiveFilters,
    clearAll,
  }
}

export type VehicleFilters = ReturnType<typeof useVehicleFilters>
