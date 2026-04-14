import { test, expect } from '@playwright/test'

const MASTER_URL = process.env.E2E_MASTER_URL || 'http://master.localhost:3000'
const EMAIL = process.env.E2E_MASTER_EMAIL || ''
const PASSWORD = process.env.E2E_MASTER_PASSWORD || ''

async function loginMaster(page: any) {
  await page.goto(`${MASTER_URL}/master/login`)
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${MASTER_URL}/master/dashboard`, { timeout: 30_000 })
}

test.describe('Master — autenticação', () => {

  test('login com credenciais corretas redireciona para dashboard', async ({ page }) => {
    await loginMaster(page)
    await expect(page).toHaveURL(`${MASTER_URL}/master/dashboard`)
  })

  test('login com senha errada exibe mensagem de erro', async ({ page }) => {
    await page.goto(`${MASTER_URL}/master/login`)
    await page.fill('#email', EMAIL)
    await page.fill('#password', 'senha-errada-123')
    await page.click('button[type="submit"]')

    const erro = page.getByText(/incorretos|inválido|não autorizado/i)
    await expect(erro).toBeVisible({ timeout: 10_000 })
  })

  test('acesso direto ao dashboard sem login redireciona para login', async ({ page }) => {
    await page.goto(`${MASTER_URL}/master/dashboard`)
    await expect(page).toHaveURL(/master\/login/, { timeout: 10_000 })
  })

})

test.describe('Master — lista de lojas', () => {

  test('página de lojas carrega com tabela ou mensagem de vazio', async ({ page }) => {
    await loginMaster(page)
    await page.goto(`${MASTER_URL}/master/stores`)

    // Aguarda qualquer conteúdo principal aparecer
    await page.waitForLoadState('networkidle', { timeout: 10_000 })
    // A tabela OU mensagem de vazio deve estar na página
    const temTabela = await page.locator('table').isVisible().catch(() => false)
    const temVazio = await page.getByText(/nenhuma loja|sem lojas/i).isVisible().catch(() => false)
    expect(temTabela || temVazio).toBe(true)
  })

  test('busca de lojas funciona sem quebrar a página', async ({ page }) => {
    await loginMaster(page)
    await page.goto(`${MASTER_URL}/master/stores`)

    const searchInput = page.locator('input[type="text"], input[placeholder*="buscar"], input[placeholder*="loja"]').first()
    const hasSearch = await searchInput.isVisible().catch(() => false)
    if (!hasSearch) {
      test.skip()
      return
    }

    await searchInput.fill('loja inexistente xyz')
    await expect(page.locator('body')).toBeVisible()
  })

})

test.describe('Master — criar loja via API', () => {

  test('cria nova loja e retorna 201', async ({ page }) => {
    await loginMaster(page)

    const timestamp = Date.now()
    const res = await page.request.post(`${MASTER_URL}/api/master/stores`, {
      data: {
        store_name: `Loja Teste E2E ${timestamp}`,
        plan: 'trial',
        city: 'São Paulo',
        state: 'SP',
        owner_name: 'Teste E2E',
        owner_email: `e2e+${timestamp}@teste.com`,
        owner_password: 'senha123456',
      },
    })

    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.store).toBeDefined()
    expect(body.store.name).toBe(`Loja Teste E2E ${timestamp}`)
  })

  test('rejeita criação sem campos obrigatórios', async ({ page }) => {
    await loginMaster(page)

    const res = await page.request.post(`${MASTER_URL}/api/master/stores`, {
      data: { plan: 'trial' }, // sem store_name, owner_email, etc.
    })

    expect(res.status()).toBe(400)
  })

  test('rejeita acesso à API sem autenticação master', async ({ page }) => {
    // Sem login — direto na API
    const res = await page.request.post(`${MASTER_URL}/api/master/stores`, {
      data: {
        store_name: 'Loja Invasão',
        plan: 'trial',
        owner_name: 'Hacker',
        owner_email: 'hacker@teste.com',
        owner_password: 'senha123456',
      },
    })

    expect(res.status()).toBe(403)
  })

})
