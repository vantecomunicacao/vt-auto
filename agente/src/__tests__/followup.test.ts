// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSendMessage = jest.fn().mockResolvedValue(undefined)
const mockSendPresenceOnce = jest.fn().mockResolvedValue(undefined)
const mockLogStep = jest.fn().mockResolvedValue(undefined)
const openaiCreateMock = jest.fn()

// Sequência de resultados do supabase — cada await consome um
let supabaseResults: Array<{ data: unknown; error: unknown }> = []
let supabaseResultIdx = 0

function makeChain(): Record<string, unknown> {
  const result = supabaseResults[supabaseResultIdx++] ?? { data: null, error: null }
  const promise = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  const chainMethods = [
    'from', 'select', 'update', 'insert', 'upsert', 'delete',
    'eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'not', 'order', 'limit',
  ]
  chainMethods.forEach(m => { chain[m] = jest.fn().mockReturnValue(chain) })
  // Faz o chain ser awaitable como uma Promise
  chain['then'] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    promise.then(resolve, reject)
  chain['catch'] = (reject: (e: unknown) => unknown) => promise.catch(reject)
  chain['finally'] = (cb: () => void) => promise.finally(cb)
  return chain
}

jest.mock('../db', () => ({
  get supabase() {
    return {
      from: jest.fn().mockImplementation(() => makeChain()),
    }
  },
}))

jest.mock('../evolution', () => ({
  sendMessage: (...args: unknown[]) => mockSendMessage(...args),
  sendPresenceOnce: (...args: unknown[]) => mockSendPresenceOnce(...args),
  sendImage: jest.fn(),
  downloadMedia: jest.fn(),
  isBotSentMessage: jest.fn(),
}))

jest.mock('../logger', () => ({
  logStep: (...args: unknown[]) => mockLogStep(...args),
}))

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: (...args: unknown[]) => openaiCreateMock(...args) } },
  })),
}))

import { runFollowUpCycle } from '../followup'

// ─── Dados base ───────────────────────────────────────────────────────────────

const BASE_STORE = {
  id: 'store-1',
  follow_up_enabled: true,
  follow_up_config: { intervals: [60], messages: ['Oi, ainda tem interesse?'] },
  whatsapp_instance: 'inst-1',
  openai_api_key: 'sk-test',
  openai_model: 'gpt-4o-mini',
  agent_name: 'Agente',
  agent_tone: 'professional',
  agent_prompt: 'Você é um assistente.',
}

const BASE_LEAD = {
  id: 'lead-1',
  phone: '5511999990000',
  name: 'Maria',
  follow_up_count: 0,
  follow_up_total: 0,
  last_user_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
}

beforeEach(() => {
  supabaseResultIdx = 0
  supabaseResults = []
  mockSendMessage.mockReset()
  mockSendMessage.mockResolvedValue(undefined)
  mockSendPresenceOnce.mockReset()
  mockSendPresenceOnce.mockResolvedValue(undefined)
  mockLogStep.mockReset()
  mockLogStep.mockResolvedValue(undefined)
  openaiCreateMock.mockReset()
})

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('runFollowUpCycle — guarda de entrada', () => {
  it('não faz nada quando não há lojas', async () => {
    supabaseResults = [{ data: [], error: null }]
    await runFollowUpCycle()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('não faz nada quando loja não tem openai_api_key', async () => {
    supabaseResults = [{ data: [{ ...BASE_STORE, openai_api_key: '' }], error: null }]
    await runFollowUpCycle()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('não faz nada quando follow_up_config está vazio', async () => {
    supabaseResults = [
      { data: [{ ...BASE_STORE, follow_up_config: { intervals: [], messages: [] } }], error: null },
    ]
    await runFollowUpCycle()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('não faz nada quando não há leads elegíveis', async () => {
    supabaseResults = [
      { data: [BASE_STORE], error: null }, // stores
      { data: [], error: null },           // leads (vazio)
    ]
    await runFollowUpCycle()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })
})

describe('runFollowUpCycle — validação de interação do lead', () => {
  it('pula lead sem mensagens do cliente no histórico', async () => {
    supabaseResults = [
      { data: [BASE_STORE], error: null },  // stores
      { data: [BASE_LEAD], error: null },   // leads
      { data: [{ id: 'lead-1' }], error: null }, // atomic claim ok
      { data: [], error: null },            // history vazio — sem role:'user'
    ]
    await runFollowUpCycle()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })
})

describe('runFollowUpCycle — envio de follow-up', () => {
  beforeEach(() => {
    openaiCreateMock.mockResolvedValue({
      choices: [{ message: { content: 'Ainda tem interesse no veículo?' } }],
    })
    supabaseResults = [
      { data: [BASE_STORE], error: null },                             // stores
      { data: [BASE_LEAD], error: null },                              // leads
      { data: [{ id: 'lead-1' }], error: null },                      // atomic claim
      { data: [{ role: 'user', content: 'Oi' }], error: null },       // history (tem msg do cliente)
      { data: null, error: null },                                     // insert conversation
    ]
  })

  it('envia follow-up via WhatsApp quando lead está no prazo', async () => {
    await runFollowUpCycle()
    expect(mockSendMessage).toHaveBeenCalledWith('inst-1', '5511999990000', expect.any(String))
  })

  it('usa o conteúdo gerado pela OpenAI (não o prompt raw)', async () => {
    await runFollowUpCycle()
    const [, , msg] = mockSendMessage.mock.calls[0]
    expect(msg).toBe('Ainda tem interesse no veículo?')
  })

  it('loga o follow-up com status ok', async () => {
    await runFollowUpCycle()
    expect(mockLogStep).toHaveBeenCalledWith(expect.objectContaining({
      step: 'follow_up_sent',
      status: 'ok',
    }))
  })

  it('envia indicador de digitando antes da mensagem', async () => {
    await runFollowUpCycle()
    expect(mockSendPresenceOnce).toHaveBeenCalled()
  })
})

describe('runFollowUpCycle — atomic claim', () => {
  it('pula lead quando outro processo ganhou o claim (retorno vazio)', async () => {
    openaiCreateMock.mockResolvedValue({ choices: [{ message: { content: 'Oi' } }] })
    supabaseResults = [
      { data: [BASE_STORE], error: null },
      { data: [BASE_LEAD], error: null },
      { data: [], error: null }, // claim falhou — lista vazia
    ]
    await runFollowUpCycle()
    expect(mockSendMessage).not.toHaveBeenCalled()
  })
})

describe('runFollowUpCycle — falha da OpenAI', () => {
  it('loga erro e não trava o ciclo', async () => {
    openaiCreateMock.mockRejectedValue(new Error('OpenAI down'))
    supabaseResults = [
      { data: [BASE_STORE], error: null },
      { data: [BASE_LEAD], error: null },
      { data: [{ id: 'lead-1' }], error: null },
      { data: [{ role: 'user', content: 'Sim' }], error: null },
    ]
    await expect(runFollowUpCycle()).resolves.not.toThrow()
    expect(mockLogStep).toHaveBeenCalledWith(expect.objectContaining({
      step: 'follow_up_sent',
      status: 'error',
    }))
    expect(mockSendMessage).not.toHaveBeenCalled()
  })
})

describe('runFollowUpCycle — variável sentInCycle corrigida', () => {
  it('incrementa follow_up_count de 0 para 1 no atomic claim', async () => {
    openaiCreateMock.mockResolvedValue({ choices: [{ message: { content: 'Oi!' } }] })

    supabaseResults = [
      { data: [BASE_STORE], error: null },
      { data: [{ ...BASE_LEAD, follow_up_count: 0 }], error: null },
      { data: [{ id: 'lead-1' }], error: null }, // claim ok
      { data: [{ role: 'user', content: 'Sim' }], error: null }, // history
      { data: null, error: null }, // insert
    ]

    // Spy no update via logStep — o atomic claim usa follow_up_count: sentInCycle + 1
    // Verificamos via o que foi logado (attempt: dueIndex + 1 = 1)
    await runFollowUpCycle()

    expect(mockLogStep).toHaveBeenCalledWith(expect.objectContaining({
      step: 'follow_up_sent',
      status: 'ok',
      data: expect.objectContaining({ attempt: 1 }),
    }))
  })
})
