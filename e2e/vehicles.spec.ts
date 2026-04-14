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

})
