import { test, expect } from '@playwright/test'

const BASE = process.env.E2E_STOREFRONT_URL || 'http://aut.localhost:3000'

test.describe('Vitrine pública', () => {

  test('página principal carrega com lista de veículos ou mensagem de estoque vazio', async ({ page }) => {
    await page.goto(BASE)

    // Aguarda o conteúdo principal aparecer
    const cards = page.locator('[data-testid="vehicle-card"], .vehicle-card, article').first()
    const vazio = page.getByText(/nenhum veículo|estoque vazio|sem veículos/i)
    const titulo = page.locator('h1, h2').first()

    // Pelo menos um desses elementos deve aparecer — a página carregou
    await expect(cards.or(vazio).or(titulo)).toBeVisible({ timeout: 15_000 })
  })

  test('título ou nome da loja aparece na página', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    // A página deve ter pelo menos um heading
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('botão de WhatsApp está visível na página', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    // WhatsApp FAB ou link com wa.me
    const whatsapp = page.locator('a[href*="wa.me"], a[href*="whatsapp"], [aria-label*="WhatsApp"]').first()
    await expect(whatsapp).toBeVisible({ timeout: 10_000 })
  })

  test('página de detalhe de veículo carrega quando existe veículo publicado', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    // Se não há veículos, pula
    const links = page.locator('a[href*="/veiculo/"]')
    const count = await links.count()
    if (count === 0) {
      test.skip()
      return
    }

    // Clica no primeiro veículo
    const href = await links.first().getAttribute('href')
    await page.goto(`${BASE}${href}`)
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    // Página do veículo deve ter um heading visível
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 })
  })

  test('filtro de busca não quebra a página', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle', { timeout: 15_000 })

    // Se há campo de busca, digita algo
    const searchInput = page.locator('input[type="text"], input[placeholder*="buscar"], input[placeholder*="pesquisar"]').first()
    const hasSearch = await searchInput.isVisible().catch(() => false)
    if (!hasSearch) {
      test.skip()
      return
    }

    await searchInput.fill('Toyota')
    // Página não deve quebrar
    await expect(page.locator('body')).toBeVisible()
  })

})
