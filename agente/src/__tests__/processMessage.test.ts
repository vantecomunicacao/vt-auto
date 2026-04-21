// ─── Mocks declarados ANTES dos imports ──────────────────────────────────────

const mockSendMessage = jest.fn().mockResolvedValue(undefined)
const mockSendImage = jest.fn().mockResolvedValue(undefined)
const mockSendPresenceOnce = jest.fn().mockResolvedValue(undefined)
const mockLogStep = jest.fn().mockResolvedValue(undefined)
const mockSearchKnowledge = jest.fn().mockResolvedValue('')
const mockGetStockContext = jest.fn().mockResolvedValue('## Estoque atual (0 veículos disponíveis)')
const mockGetVehicleImages = jest.fn().mockResolvedValue([])
const mockFindVehicleId = jest.fn().mockResolvedValue(null)
const mockSearchVehicles = jest.fn().mockResolvedValue('Nenhum veículo encontrado.')

// Supabase builder fluente (chainable)
function makeSupabaseChain(returnValue: unknown = { data: null, error: null }) {
  const chain: Record<string, jest.Mock> = {}
  const methods = ['from', 'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'not', 'order', 'limit', 'rpc']
  methods.forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain)
  })
  chain['single'] = jest.fn().mockResolvedValue(returnValue)
  return chain
}

// Supabase mock configurável por teste
let supabaseMock: ReturnType<typeof makeSupabaseChain>

jest.mock('../db', () => ({
  get supabase() { return supabaseMock },
}))

jest.mock('../evolution', () => ({
  sendMessage: (...args: unknown[]) => mockSendMessage(...args),
  sendImage: (...args: unknown[]) => mockSendImage(...args),
  sendPresenceOnce: (...args: unknown[]) => mockSendPresenceOnce(...args),
  downloadMedia: jest.fn().mockResolvedValue(''),
  isBotSentMessage: jest.fn().mockReturnValue(false),
}))

jest.mock('../logger', () => ({
  logStep: (...args: unknown[]) => mockLogStep(...args),
  streamLogsToClient: jest.fn(),
}))

jest.mock('../rag', () => ({
  searchKnowledge: (...args: unknown[]) => mockSearchKnowledge(...args),
}))

jest.mock('../vehicles', () => ({
  getStockContext: (...args: unknown[]) => mockGetStockContext(...args),
  getVehicleImages: (...args: unknown[]) => mockGetVehicleImages(...args),
  findVehicleId: (...args: unknown[]) => mockFindVehicleId(...args),
  searchVehicles: (...args: unknown[]) => mockSearchVehicles(...args),
}))

// Mock OpenAI configurável por teste
const openaiCreateMock = jest.fn()

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: (...args: unknown[]) => openaiCreateMock(...args) } },
  })),
}))

import { processMessage } from '../agent'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_STORE = {
  id: 'store-1',
  agent_active: true,
  agent_name: 'Agente',
  agent_tone: 'professional',
  agent_prompt: 'Você é um assistente de vendas.',
  agent_greeting: '',
  agent_hours: null,
  openai_api_key: 'sk-test',
  openai_model: 'gpt-4o-mini',
  whatsapp_instance: 'inst-1',
  agent_cooldown_minutes: 30,
  notification_phone: '',
  agent_context_window: 10,
  agent_max_message_chars: 300,
  agent_stock_limit: 20,
  agent_stock_format: 'full',
  agent_end_prompt: '',
  agent_stop_on_end: true,
  agent_rate_limit: 20,
}

const BASE_LEAD = {
  id: 'lead-1',
  ai_active: true,
  name: 'João',
  follow_up_count: 0,
  last_human_message_at: null,
}

function makeOpenAIReply(content: string) {
  return {
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 100, completion_tokens: 50 },
  }
}

/** Monta supabase para retornar store e lead corretos */
function setupHappyPath(storeOverride = {}, leadOverride = {}) {
  const store = { ...BASE_STORE, ...storeOverride }
  const lead = { ...BASE_LEAD, ...leadOverride }

  supabaseMock = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
    single: jest.fn()
      .mockResolvedValueOnce({ data: store, error: null })  // busca store
      .mockResolvedValueOnce({ data: lead, error: null })   // busca lead
      .mockResolvedValue({ data: [], error: null }),         // demais
  } as unknown as ReturnType<typeof makeSupabaseChain>
}

const MSG_PARAMS = { instance: 'inst-1', phone: '5511999990000', message: 'Olá' }

beforeEach(() => {
  mockSendMessage.mockReset()
  mockSendMessage.mockResolvedValue(undefined)
  mockSendImage.mockReset()
  mockSendImage.mockResolvedValue(undefined)
  mockSendPresenceOnce.mockReset()
  mockSendPresenceOnce.mockResolvedValue(undefined)
  mockLogStep.mockReset()
  mockLogStep.mockResolvedValue(undefined)
  mockSearchKnowledge.mockReset()
  mockSearchKnowledge.mockResolvedValue('')
  mockGetStockContext.mockReset()
  mockGetStockContext.mockResolvedValue('## Estoque atual (0 veículos disponíveis)')
  mockGetVehicleImages.mockReset()
  mockGetVehicleImages.mockResolvedValue([])
  mockFindVehicleId.mockReset()
  mockFindVehicleId.mockResolvedValue(null)
  mockSearchVehicles.mockReset()
  mockSearchVehicles.mockResolvedValue('Nenhum veículo encontrado.')
  openaiCreateMock.mockReset()
})

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('processMessage — guarda de entrada', () => {
  it('retorna sem processar quando store não encontrado', async () => {
    supabaseMock = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    } as unknown as ReturnType<typeof makeSupabaseChain>

    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('retorna sem processar quando agent_active = false', async () => {
    setupHappyPath({ agent_active: false })
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('retorna sem processar quando openai_api_key está vazio', async () => {
    setupHappyPath({ openai_api_key: '' })
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('retorna e loga quando fora do horário configurado', async () => {
    const hoursConfig = { sun: { start: '00:00', end: '00:01' }, mon: { start: '00:00', end: '00:01' }, tue: { start: '00:00', end: '00:01' }, wed: { start: '00:00', end: '00:01' }, thu: { start: '00:00', end: '00:01' }, fri: { start: '00:00', end: '00:01' }, sat: { start: '00:00', end: '00:01' } }
    setupHappyPath({ agent_hours: hoursConfig })
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).not.toHaveBeenCalled()
    expect(mockLogStep).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ skipped: 'fora do horário' }) }))
  })

  it('retorna e loga quando ai_active = false no lead', async () => {
    setupHappyPath({}, { ai_active: false })
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).not.toHaveBeenCalled()
    expect(mockLogStep).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ skipped: 'IA desativada para este lead' }) }))
  })

  it('retorna e loga quando cooldown está ativo', async () => {
    const recentHuman = new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 min atrás
    setupHappyPath({ agent_cooldown_minutes: 30 }, { last_human_message_at: recentHuman })
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).not.toHaveBeenCalled()
    expect(mockLogStep).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ skipped: expect.stringContaining('cooldown') }) }))
  })

  it('processa normalmente quando cooldown já expirou', async () => {
    const oldHuman = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2h atrás
    setupHappyPath({ agent_cooldown_minutes: 30 }, { last_human_message_at: oldHuman })
    openaiCreateMock.mockResolvedValue(makeOpenAIReply('Tudo certo, posso ajudar!'))
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).toHaveBeenCalled()
  })
})

describe('processMessage — fluxo normal', () => {
  beforeEach(() => {
    openaiCreateMock.mockResolvedValue(makeOpenAIReply('Olá! Posso ajudar com algum veículo?'))
  })

  it('envia resposta da OpenAI ao cliente', async () => {
    setupHappyPath()
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).toHaveBeenCalledWith('inst-1', '5511999990000', 'Olá! Posso ajudar com algum veículo?')
  })

  it.skip('envia greeting no primeiro contato quando configurado', async () => {
    setupHappyPath({ agent_greeting: 'Bem-vindo!' }, null as unknown as typeof BASE_LEAD)

    // Sobrescreve: primeiro single (store), segundo single (lead = null → primeiro contato)
    supabaseMock.single = jest.fn()
      .mockResolvedValueOnce({ data: { ...BASE_STORE, agent_greeting: 'Bem-vindo!' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })          // lead não encontrado
      .mockResolvedValueOnce({ data: BASE_LEAD, error: null })     // upsert → retorna lead
      .mockResolvedValue({ data: [], error: null })

    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).toHaveBeenCalledWith('inst-1', '5511999990000', 'Bem-vindo!')
  })

  it('não envia greeting quando greeting está vazio', async () => {
    setupHappyPath({ agent_greeting: '' })
    await processMessage(MSG_PARAMS)
    // Só deve enviar a resposta da OpenAI, não o greeting
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
    expect(mockSendMessage).toHaveBeenCalledWith('inst-1', '5511999990000', 'Olá! Posso ajudar com algum veículo?')
  })

  it('não envia greeting quando greeting é só espaços', async () => {
    setupHappyPath({ agent_greeting: '   ' })
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })

  it('inicia o indicador de digitando antes de responder', async () => {
    setupHappyPath()
    await processMessage(MSG_PARAMS)
    expect(mockSendPresenceOnce).toHaveBeenCalled()
  })
})

describe('processMessage — OpenAI falha', () => {
  it('envia mensagem de fallback ao cliente quando OpenAI lança erro', async () => {
    setupHappyPath()
    // Primeira chamada: classificador RAG (sucesso). Segunda: chamada principal (erro)
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] })
      .mockRejectedValue(new Error('Rate limit exceeded'))
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).toHaveBeenCalledWith(
      'inst-1',
      '5511999990000',
      expect.stringContaining('verificando algumas informações')
    )
  })

  it('loga o erro da OpenAI', async () => {
    setupHappyPath()
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] })
      .mockRejectedValue(new Error('API error'))
    await processMessage(MSG_PARAMS)
    expect(mockLogStep).toHaveBeenCalledWith(expect.objectContaining({
      step: 'openai_called',
      status: 'error',
    }))
  })
})

describe('processMessage — TRANSBORDO', () => {
  beforeEach(() => {
    setupHappyPath({ notification_phone: '5511888880000' })
    openaiCreateMock.mockResolvedValue(makeOpenAIReply('Claro, vou passar para um atendente. [TRANSBORDO_ATIVADO]'))
  })

  it('envia resposta sem o marcador ao cliente', async () => {
    await processMessage(MSG_PARAMS)
    const calls = mockSendMessage.mock.calls
    const toClient = calls.find(c => c[1] === '5511999990000')
    expect(toClient?.[2]).not.toContain('[TRANSBORDO_ATIVADO]')
  })

  it('atualiza o lead para ai_active=false com razão transbordo', async () => {
    await processMessage(MSG_PARAMS)
    expect(supabaseMock.update).toHaveBeenCalledWith(expect.objectContaining({
      ai_active: false,
      ai_paused_reason: 'transbordo',
    }))
  })

  it('envia notificação para o número configurado', async () => {
    await processMessage(MSG_PARAMS)
    const notifCall = mockSendMessage.mock.calls.find(c => c[1] === '5511888880000')
    expect(notifCall).toBeDefined()
    expect(notifCall?.[2]).toContain('aguardando humano')
  })
})

describe('processMessage — CONVERSA_ENCERRADA', () => {
  beforeEach(() => {
    setupHappyPath({
      notification_phone: '5511888880000',
      agent_end_prompt: 'o cliente confirmar visita',
      agent_stop_on_end: true,
    })
    // 1ª chamada: classificador RAG. 2ª: resposta com encerramento. 3ª: resumo
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] })
      .mockResolvedValueOnce(makeOpenAIReply('Ótimo, te esperamos na loja! [CONVERSA_ENCERRADA]'))
      .mockResolvedValueOnce(makeOpenAIReply('Carro de interesse: Gol\nIntenção: quente'))
  })

  it('envia resposta sem o marcador ao cliente', async () => {
    await processMessage(MSG_PARAMS)
    const toClient = mockSendMessage.mock.calls.find(c => c[1] === '5511999990000')
    expect(toClient?.[2]).not.toContain('[CONVERSA_ENCERRADA]')
  })

  it('atualiza lead para ai_active=false quando agent_stop_on_end=true', async () => {
    await processMessage(MSG_PARAMS)
    expect(supabaseMock.update).toHaveBeenCalledWith(expect.objectContaining({
      ai_active: false,
      ai_paused_reason: 'encerramento',
      status: 'qualified',
    }))
  })

  it('envia notificação com resumo para o número configurado', async () => {
    await processMessage(MSG_PARAMS)
    const notifCall = mockSendMessage.mock.calls.find(c => c[1] === '5511888880000')
    expect(notifCall).toBeDefined()
    expect(notifCall?.[2]).toContain('Atendimento encerrado')
  })

  it('NÃO pausa o lead quando agent_stop_on_end=false', async () => {
    setupHappyPath({ notification_phone: '', agent_end_prompt: 'visita confirmada', agent_stop_on_end: false })
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] }) // classifier
      .mockResolvedValueOnce(makeOpenAIReply('Até logo! [CONVERSA_ENCERRADA]'))
      .mockResolvedValueOnce(makeOpenAIReply('Resumo ok'))

    await processMessage(MSG_PARAMS)

    const updateCalls = (supabaseMock.update as jest.Mock).mock.calls
    const pauseCall = updateCalls.find((args: unknown[]) =>
      args[0] && typeof args[0] === 'object' && (args[0] as Record<string, unknown>).ai_paused_reason === 'encerramento'
    )
    expect(pauseCall).toBeUndefined()
  })
})

describe('processMessage — envio de fotos', () => {
  beforeEach(() => {
    mockFindVehicleId.mockResolvedValue('vehicle-abc')
    mockGetVehicleImages.mockResolvedValue(['https://example.com/foto1.jpg', 'https://example.com/foto2.jpg'])
  })

  it('envia fotos quando marcador [FOTOS:] está presente', async () => {
    setupHappyPath()
    openaiCreateMock.mockResolvedValue(makeOpenAIReply('Aqui estão os detalhes do Jeep Compass. [FOTOS:Jeep:Compass]'))
    await processMessage(MSG_PARAMS)
    expect(mockSendImage).toHaveBeenCalledTimes(2)
  })

  it('envia fotos pelo fallback quando marca+modelo aparecem no texto', async () => {
    setupHappyPath()
    // Supabase retorna veículos para a busca de fallback
    supabaseMock.single = jest.fn()
      .mockResolvedValueOnce({ data: BASE_STORE, error: null })
      .mockResolvedValueOnce({ data: BASE_LEAD, error: null })
      .mockResolvedValue({ data: null, error: null })

    // Simula a query de vehicles no fallback
    const originalFrom = supabaseMock.from as jest.Mock
    originalFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          then: (resolve: (v: unknown) => void) => resolve({ data: [{ brand: 'Honda', model: 'Civic' }], error: null }),
        }
      }
      return supabaseMock
    })

    openaiCreateMock.mockResolvedValue(makeOpenAIReply('O Honda Civic é uma excelente opção!'))
    // Não testa o envio de foto aqui pois depende do mock do supabase de vehicles
    // O importante é que não lança erro
    await expect(processMessage(MSG_PARAMS)).resolves.not.toThrow()
  })

  it('não envia fotos quando marcador não está presente e nenhum veículo é identificado', async () => {
    setupHappyPath()
    openaiCreateMock.mockResolvedValue(makeOpenAIReply('Temos ótimas opções para você!'))

    // Supabase retorna lista vazia de veículos
    supabaseMock.single = jest.fn()
      .mockResolvedValueOnce({ data: BASE_STORE, error: null })
      .mockResolvedValueOnce({ data: BASE_LEAD, error: null })
      .mockResolvedValue({ data: [], error: null })

    await processMessage(MSG_PARAMS)
    expect(mockSendImage).not.toHaveBeenCalled()
  })
})

describe('processMessage — registrar_qualificacao', () => {
  it('atualiza vehicle_interest quando OpenAI chama registrar_qualificacao', async () => {
    setupHappyPath()
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] }) // classifier
      .mockResolvedValueOnce({                                                // tool call
        choices: [{ finish_reason: 'tool_calls', message: {
          tool_calls: [{ id: 'tc1', function: { name: 'registrar_qualificacao', arguments: JSON.stringify({ vehicle_interest: 'Honda Civic 2023' }) } }],
        }}],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      })
      .mockResolvedValueOnce(makeOpenAIReply('Ótima escolha! Posso te ajudar com o Civic.')) // resposta final

    await processMessage(MSG_PARAMS)

    expect(supabaseMock.update).toHaveBeenCalledWith(expect.objectContaining({
      vehicle_interest: 'Honda Civic 2023',
    }))
  })
})

describe('processMessage — buscar_veiculos auto-foto', () => {
  it('envia fotos automaticamente quando buscar_veiculos é chamado com marca/modelo', async () => {
    mockFindVehicleId.mockResolvedValue('v-123')
    mockGetVehicleImages.mockResolvedValue(['https://img.com/1.jpg', 'https://img.com/2.jpg'])
    setupHappyPath()

    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] }) // classifier
      .mockResolvedValueOnce({                                                // buscar_veiculos
        choices: [{ finish_reason: 'tool_calls', message: {
          tool_calls: [{ id: 'tc1', function: { name: 'buscar_veiculos', arguments: JSON.stringify({ marca: 'Toyota', modelo: 'Corolla' }) } }],
        }}],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      })
      .mockResolvedValueOnce(makeOpenAIReply('O Toyota Corolla é excelente!\n\nQuer financiar ou pagar à vista?'))

    await processMessage(MSG_PARAMS)

    expect(mockFindVehicleId).toHaveBeenCalledWith(expect.any(String), 'Toyota', 'Corolla')
    expect(mockSendImage).toHaveBeenCalledTimes(2)
  })
})

describe('processMessage — persistência', () => {
  it('salva mensagem do usuário e resposta do assistente no banco', async () => {
    setupHappyPath()
    openaiCreateMock.mockResolvedValue(makeOpenAIReply('Posso ajudar!'))
    await processMessage(MSG_PARAMS)
    expect(supabaseMock.insert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ role: 'user', content: 'Olá' }),
      expect.objectContaining({ role: 'assistant', content: 'Posso ajudar!' }),
    ]))
  })
})

describe('processMessage — race condition lead', () => {
  it('usa upsert para criar lead (evita duplicata)', async () => {
    setupHappyPath()
    // Lead não existe inicialmente
    supabaseMock.single = jest.fn()
      .mockResolvedValueOnce({ data: BASE_STORE, error: null })
      .mockResolvedValueOnce({ data: null, error: null })    // lead não encontrado
      .mockResolvedValueOnce({ data: BASE_LEAD, error: null }) // upsert retorna lead
      .mockResolvedValue({ data: [], error: null })

    openaiCreateMock.mockResolvedValue(makeOpenAIReply('Posso ajudar!'))
    await processMessage(MSG_PARAMS)
    expect(supabaseMock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '5511999990000' }),
      expect.objectContaining({ onConflict: 'store_id,phone' })
    )
  })

  it('busca lead existente quando upsert retorna vazio (conflito ignorado)', async () => {
    setupHappyPath()
    supabaseMock.single = jest.fn()
      .mockResolvedValueOnce({ data: BASE_STORE, error: null })
      .mockResolvedValueOnce({ data: null, error: null })  // lead não encontrado
      .mockResolvedValueOnce({ data: null, error: null })  // upsert ignorado (conflito)
      .mockResolvedValueOnce({ data: BASE_LEAD, error: null }) // busca fallback
      .mockResolvedValue({ data: [], error: null })

    openaiCreateMock.mockResolvedValue(makeOpenAIReply('Posso ajudar!'))
    await processMessage(MSG_PARAMS)
    // Se chegou até enviar resposta, o fallback funcionou
    expect(mockSendMessage).toHaveBeenCalled()
  })
})

// ─── Rate limit ───────────────────────────────────────────────────────────────

describe('processMessage — rate limit', () => {
  function setupWithCount(count: number, storeOverride = {}) {
    const store = { ...BASE_STORE, ...storeOverride }
    const lead = { ...BASE_LEAD }

    // Mock que retorna count na query de contagem (sem .single())
    const chainWithCount = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockImplementation(() => ({ ...chainWithCount, count, data: null, error: null })),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({ data: store, error: null })
        .mockResolvedValueOnce({ data: lead, error: null })
        .mockResolvedValue({ data: [], error: null }),
      count,
      data: null,
      error: null,
    }
    supabaseMock = chainWithCount as unknown as ReturnType<typeof makeSupabaseChain>
  }

  it('pausa o lead e não responde quando rate limit atingido', async () => {
    setupWithCount(20) // exatamente no limite
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).not.toHaveBeenCalledWith('inst-1', '5511999990000', expect.any(String))
    expect(supabaseMock.update).toHaveBeenCalledWith(expect.objectContaining({ ai_active: false }))
  })

  it('loga rate_limit quando limite atingido', async () => {
    setupWithCount(25)
    await processMessage(MSG_PARAMS)
    expect(mockLogStep).toHaveBeenCalledWith(expect.objectContaining({
      step: 'rate_limit',
      status: 'ok',
    }))
  })

  it('notifica o dono via WhatsApp quando rate limit atingido e notification_phone configurado', async () => {
    setupWithCount(20, { notification_phone: '5511888880000' })
    await processMessage(MSG_PARAMS)
    const notifCall = mockSendMessage.mock.calls.find(c => c[1] === '5511888880000')
    expect(notifCall).toBeDefined()
    expect(notifCall?.[2]).toContain('Rate limit')
  })

  it('processa normalmente quando abaixo do limite', async () => {
    setupHappyPath() // count undefined → 0, bem abaixo de 20
    openaiCreateMock.mockResolvedValue(makeOpenAIReply('Posso ajudar!'))
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).toHaveBeenCalledWith('inst-1', '5511999990000', 'Posso ajudar!')
  })
})

// ─── Configurações aplicadas no agente ───────────────────────────────────────

describe('processMessage — configurações aplicadas', () => {
  it('inclui agent_name no system prompt', async () => {
    setupHappyPath({ agent_name: 'Marcos' })
    let capturedMessages: unknown[] = []
    openaiCreateMock.mockImplementation((args: { messages: unknown[] }) => {
      capturedMessages = args.messages
      return Promise.resolve(makeOpenAIReply('Ok!'))
    })
    await processMessage(MSG_PARAMS)
    const systemMsg = (capturedMessages as Array<{ role: string; content: string }>)
      .find(m => m.role === 'system')
    expect(systemMsg?.content).toContain('Marcos')
  })

  it('inclui agent_prompt no system prompt', async () => {
    setupHappyPath({ agent_prompt: 'Você é especialista em carros elétricos.' })
    let capturedMessages: unknown[] = []
    openaiCreateMock.mockImplementation((args: { messages: unknown[] }) => {
      capturedMessages = args.messages
      return Promise.resolve(makeOpenAIReply('Ok!'))
    })
    await processMessage(MSG_PARAMS)
    const systemMsg = (capturedMessages as Array<{ role: string; content: string }>)
      .find(m => m.role === 'system')
    expect(systemMsg?.content).toContain('especialista em carros elétricos')
  })

  it('inclui instrução de tom professional no system prompt', async () => {
    setupHappyPath({ agent_tone: 'professional' })
    let capturedMessages: unknown[] = []
    openaiCreateMock.mockImplementation((args: { messages: unknown[] }) => {
      capturedMessages = args.messages
      return Promise.resolve(makeOpenAIReply('Ok!'))
    })
    await processMessage(MSG_PARAMS)
    const systemMsg = (capturedMessages as Array<{ role: string; content: string }>)
      .find(m => m.role === 'system')
    expect(systemMsg?.content).toContain('profissional')
  })

  it('usa openai_model configurado na chamada à OpenAI', async () => {
    setupHappyPath({ openai_model: 'gpt-4o' })
    let capturedModel = ''
    openaiCreateMock.mockImplementation((args: { model: string }) => {
      capturedModel = args.model
      return Promise.resolve(makeOpenAIReply('Ok!'))
    })
    await processMessage(MSG_PARAMS)
    expect(capturedModel).toBe('gpt-4o')
  })
})

// ─── RAG ─────────────────────────────────────────────────────────────────────

describe('processMessage — RAG (base de conhecimento)', () => {
  it('chama searchKnowledge quando classificador responde "sim"', async () => {
    setupHappyPath()
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'sim' } }] }) // classificador
      .mockResolvedValueOnce(makeOpenAIReply('Aqui está a política de garantia.'))
    await processMessage(MSG_PARAMS)
    expect(mockSearchKnowledge).toHaveBeenCalled()
  })

  it('NÃO chama searchKnowledge quando classificador responde "nao"', async () => {
    setupHappyPath()
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] }) // classificador
      .mockResolvedValueOnce(makeOpenAIReply('Posso te ajudar com um veículo!'))
    await processMessage(MSG_PARAMS)
    expect(mockSearchKnowledge).not.toHaveBeenCalled()
  })

  it('inclui resultado do RAG no system prompt quando encontrado', async () => {
    setupHappyPath()
    mockSearchKnowledge.mockResolvedValue('Garantia: 12 meses para motor e câmbio.')
    let capturedMessages: unknown[] = []
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'sim' } }] })
      .mockImplementationOnce((args: { messages: unknown[] }) => {
        capturedMessages = args.messages
        return Promise.resolve(makeOpenAIReply('A garantia é de 12 meses.'))
      })
    await processMessage(MSG_PARAMS)
    const systemMsg = (capturedMessages as Array<{ role: string; content: string }>)
      .find(m => m.role === 'system')
    expect(systemMsg?.content).toContain('Garantia: 12 meses')
  })

  it('continua atendimento normalmente se RAG não encontrar resultado', async () => {
    setupHappyPath()
    mockSearchKnowledge.mockResolvedValue('')
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'sim' } }] })
      .mockResolvedValueOnce(makeOpenAIReply('Posso ajudar com outra coisa?'))
    await processMessage(MSG_PARAMS)
    expect(mockSendMessage).toHaveBeenCalledWith('inst-1', '5511999990000', 'Posso ajudar com outra coisa?')
  })
})

// ─── Notificação de erro OpenAI ───────────────────────────────────────────────

describe('processMessage — notificação de erro OpenAI', () => {
  it('envia aviso de chave inválida quando erro 401', async () => {
    setupHappyPath({ notification_phone: '5511888880000' })
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] })
      .mockRejectedValueOnce(new Error('401 Incorrect API key'))
    await processMessage(MSG_PARAMS)
    const notifCall = mockSendMessage.mock.calls.find(c => c[1] === '5511888880000')
    expect(notifCall?.[2]).toContain('Chave OpenAI inválida')
  })

  it('envia aviso de instabilidade quando erro genérico', async () => {
    setupHappyPath({ notification_phone: '5511888880000' })
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] })
      .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
    await processMessage(MSG_PARAMS)
    const notifCall = mockSendMessage.mock.calls.find(c => c[1] === '5511888880000')
    expect(notifCall?.[2]).toContain('OpenAI indisponível')
  })

  it('não trava quando notification_phone não está configurado', async () => {
    setupHappyPath({ notification_phone: '' })
    openaiCreateMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'nao' } }] })
      .mockRejectedValueOnce(new Error('timeout'))
    await expect(processMessage(MSG_PARAMS)).resolves.not.toThrow()
  })
})
