// Cobre regressões da cadeia de autenticação/CORS do agente:
// (1) `requireAuth` extraindo `store_id` do claim top-level do JWT
// (2) Fallback para tabela `store_users` quando o Auth Hook não está habilitado
// (3) Headers CORS / CORP que permitem o browser ler a resposta cross-origin

const mockGetUser = jest.fn()
const mockListKnowledge = jest.fn().mockResolvedValue([])
const mockCheckStatus = jest.fn().mockResolvedValue({ connected: true })

// Mock encadeado da query `from('store_users').select('store_id').eq().eq().maybeSingle()`
const mockMaybeSingle = jest.fn()
const mockStoresSingle = jest.fn().mockResolvedValue({ data: { whatsapp_instance: 'store_abc' }, error: null })

const fromImpl = jest.fn((table: string) => {
  if (table === 'store_users') {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: mockMaybeSingle }),
        }),
      }),
    }
  }
  // 'stores' (e qualquer outra) — encadeado simples
  return {
    select: () => ({ eq: () => ({ single: mockStoresSingle }) }),
    update: () => ({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }),
  }
})

jest.mock('../db', () => ({
  supabase: {
    from: (table: string) => fromImpl(table),
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  },
}))

jest.mock('../auth/jwtCache', () => ({
  get: jest.fn().mockReturnValue(null),
  set: jest.fn(),
}))

jest.mock('../rag', () => ({
  addKnowledge: jest.fn(),
  deleteKnowledge: jest.fn(),
  listKnowledge: (...args: unknown[]) => mockListKnowledge(...args),
}))

jest.mock('../evolution', () => ({
  sendReply: jest.fn(),
  markAsRead: jest.fn(),
  sendPresenceOnce: jest.fn(),
  isBotSentMessage: jest.fn().mockReturnValue(false),
  checkStatus: (...args: unknown[]) => mockCheckStatus(...args),
  createOrGetQR: jest.fn(),
  disconnectInstance: jest.fn(),
}))

jest.mock('../whatsapp', () => ({
  instanceName: (id: string) => `store_${id}`,
  createOrGetQR: jest.fn(),
  checkStatus: (...args: unknown[]) => mockCheckStatus(...args),
  disconnectInstance: jest.fn(),
}))

jest.mock('../agent', () => ({
  enqueueMessage: jest.fn(),
  enqueueMedia: jest.fn(),
}))

jest.mock('../followup', () => ({ runFollowUpCycle: jest.fn() }))
jest.mock('../logger', () => ({ streamLogsToClient: jest.fn() }))

import request from 'supertest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: app } = require('../server') as { default: import('express').Express }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORE_ID = '11111111-1111-1111-1111-111111111111'
const USER_ID = '22222222-2222-2222-2222-222222222222'

function b64url(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

// JWT cosmético — apenas a parte do payload é decodificada pelo middleware.
// `getUser` é mockado, então a assinatura nunca é validada nos testes.
function makeJwt(claims: Record<string, unknown>): string {
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(claims)}.sig`
}

beforeEach(() => {
  mockGetUser.mockReset()
  mockListKnowledge.mockReset().mockResolvedValue([])
  mockCheckStatus.mockReset().mockResolvedValue({ connected: true })
  mockMaybeSingle.mockReset()
  fromImpl.mockClear()
})

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('requireAuth — extração de store_id', () => {
  it('lê store_id do claim top-level do JWT (Auth Hook habilitado)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID, user_metadata: {}, app_metadata: {} } }, error: null })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null }) // não deve ser chamado

    const token = makeJwt({ sub: USER_ID, store_id: STORE_ID })
    const res = await request(app).get('/knowledge').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(mockListKnowledge).toHaveBeenCalledWith(STORE_ID)
    expect(mockMaybeSingle).not.toHaveBeenCalled() // veio do JWT, sem fallback
  })

  it('faz fallback para store_users quando JWT não tem store_id (Auth Hook desabilitado)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID, user_metadata: {}, app_metadata: {} } }, error: null })
    mockMaybeSingle.mockResolvedValue({ data: { store_id: STORE_ID }, error: null })

    const token = makeJwt({ sub: USER_ID }) // sem store_id

    const res = await request(app).get('/knowledge').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(mockMaybeSingle).toHaveBeenCalled()
    expect(mockListKnowledge).toHaveBeenCalledWith(STORE_ID)
  })

  it('rejeita quando JWT não tem store_id e usuário não tem vínculo em store_users', async () => {
    process.env.AUTH_ENABLED = 'true' // sai do shadow mode para validar rejeição real
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID, user_metadata: {}, app_metadata: {} } }, error: null })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const token = makeJwt({ sub: USER_ID })
    const res = await request(app).get('/knowledge').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(401)
    delete process.env.AUTH_ENABLED
  })
})

describe('CORS / CORP — browser cross-origin pode ler a resposta', () => {
  it('responde com Cross-Origin-Resource-Policy: cross-origin (não bloqueia browser)', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:3000')
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin')
  })

  it('preflight OPTIONS de /knowledge libera Authorization e GET', async () => {
    const res = await request(app)
      .options('/knowledge')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization,content-type')

    expect(res.status).toBe(204)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000')
    expect(res.headers['access-control-allow-methods']).toMatch(/GET/)
    expect((res.headers['access-control-allow-headers'] ?? '').toLowerCase()).toContain('authorization')
  })
})
