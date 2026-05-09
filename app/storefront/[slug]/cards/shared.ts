import type { StorefrontSettings } from '@/app/admin/(protected)/storefront/StorefrontSettingsContent'
import { buildWhatsAppHref, type StorefrontVehicle } from '../storefront-helpers'

export interface CardProps {
  vehicle: StorefrontVehicle
  sf: StorefrontSettings
  storeSlug: string
  primaryColor: string
  secondaryColor: string
  whatsappPhone: string
  index: number
}

export function getVehicleLinks(vehicle: StorefrontVehicle, whatsappPhone: string) {
  return {
    vehicleHref: `/veiculo/${vehicle.slug}`,
    waHref: whatsappPhone ? buildWhatsAppHref(whatsappPhone, vehicle) : null,
  }
}
