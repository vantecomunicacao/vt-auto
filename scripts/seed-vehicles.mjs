import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://tcbsmfnluiamtmwkfdfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjYnNtZm5sdWlhbXRtd2tmZGZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkwNjE0NiwiZXhwIjoyMDkwNDgyMTQ2fQ.tgDU-pLPZEcn0C6ZiclM004PBY2p9NIkQKwuijMhNxA'
)

const storeId = '54bb924a-2cea-4175-a1e3-58ef4f472fc9'

const vehicles = [
  {
    store_id: storeId,
    brand: 'Toyota', model: 'Corolla', version: 'XEi 2.0', slug: 'toyota-corolla-xei-2023',
    year_model: 2023, year_manuf: 2022, color: 'Prata', fuel: 'flex', transmission: 'automatic',
    mileage: 18500, price: 142900, price_old: 149900, price_negotiable: true,
    body_type: 'sedan', doors: 4, seats: 5, engine: '2.0 Flex', power: '177 cv',
    status: 'available', featured: true,
    description: 'Veículo em excelente estado de conservação, único dono, revisões em dia na concessionária.',
    features: ['Ar-condicionado', 'Direção elétrica', 'Central multimídia', 'Câmera de ré', 'Apple CarPlay', 'Android Auto'],
    cover_image_url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80',
  },
  {
    store_id: storeId,
    brand: 'Honda', model: 'HR-V', version: 'EXL CVT', slug: 'honda-hrv-exl-2022',
    year_model: 2022, year_manuf: 2022, color: 'Branco', fuel: 'flex', transmission: 'cvt',
    mileage: 32000, price: 128500, price_negotiable: false,
    body_type: 'suv', doors: 4, seats: 5, engine: '1.5 Turbo Flex', power: '173 cv',
    status: 'available', featured: true,
    description: 'SUV compacto completo, perfeito para família. Motor turbo econômico e potente.',
    features: ['Ar-condicionado', 'Teto solar', 'Bancos em couro', 'Câmera de ré', 'Apple CarPlay'],
    cover_image_url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80',
  },
  {
    store_id: storeId,
    brand: 'Volkswagen', model: 'T-Cross', version: 'Highline TSI', slug: 'vw-tcross-highline-2023',
    year_model: 2023, year_manuf: 2023, color: 'Azul', fuel: 'flex', transmission: 'automatic',
    mileage: 9800, price: 134990, price_negotiable: true,
    body_type: 'suv', doors: 4, seats: 5, engine: '1.4 TSI', power: '150 cv',
    status: 'available', featured: false,
    description: 'Quase zero, com todos os itens da versão top de linha. Garantia de fábrica.',
    features: ['Teto solar', 'Faróis de LED', 'Partida por botão', 'Central multimídia'],
    cover_image_url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
  },
  {
    store_id: storeId,
    brand: 'Chevrolet', model: 'Onix', version: 'Premier Turbo AT', slug: 'chevrolet-onix-premier-2022',
    year_model: 2022, year_manuf: 2021, color: 'Vermelho', fuel: 'flex', transmission: 'automatic',
    mileage: 41000, price: 89900, price_old: 95000, price_negotiable: true,
    body_type: 'hatch', doors: 4, seats: 5, engine: '1.0 Turbo Flex', power: '116 cv',
    status: 'available', featured: false,
    description: 'Versão mais equipada do Onix, com motor turbo e câmbio automático.',
    features: ['Ar-condicionado', 'Central multimídia', 'Câmera de ré', 'ABS', 'Airbag duplo'],
    cover_image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
  },
  {
    store_id: storeId,
    brand: 'Jeep', model: 'Compass', version: 'Limited 4x4 Diesel', slug: 'jeep-compass-limited-diesel-2021',
    year_model: 2021, year_manuf: 2021, color: 'Preto', fuel: 'diesel', transmission: 'automatic',
    mileage: 56000, price: 159900, price_negotiable: false,
    body_type: 'suv', doors: 4, seats: 5, engine: '2.0 Diesel 4x4', power: '170 cv',
    status: 'available', featured: true,
    description: 'Compass diesel 4x4, ideal para quem precisa de desempenho em qualquer terreno.',
    features: ['Ar digital dual zone', 'Teto panorâmico', 'Bancos aquecidos', 'Faróis de LED'],
    cover_image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
  },
  {
    store_id: storeId,
    brand: 'Fiat', model: 'Pulse', version: 'Audace Turbo', slug: 'fiat-pulse-audace-2023',
    year_model: 2023, year_manuf: 2022, color: 'Cinza', fuel: 'flex', transmission: 'automatic',
    mileage: 21000, price: 104900, price_negotiable: true,
    body_type: 'suv', doors: 4, seats: 5, engine: '1.0 Turbo Flex', power: '130 cv',
    status: 'available', featured: false,
    description: 'SUV moderno com design arrojado e tecnologia de ponta. Excelente estado.',
    features: ['Central multimídia', 'Câmera de ré', 'Apple CarPlay', 'Android Auto', 'Rodas de liga leve'],
    cover_image_url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
  },
  {
    store_id: storeId,
    brand: 'Hyundai', model: 'HB20', version: 'Diamond Plus Turbo', slug: 'hyundai-hb20-diamond-2022',
    year_model: 2022, year_manuf: 2022, color: 'Branco', fuel: 'flex', transmission: 'automatic',
    mileage: 28000, price: 78900, price_old: 82000, price_negotiable: true,
    body_type: 'hatch', doors: 4, seats: 5, engine: '1.0 Turbo Flex', power: '120 cv',
    status: 'available', featured: false,
    description: 'Hatch turbinado na versão mais completa. Econômico e com ótimos itens de série.',
    features: ['Ar-condicionado', 'Central multimídia', 'Câmera de ré', 'Bluetooth', 'Vidros elétricos'],
    cover_image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
  },
  {
    store_id: storeId,
    brand: 'Nissan', model: 'Kicks', version: 'Advance CVT', slug: 'nissan-kicks-advance-2021',
    year_model: 2021, year_manuf: 2020, color: 'Laranja', fuel: 'flex', transmission: 'cvt',
    mileage: 48000, price: 94500, price_negotiable: false,
    body_type: 'suv', doors: 4, seats: 5, engine: '1.6 Flex', power: '114 cv',
    status: 'available', featured: false,
    description: 'SUV espaçoso com design diferenciado. Tanque cheio e revisão realizada.',
    features: ['Câmera de ré', 'Sensor de estacionamento', 'Central multimídia', 'Rodas de liga leve', 'Faróis de LED'],
    cover_image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
  },
]

const { data, error } = await sb.from('vehicles').insert(vehicles).select('id, brand, model')

if (error) {
  console.error('ERRO:', error.message, error.details)
} else {
  console.log('Inseridos com sucesso:')
  data.forEach(v => console.log(' -', v.brand, v.model, '|', v.id))
}
