/**
 * Script de limpeza de veículos criados pelos testes e2e.
 *
 * Padrões de teste (model LIKE):
 *   - "Corolla E2E"
 *   - "%PHOTO-TEST%"
 *   - "%INVALID-TEST%"
 *   - "%LIFECYCLE-TEST%"   (versão antiga sem timestamp)
 *   - "%LIFECYCLE-%"       (versão com timestamp)
 *   - "%LIMIT-TEST%"
 *
 * Uso:
 *   npx dotenv -e .env.local -- npx tsx scripts/cleanup-test-vehicles.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/cleanup-test-vehicles.ts --yes
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios')
  process.exit(1)
}

const admin = createClient(url, serviceKey)

const TEST_PATTERNS = [
  'Corolla E2E',
  '%PHOTO-TEST%',
  '%INVALID-TEST%',
  '%LIFECYCLE-%',
  '%LIMIT-TEST%',
]

async function main() {
  const confirm = process.argv.includes('--yes')

  // Busca todos os veículos que batem com algum padrão
  const orFilter = TEST_PATTERNS.map(p => `model.ilike.${p}`).join(',')

  const { data: vehicles, error } = await admin
    .from('vehicles')
    .select('id, brand, model, created_at')
    .or(orFilter)

  if (error) {
    console.error('Erro ao listar:', error.message)
    process.exit(1)
  }

  if (!vehicles || vehicles.length === 0) {
    console.log('Nenhum veículo de teste encontrado.')
    return
  }

  console.log(`Encontrados ${vehicles.length} veículo(s) de teste:\n`)
  for (const v of vehicles) {
    console.log(`  • ${v.brand} ${v.model}  [${v.id}]  (${v.created_at})`)
  }

  if (!confirm) {
    console.log('\nModo dry-run. Rode com --yes para deletar.')
    return
  }

  console.log('\nDeletando (remove fotos do Storage + linha do banco)...')
  let ok = 0
  let failed = 0

  for (const v of vehicles) {
    // Busca storage paths
    const { data: images } = await admin
      .from('vehicle_images')
      .select('storage_path')
      .eq('vehicle_id', v.id)

    const paths = (images ?? []).map(i => i.storage_path).filter(Boolean)
    if (paths.length > 0) {
      await admin.storage.from('vehicle-images').remove(paths)
    }

    const { error: delErr } = await admin.from('vehicles').delete().eq('id', v.id)
    if (delErr) {
      console.log(`  ✗ ${v.brand} ${v.model}: ${delErr.message}`)
      failed++
    } else {
      console.log(`  ✓ ${v.brand} ${v.model} (${paths.length} foto(s) removidas)`)
      ok++
    }
  }

  console.log(`\nResultado: ${ok} deletado(s), ${failed} falha(s).`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
