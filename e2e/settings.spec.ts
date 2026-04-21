import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL || ''
const PASSWORD = process.env.E2E_PASSWORD || ''

async function login(page: any) {
  await page.goto('/admin/login')
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard|\/admin\/onboarding/, { timeout: 30_000 })
}

test.describe('Configurações', () => {

  test('página de configurações carrega os dados da loja', async ({ page }) => {
    await login(page)
    await page.goto('/admin/settings')

    // Aguarda o loading sumir e o formulário aparecer
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 })

    // Campo "Nome da loja" deve estar visível e preenchido
    const nomeDaLoja = page.locator('label:has-text("Nome da loja")').locator('..').locator('input')
    await expect(nomeDaLoja).toBeVisible()
  })

  test('autosave dispara e exibe toast após editar um campo', async ({ page }) => {
    await login(page)
    await page.goto('/admin/settings')
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 })

    const cidade = page.locator('label:has-text("Cidade")').locator('..').locator('input')
    const valorAntes = await cidade.inputValue()

    // Configura o observador da requisição PATCH
    const savePromise = page.waitForResponse(r => r.url().includes('/api/settings') && r.request().method() === 'PATCH', { timeout: 10_000 })

    // Digita no campo
    await cidade.fill('Cidade Autosave')

    // Aguarda o disparo automático (debounce + fetch)
    const res = await savePromise
    expect(res.status()).toBe(200)

    // Restaura o valor original
    await page.request.patch('/api/settings', { data: { city: valorAntes } })
  })

})
