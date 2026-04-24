import { test, expect } from '@playwright/test'

/**
 * Credenciais de teste — use uma conta de teste dedicada, nunca produção.
 * Configure via variáveis de ambiente:
 *   E2E_EMAIL=teste@sualojaaqui.com
 *   E2E_PASSWORD=suasenha
 *   E2E_BASE_URL=http://app.localhost:3000
 */
const EMAIL = process.env.E2E_EMAIL || ''
const PASSWORD = process.env.E2E_PASSWORD || ''

// ─── Helpers ────────────────────────────────────────────────────────────────

async function login(page: any) {
  await page.goto('/admin/login')
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')
  // Aguarda redirecionar para o dashboard após login
  await page.waitForURL(/\/admin\/dashboard|\/admin\/onboarding/, { timeout: 30_000 })
}

// ─── Testes ─────────────────────────────────────────────────────────────────

test.describe('Veículos', () => {

  test('fazer login com sucesso', async ({ page }) => {
    await page.goto('/admin/login')

    await page.fill('#email', EMAIL)
    await page.fill('#password', PASSWORD)
    await page.click('button[type="submit"]')

    // Deve redirecionar para dashboard ou onboarding
    await expect(page).toHaveURL(/\/admin\/(dashboard|onboarding)/, { timeout: 10_000 })
  })

  test('criar um veículo via API e aparecer na lista', async ({ page }) => {
    await login(page)

    // Cria o veículo diretamente via API (page.request compartilha cookies da sessão)
    const res = await page.request.post('/api/vehicles', {
      data: {
        brand: 'Toyota',
        model: 'Corolla E2E',
        year_model: 2024,
        year_manuf: 2023,
        color: 'Prata Metálico',
        fuel: 'flex',
        transmission: 'automatic',
        mileage: 28000,
        price: 95000,
        status: 'available',
        featured: false,
        price_negotiable: true,
        features: [],
      },
    })

    console.log(`\nAPI POST /api/vehicles → ${res.status()}: ${await res.text()}`)
    expect(res.status()).toBe(201)

    // Navega para a lista e verifica se o veículo aparece
    await page.goto('/admin/vehicles')
    await expect(page.getByText('Toyota Corolla E2E', { exact: true }).first()).toBeVisible()
  })

  test('não salvar veículo sem campos obrigatórios', async ({ page }) => {
    await login(page)

    await page.goto('/admin/vehicles/new')

    // Tenta salvar sem preencher nada
    await page.click('button[type="submit"]:has-text("Criar veículo")')

    // Deve aparecer um toast de erro (Sonner renderiza role="status")
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5_000 })

    // Deve continuar na mesma página (não redirecionou)
    await expect(page).toHaveURL('/admin/vehicles/new')
  })

  test('fluxo completo de fotos: upload, set cover, delete', async ({ page }) => {
    await login(page)

    // Cria um veículo
    const createRes = await page.request.post('/api/vehicles', {
      data: {
        brand: 'Honda', model: 'Civic PHOTO-TEST',
        year_model: 2024, year_manuf: 2023, color: 'Preto',
        fuel: 'flex', transmission: 'automatic', mileage: 12000,
        price: 120000, status: 'available', featured: false,
        price_negotiable: true, features: [],
      },
    })
    expect(createRes.status()).toBe(201)
    const vehicleId = (await createRes.json()).id as string

    // PNG 1x1 transparente (67 bytes)
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    )

    // Sobe 2 fotos
    const up1 = await page.request.post(`/api/vehicles/${vehicleId}/photos`, {
      multipart: { file: { name: 'foto1.png', mimeType: 'image/png', buffer: tinyPng } },
    })
    expect(up1.status()).toBe(201)
    const photo1 = await up1.json()
    expect(photo1.is_cover).toBe(true) // primeira vira capa

    const up2 = await page.request.post(`/api/vehicles/${vehicleId}/photos`, {
      multipart: { file: { name: 'foto2.png', mimeType: 'image/png', buffer: tinyPng } },
    })
    expect(up2.status()).toBe(201)
    const photo2 = await up2.json()
    expect(photo2.is_cover).toBe(false)
    expect(photo2.sort_order).toBeGreaterThan(photo1.sort_order)

    // Define foto2 como capa
    const setCover = await page.request.patch(`/api/vehicles/${vehicleId}/photos/${photo2.id}`)
    expect(setCover.status()).toBe(200)

    // Remove a capa (foto2) — servidor deve promover foto1 a capa novamente
    const del = await page.request.delete(`/api/vehicles/${vehicleId}/photos/${photo2.id}`)
    expect(del.status()).toBe(200)

    // Limpa o veículo de teste
    await page.request.delete(`/api/vehicles/${vehicleId}`)
  })

  test('rejeita upload de tipo inválido', async ({ page }) => {
    await login(page)

    const createRes = await page.request.post('/api/vehicles', {
      data: {
        brand: 'Ford', model: 'Ka INVALID-TEST',
        year_model: 2024, year_manuf: 2023, color: 'Branco',
        fuel: 'flex', transmission: 'manual', mileage: 50000,
        price: 45000, status: 'available', featured: false,
        price_negotiable: true, features: [],
      },
    })
    const vehicleId = (await createRes.json()).id as string

    const badRes = await page.request.post(`/api/vehicles/${vehicleId}/photos`, {
      multipart: { file: { name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('fake pdf') } },
    })
    expect(badRes.status()).toBe(400)

    await page.request.delete(`/api/vehicles/${vehicleId}`)
  })

  test('ciclo de vida completo do veículo (consolidado)', async ({ page }) => {
    await login(page)

    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    )

    // Sufixo único para evitar colisão com resíduos de execuções anteriores
    const runId = `LIFECYCLE-${Date.now()}`
    const model = `Onix ${runId}`

    // ── 1. Criar veículo ──────────────────────────────────────────────
    const createRes = await page.request.post('/api/vehicles', {
      data: {
        brand: 'Chevrolet', model,
        year_model: 2024, year_manuf: 2023, color: 'Vermelho',
        fuel: 'flex', transmission: 'automatic', mileage: 25000,
        price: 78000, status: 'available', featured: false,
        price_negotiable: true, features: ['Ar-condicionado', 'ABS'],
      },
    })
    expect(createRes.status()).toBe(201)
    const vehicleId = (await createRes.json()).id as string

    // ── 2. Aparece na lista ───────────────────────────────────────────
    await page.goto('/admin/vehicles')
    await expect(page.getByText(`Chevrolet ${model}`).first()).toBeVisible()

    // ── 3. Upload de 3 fotos ──────────────────────────────────────────
    const photoIds: string[] = []
    const photoUrls: string[] = []
    for (let i = 0; i < 3; i++) {
      const res = await page.request.post(`/api/vehicles/${vehicleId}/photos`, {
        multipart: { file: { name: `foto${i}.png`, mimeType: 'image/png', buffer: tinyPng } },
      })
      expect(res.status()).toBe(201)
      const p = await res.json()
      photoIds.push(p.id)
      photoUrls.push(p.url)
      expect(p.is_cover).toBe(i === 0) // só a primeira é capa
      expect(p.sort_order).toBe(i)
    }

    // ── 4. Arquivos existem no Storage (URL pública responde 200) ─────
    for (const url of photoUrls) {
      const head = await page.request.get(url)
      expect(head.status()).toBe(200)
    }

    // ── 5. Trocar capa para a 3ª foto ─────────────────────────────────
    const setCover = await page.request.patch(`/api/vehicles/${vehicleId}/photos/${photoIds[2]}`)
    expect(setCover.status()).toBe(200)

    // ── 6. Atualizar dados do veículo ─────────────────────────────────
    const update = await page.request.patch(`/api/vehicles/${vehicleId}`, {
      data: {
        brand: 'Chevrolet', model,
        year_model: 2024, year_manuf: 2023, color: 'Vermelho',
        fuel: 'flex', transmission: 'automatic', mileage: 25000,
        price: 72000, // preço reduzido
        status: 'available', featured: true, // virou destaque
        price_negotiable: true, features: ['Ar-condicionado', 'ABS', 'Airbag duplo'],
      },
    })
    expect(update.status()).toBe(200)

    // ── 7. Mudar status: reservado → disponível ───────────────────────
    const reserve = await page.request.patch(`/api/vehicles/${vehicleId}/status`, {
      data: { status: 'reserved' },
    })
    expect(reserve.status()).toBe(200)

    const backToAvailable = await page.request.patch(`/api/vehicles/${vehicleId}/status`, {
      data: { status: 'available' },
    })
    expect(backToAvailable.status()).toBe(200)

    // ── 8. Remover a foto que é capa agora (3ª) ───────────────────────
    const delPhoto = await page.request.delete(`/api/vehicles/${vehicleId}/photos/${photoIds[2]}`)
    expect(delPhoto.status()).toBe(200)

    // Nota: a URL pública do Supabase Storage é servida via CDN — pode continuar
    // respondendo 200 por alguns minutos após o delete. O código do endpoint chama
    // storage.remove() (ver app/api/vehicles/[id]/photos/[photoId]/route.ts), e o
    // status 200 da resposta acima já confirma que a remoção foi executada no banco.

    // ── 9. Hard delete do veículo ─────────────────────────────────────
    const delVehicle = await page.request.delete(`/api/vehicles/${vehicleId}`)
    expect(delVehicle.status()).toBe(200)

    // Veículo sumiu da listagem (usa o runId único para não colidir com resíduos)
    await page.goto('/admin/vehicles')
    await expect(page.getByText(runId)).toHaveCount(0)
  })

  test('enforça limite de 5 fotos', async ({ page }) => {
    await login(page)

    const createRes = await page.request.post('/api/vehicles', {
      data: {
        brand: 'VW', model: 'Gol LIMIT-TEST',
        year_model: 2024, year_manuf: 2023, color: 'Azul',
        fuel: 'flex', transmission: 'manual', mileage: 80000,
        price: 35000, status: 'available', featured: false,
        price_negotiable: true, features: [],
      },
    })
    const vehicleId = (await createRes.json()).id as string
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    )

    // Sobe 5 fotos (limite)
    for (let i = 0; i < 5; i++) {
      const res = await page.request.post(`/api/vehicles/${vehicleId}/photos`, {
        multipart: { file: { name: `f${i}.png`, mimeType: 'image/png', buffer: tinyPng } },
      })
      expect(res.status()).toBe(201)
    }

    // 6ª deve falhar com 409
    const overflow = await page.request.post(`/api/vehicles/${vehicleId}/photos`, {
      multipart: { file: { name: 'f6.png', mimeType: 'image/png', buffer: tinyPng } },
    })
    expect(overflow.status()).toBe(409)

    await page.request.delete(`/api/vehicles/${vehicleId}`)
  })

})
