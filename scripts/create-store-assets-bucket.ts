import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY
if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey)

async function main() {
  // Verifica se já existe
  const { data: buckets, error } = await admin.storage.listBuckets()
  if (error) {
    console.error('Erro ao listar buckets:', error.message)
    process.exit(1)
  }

  if (buckets?.find(b => b.id === 'store-assets')) {
    console.log('Bucket store-assets já existe. Nenhuma ação.')
    return
  }

  const { error: createErr } = await admin.storage.createBucket('store-assets', {
    public: true,
  })
  if (createErr) {
    console.error('Erro ao criar bucket:', createErr.message)
    process.exit(1)
  }
  console.log('Bucket store-assets criado com sucesso (public=true).')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
