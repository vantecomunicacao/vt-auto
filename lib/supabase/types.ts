export type StoreLayout = 'classic' | 'modern' | 'marketplace'
export type Storeplan = 'trial' | 'basic' | 'pro' | 'enterprise'
export type AgentTone = 'professional' | 'friendly' | 'casual'
export type UserRole = 'owner' | 'seller'
export type VehicleStatus = 'available' | 'sold' | 'reserved' | 'inactive'
export type VehicleFuel = 'flex' | 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'gas'
export type VehicleTransmission = 'manual' | 'automatic' | 'automated' | 'cvt'
export type VehicleBodyType = 'sedan' | 'hatch' | 'suv' | 'pickup' | 'van' | 'convertible' | 'coupe' | 'station_wagon' | 'minivan' | 'motorcycle' | 'truck' | 'other'
export type LeadStatus = 'new' | 'in_progress' | 'qualified' | 'converted' | 'lost'
export type LeadSource = 'whatsapp' | 'vitrine' | 'manual'
export type ConversationRole = 'user' | 'assistant'

export interface Store {
  id: string
  name: string
  slug: string
  phone: string | null
  email: string | null
  city: string | null
  state: string | null
  address: string | null
  description: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  layout: StoreLayout
  custom_domain: string | null
  plan: Storeplan
  plan_expires_at: string | null
  is_active: boolean
  agent_active: boolean
  agent_name: string
  agent_prompt: string | null
  agent_tone: AgentTone
  agent_greeting: string | null
  agent_hours: Record<string, { start: string; end: string }> | null
  whatsapp_instance: string | null
  onboarding_completo: boolean
  onboarding_step: number
  created_at: string
  updated_at: string
}

export interface StoreUser {
  id: string
  store_id: string
  user_id: string
  role: UserRole
  is_active: boolean
  invited_by: string | null
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  store_id: string
  slug: string
  status: VehicleStatus
  featured: boolean
  brand: string
  model: string
  version: string | null
  year_model: number
  year_manuf: number
  color: string
  mileage: number
  fuel: VehicleFuel
  transmission: VehicleTransmission
  body_type: VehicleBodyType | null
  doors: number | null
  seats: number | null
  engine: string | null
  power: string | null
  torque: string | null
  price: number
  price_old: number | null
  price_negotiable: boolean
  fipe_code: string | null
  fipe_source: string | null
  features: string[]
  description: string | null
  internal_notes: string | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export interface VehicleImage {
  id: string
  vehicle_id: string
  store_id: string
  storage_path: string
  url: string
  is_cover: boolean
  sort_order: number
  created_at: string
}

export interface Lead {
  id: string
  store_id: string
  assigned_to: string | null
  name: string | null
  phone: string
  email: string | null
  vehicle_id: string | null
  vehicle_interest: string | null
  source: LeadSource
  status: LeadStatus
  notes: string | null
  last_contact_at: string | null
  created_at: string
  updated_at: string
}

export interface AgentConversation {
  id: string
  store_id: string
  lead_id: string | null
  phone: string
  role: ConversationRole
  content: string
  tokens_in: number | null
  tokens_out: number | null
  created_at: string
}
