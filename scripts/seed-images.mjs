import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://tcbsmfnluiamtmwkfdfl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjYnNtZm5sdWlhbXRtd2tmZGZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkwNjE0NiwiZXhwIjoyMDkwNDgyMTQ2fQ.tgDU-pLPZEcn0C6ZiclM004PBY2p9NIkQKwuijMhNxA'
)

const storeId = '54bb924a-2cea-4175-a1e3-58ef4f472fc9'

// 1. Atualiza loja: logo + banner + about + storefront_settings
const { error: storeErr } = await sb.from('stores').update({
  logo_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&h=200&fit=crop&q=80',
  storefront_settings: {
    grid_cols: '3',
    card_style: 'shadow',
    sort_by: 'featured',
    filter_brand: true,
    filter_price: true,
    filter_fuel: true,
    filter_transmission: true,
    page_title: 'Os melhores seminovos da cidade',
    page_slogan: 'Qualidade, procedência e as melhores condições para você sair de carro novo hoje.',
    cta_label: 'Ver detalhes',
    banner_enabled: true,
    banner_title: 'Promoção de Abril',
    banner_subtitle: 'Condições especiais de financiamento · Entrada a partir de R$ 5.000',
    banner_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&q=80',
    about_enabled: true,
    about_text: 'A Loja 01 está há mais de 15 anos no mercado de veículos seminovos, oferecendo os melhores carros com procedência garantida, revisão completa e as melhores condições de pagamento da região.\n\nNosso compromisso é com a sua satisfação. Todos os veículos passam por rigorosa inspeção técnica antes de serem disponibilizados.',
    about_image_url: 'https://images.unsplash.com/photo-1567449303183-ae0d6ed1498e?w=800&q=80',
    show_mileage: true,
    show_year: true,
    show_fuel: true,
    show_transmission: true,
    btn_details_style: 'filled',
    btn_whatsapp_style: 'filled',
    btn_details_label: 'Ver detalhes',
  }
}).eq('id', storeId)

if (storeErr) console.error('Erro ao atualizar loja:', storeErr.message)
else console.log('✓ Loja atualizada (logo + banner + about + settings)')

// 2. Busca veículos pelo store_id (usa ID, não slug)
const { data: vehicles } = await sb
  .from('vehicles')
  .select('id, brand, model')
  .eq('store_id', storeId)
  .order('created_at', { ascending: true })

if (!vehicles?.length) {
  console.error('Nenhum veículo encontrado.')
  process.exit(1)
}

// 3. Fotos mapeadas por brand+model
const photosByVehicle = [
  {
    match: (v) => v.brand === 'Toyota' && v.model === 'Corolla',
    photos: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=900&q=80',
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=900&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=900&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
    ],
  },
  {
    match: (v) => v.brand === 'Honda' && v.model === 'HR-V',
    photos: [
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=900&q=80',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&q=80',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=900&q=80',
    ],
  },
  {
    match: (v) => v.brand === 'Volkswagen',
    photos: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=80',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=900&q=80',
      'https://images.unsplash.com/photo-1546768292-fb12f6c92568?w=900&q=80',
    ],
  },
  {
    match: (v) => v.brand === 'Chevrolet',
    photos: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&q=80',
      'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=900&q=80',
      'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=900&q=80',
    ],
  },
  {
    match: (v) => v.brand === 'Jeep',
    photos: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&q=80',
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900&q=80',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=900&q=80',
      'https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=900&q=80',
    ],
  },
  {
    match: (v) => v.brand === 'Fiat',
    photos: [
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=900&q=80',
      'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=900&q=80',
      'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=900&q=80',
    ],
  },
  {
    match: (v) => v.brand === 'Hyundai',
    photos: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=80',
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=80',
      'https://images.unsplash.com/photo-1574023278562-b47c76b21ef0?w=900&q=80',
    ],
  },
  {
    match: (v) => v.brand === 'Nissan',
    photos: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&q=80',
      'https://images.unsplash.com/photo-1540066019607-e5f69323a8dc?w=900&q=80',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=80',
    ],
  },
]

// 4. Insere fotos e atualiza cover_image_url
let totalImages = 0
for (const vehicle of vehicles) {
  const entry = photosByVehicle.find(e => e.match(vehicle))
  if (!entry) { console.log(`⚠ Sem fotos mapeadas para ${vehicle.brand} ${vehicle.model}`) ; continue }

  const rows = entry.photos.map((url, i) => ({
    vehicle_id: vehicle.id,
    store_id: storeId,
    url,
    storage_path: `vehicles/${vehicle.id}/${i}.jpg`,
    is_cover: i === 0,
    sort_order: i,
  }))

  const { error } = await sb.from('vehicle_images').insert(rows)
  if (error) {
    console.error(`Erro nas fotos de ${vehicle.brand} ${vehicle.model}:`, error.message)
    continue
  }

  // Atualiza cover_image_url no veículo
  await sb.from('vehicles').update({ cover_image_url: entry.photos[0] }).eq('id', vehicle.id)

  totalImages += rows.length
  console.log(`✓ ${vehicle.brand} ${vehicle.model}: ${rows.length} fotos`)
}

console.log(`\nConcluído! ${totalImages} fotos inseridas.`)
