import { z } from 'zod'

export const vehicleSchema = z.object({
  // Geral
  brand:       z.string().min(1, 'Marca obrigatória'),
  model:       z.string().min(1, 'Modelo obrigatório'),
  version:     z.string().optional(),
  year_model:  z.coerce.number().int().min(1950).max(new Date().getFullYear() + 2),
  year_manuf:  z.coerce.number().int().min(1950).max(new Date().getFullYear() + 2),
  color:       z.string().min(1, 'Cor obrigatória'),
  body_type:   z.enum(['sedan','hatch','suv','pickup','van','convertible','coupe','station_wagon','minivan','motorcycle','truck','other']).optional(),
  doors:       z.coerce.number().optional(),
  seats:       z.coerce.number().optional(),
  description: z.string().optional(),
  status:      z.enum(['available','sold','reserved','inactive']).default('available'),
  featured:    z.boolean().default(false),

  // Técnico
  fuel:         z.enum(['flex','gasoline','diesel','electric','hybrid','gas']),
  transmission: z.enum(['manual','automatic','automated','cvt']),
  mileage:      z.coerce.number().int().min(0).default(0),
  engine:       z.string().optional(),
  power:        z.string().optional(),
  torque:       z.string().optional(),
  internal_notes: z.string().optional(),

  // Preço
  price:            z.coerce.number().positive('Preço obrigatório'),
  price_old:        z.coerce.number().optional(),
  price_negotiable: z.boolean().default(true),
  fipe_code:        z.string().optional(),

  // Opcionais
  features: z.array(z.string()).default([]),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>

export const CAR_FEATURES = [
  'Ar-condicionado', 'Direção hidráulica', 'Direção elétrica',
  'Vidros elétricos', 'Travas elétricas', 'Airbag duplo',
  'Airbag lateral', 'ABS', 'Controle de tração', 'Estabilidade eletrônica',
  'Central multimídia', 'Câmera de ré', 'Sensor de estacionamento',
  'Teto solar', 'Bancos em couro', 'Banco elétrico do motorista',
  'Rodas de liga leve', 'Bluetooth', 'GPS integrado',
  'Carregador wireless', 'Apple CarPlay', 'Android Auto',
  'Chave presencial', 'Partida por botão', 'Piloto automático',
  'Controle de cruzeiro adaptativo', 'Frenagem autônoma', 'Alerta de faixa',
  'Faróis de LED', 'Faróis adaptativos', 'Ar digital dual zone',
  'Bancos aquecidos', 'Espelhos elétricos', 'Teto panorâmico',
]

export const FUEL_LABELS: Record<string, string> = {
  flex: 'Flex', gasoline: 'Gasolina', diesel: 'Diesel',
  electric: 'Elétrico', hybrid: 'Híbrido', gas: 'GNV',
}

export const TRANSMISSION_LABELS: Record<string, string> = {
  manual: 'Manual', automatic: 'Automático',
  automated: 'Automatizado', cvt: 'CVT',
}

export const BODY_TYPE_LABELS: Record<string, string> = {
  sedan: 'Sedan', hatch: 'Hatch', suv: 'SUV', pickup: 'Picape',
  van: 'Van', convertible: 'Conversível', coupe: 'Coupê',
  station_wagon: 'Station Wagon', minivan: 'Minivan',
  motorcycle: 'Moto', truck: 'Caminhão', other: 'Outro',
}

export const STATUS_LABELS: Record<string, string> = {
  available: 'Disponível', sold: 'Vendido',
  reserved: 'Reservado', inactive: 'Inativo',
}
