// ─── Shared helpers for storefront ──────────────────────────────────────────

export type StorefrontVehicle = {
  id: string
  slug: string
  brand: string
  model: string
  version: string | null
  year_model: number | null
  mileage: number | null
  price: number | null
  price_old: number | null
  price_negotiable: boolean | null
  fuel: string | null
  transmission: string | null
  color: string | null
  cover_image_url: string | null
  featured: boolean | null
}

export const fuelLabel: Record<string, string> = {
  flex: 'Flex',
  gasoline: 'Gasolina',
  diesel: 'Diesel',
  electric: 'Elétrico',
  hybrid: 'Híbrido',
  gas: 'GNV',
}

export const transmissionLabel: Record<string, string> = {
  manual: 'Manual',
  automatic: 'Automático',
  automated: 'Automatizado',
  cvt: 'CVT',
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

export function formatMileage(mileage: number, withUnit = true) {
  const formatted = new Intl.NumberFormat('pt-BR').format(mileage)
  return withUnit ? `${formatted} km` : formatted
}

export function buildWhatsAppHref(phone: string, vehicle: { brand: string; model: string; year_model?: number | null; slug: string }) {
  const msg = encodeURIComponent(
    `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model}${vehicle.year_model ? ` ${vehicle.year_model}` : ''} - Cód: ${vehicle.slug}`
  )
  return `https://wa.me/55${phone}?text=${msg}`
}
