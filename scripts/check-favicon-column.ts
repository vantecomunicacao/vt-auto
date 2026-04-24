import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY obrigatórios')
  process.exit(1)
}

const admin = createClient(url, serviceKey)

async function main() {
  const { error } = await admin.from('stores').select('favicon_url').limit(1)
  if (error) {
    if (error.message.includes('favicon_url')) {
      console.log('Coluna favicon_url NÃO existe. Aplicar migration 029.')
      process.exit(2)
    }
    console.error('Erro:', error.message)
    process.exit(1)
  }
  console.log('Coluna favicon_url existe.')
}

main()
