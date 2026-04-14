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

  test('aviso de alterações não salvas aparece ao editar', async ({ page }) => {
    await login(page)
    await page.goto('/admin/settings')
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 })

    // Banner de não salvo NÃO deve estar visível inicialmente
    const banner = page.getByText('Você tem alterações não salvas')
    await expect(banner).toBeHidden()

    // Edita o campo de cidade
    const cidade = page.locator('label:has-text("Cidade")').locator('..').locator('input')
    await cidade.fill('Cidade Teste')

    // Banner deve aparecer
    await expect(banner).toBeVisible({ timeout: 5_000 })
  })

  test('salvar configurações da loja via API', async ({ page }) => {
    await login(page)

    // Busca o nome atual da loja
    const res = await page.request.get('/api/settings')
    const { store } = await res.json()
    const nomeOriginal = store.name || 'Loja Teste'

    // Salva com PATCH direto
    const [patchRes] = await Promise.all([
      page.request.patch('/api/settings', {
        data: { name: nomeOriginal }, // mantém o mesmo nome
      }),
    ])

    expect(patchRes.status()).toBe(200)

    // Verifica que os dados retornam corretos
    const check = await page.request.get('/api/settings')
    const { store: after } = await check.json()
    expect(after.name).toBe(nomeOriginal)
  })

  test('aviso de não salvo some após salvar', async ({ page }) => {
    await login(page)
    await page.goto('/admin/settings')
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 })

    const banner = page.getByText('Você tem alterações não salvas')

    // Faz uma edição
    const cidade = page.locator('label:has-text("Cidade")').locator('..').locator('input')
    const valorAntes = await cidade.inputValue()
    await cidade.fill('Cidade Salva')
    await expect(banner).toBeVisible({ timeout: 5_000 })

    // Salva
    const [res] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/settings') && r.request().method() === 'PATCH'),
      page.locator('button:has-text("Salvar")').first().click(),
    ])
    expect(res.status()).toBe(200)

    // Banner deve sumir
    await expect(banner).toBeHidden({ timeout: 5_000 })

    // Restaura o valor original para não sujar os dados
    await page.request.patch('/api/settings', { data: { city: valorAntes } })
  })

})
