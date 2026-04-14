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

// Cria um lead de teste diretamente no banco via API do agente
async function criarLeadTeste(page: any): Promise<string> {
  // Busca o store_id da loja do usuário logado
  const res = await page.request.get('/api/settings')
  const { storeId } = await res.json()

  // Insere lead direto via Supabase Admin (usando a API interna de leads do admin)
  const leadRes = await page.request.post('/api/leads-admin', {
    data: { store_id: storeId, phone: '5511999000001', name: 'Lead Teste E2E', source: 'whatsapp' }
  })

  // Se não tiver rota admin, usa insert direto
  if (!leadRes.ok()) {
    // Cria via upsert no banco usando a rota de settings para obter store_id
    // e depois manipula via PATCH
  }

  const { id } = await leadRes.json()
  return id
}

test.describe('Leads', () => {

  test('lista de leads carrega no painel', async ({ page }) => {
    await login(page)
    await page.goto('/admin/leads')

    // A página deve carregar sem erro
    await expect(page).toHaveURL('/admin/leads')

    // Deve exibir a tabela ou a mensagem de lista vazia
    const tabela = page.locator('table')
    const vazia = page.getByText('Nenhum lead cadastrado ainda.')
    await expect(tabela.or(vazia)).toBeVisible({ timeout: 10_000 })
  })

  test('atualizar status de um lead via API e verificar no painel', async ({ page }) => {
    await login(page)

    // Busca o store_id
    const settingsRes = await page.request.get('/api/settings')
    const { storeId } = await settingsRes.json()

    // Cria um lead de teste direto no banco via Supabase (usando o admin client da API)
    // Usa a rota de veículos como referência — cria lead com PATCH via API interna
    // Primeiro: busca um lead existente para atualizar o status
    await page.goto('/admin/leads')
    await expect(page).toHaveURL('/admin/leads')

    // Aguarda a página carregar (tabela ou mensagem de vazio)
    const tabela = page.locator('table')
    const vazia = page.getByText('Nenhum lead cadastrado ainda.')
    await expect(tabela.or(vazia)).toBeVisible({ timeout: 10_000 })

    // Pula se não há leads
    if (await vazia.isVisible()) {
      test.skip()
      return
    }

    // Clica em "Atualizar status" do primeiro lead
    await page.locator('button:has-text("Atualizar status")').first().click()

    // O dialog deve abrir
    const dialog = page.locator('dialog').first()
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    // Seleciona o status "Qualificando"
    await dialog.locator('select').selectOption('qualifying')

    // Salva
    const [res] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/leads/') && r.request().method() === 'PATCH'),
      dialog.locator('button:has-text("Salvar")').click(),
    ])

    expect(res.status()).toBe(200)

    // Dialog deve fechar
    await expect(dialog).toBeHidden({ timeout: 5_000 })

    // Badge de status "Qualificando" deve aparecer na tabela (span, não option do select)
    await expect(page.locator('td span:has-text("Qualificando")').first()).toBeVisible()
  })

  test('toggle de IA do lead via API', async ({ page }) => {
    await login(page)
    await page.goto('/admin/leads')

    const tabela2 = page.locator('table')
    const vazia2 = page.getByText('Nenhum lead cadastrado ainda.')
    await expect(tabela2.or(vazia2)).toBeVisible({ timeout: 10_000 })

    if (await vazia2.isVisible()) {
      test.skip()
      return
    }

    // Clica no botão de IA do primeiro lead (Ativa ou Pausada)
    const botaoIA = page.locator('button:has-text("Ativa"), button:has-text("Pausada")').first()
    const textoAntes = await botaoIA.textContent()

    const [res] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/leads/') && r.request().method() === 'PATCH'),
      botaoIA.click(),
    ])

    expect(res.status()).toBe(200)

    // O texto do botão deve ter mudado
    const textoDepois = await botaoIA.textContent()
    expect(textoDepois).not.toBe(textoAntes)
  })

})
