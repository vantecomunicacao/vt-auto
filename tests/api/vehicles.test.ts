import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: () => {} }),
}))

type Result = { data: unknown; error: { message: string } | null }

interface MockOpts {
  /** Usuário logado retornado por `supabase.auth.getUser()`. `null` simula não-autenticado. */
  authUser?: { id: string } | null
  /** Linha de store_users encontrada (ou null se a query devolve vazia). */
  storeUser?: { store_id: string; role?: string } | null
  /**
   * Resultados que serão consumidos por `.single()` / `.then()` na ordem das chamadas
   * que aparecem no fluxo da rota *depois* da resolução do store_user.
   */
  results?: Result[]
  /** Lista de imagens retornada na busca por vehicle_id (usado no DELETE). */
  vehicleImages?: { storage_path: string }[]
  /** Resultado do remove() do Storage. */
  storageRemoveResult?: Result
}

function setupMocks(opts: MockOpts = {}) {
  const {
    authUser = { id: 'user-1' },
    storeUser = { store_id: 'store-1', role: 'owner' },
    results = [],
    vehicleImages = [],
    storageRemoveResult = { data: null, error: null },
  } = opts

  const queue = [...results]
  const nextResult = (): Result => queue.shift() ?? { data: null, error: null }

  // Cliente "user"
  const userClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: authUser }, error: null }),
    },
  }

  // Cliente "admin"
  const adminClient: Record<string, unknown> = {}
  const chainable = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'order']
  chainable.forEach(m => { adminClient[m] = vi.fn().mockReturnValue(adminClient) })

  // .single() é multifuncional:
  //   1. resolve a busca do store_users (primeiro acesso)
  //   2. depois resolve buscas de veículo (DELETE → vehicle, POST → insert.select.single)
  let singleCallCount = 0
  adminClient.single = vi.fn().mockImplementation(() => {
    singleCallCount += 1
    if (singleCallCount === 1) {
      return Promise.resolve({ data: storeUser, error: null })
    }
    return Promise.resolve(nextResult())
  })

  // Quando o caller faz `await chain` direto (sem single) — usado pelo GET (order)
  // e por updates sem .select().single() (status route).
  // Cada `.then` consome o próximo resultado da fila.
  adminClient.then = vi.fn().mockImplementation((onFulfilled: (v: Result) => unknown) =>
    Promise.resolve(nextResult()).then(onFulfilled)
  )

  // Storage: remove() retorna { data, error }
  const storageBucket = {
    remove: vi.fn().mockResolvedValue(storageRemoveResult),
  }
  adminClient.storage = {
    from: vi.fn().mockReturnValue(storageBucket),
  }

  // Sobrescreve a busca de vehicle_images: precisa retornar uma lista
  // (não usa .single(), e o caller faz await na chain após .eq()).
  // Atalho: quando from('vehicle_images') é chamado, retorna um chain dedicado.
  const originalFrom = adminClient.from as ReturnType<typeof vi.fn>
  originalFrom.mockImplementation((table: string) => {
    if (table === 'vehicle_images') {
      const imagesChain: Record<string, unknown> = {}
      ;['select', 'eq'].forEach(m => { imagesChain[m] = vi.fn().mockReturnValue(imagesChain) })
      imagesChain.then = vi.fn().mockImplementation((onFulfilled: (v: Result) => unknown) =>
        Promise.resolve({ data: vehicleImages, error: null }).then(onFulfilled)
      )
      return imagesChain
    }
    return adminClient
  })

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue(userClient),
    createAdminClient: vi.fn().mockReturnValue(adminClient),
  }))

  return { userClient, adminClient, storageBucket }
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeReq(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
  })
}

const VALID_VEHICLE = {
  brand: 'Honda',
  model: 'Civic',
  year_model: 2023,
  year_manuf: 2023,
  color: 'Preto',
  fuel: 'flex',
  transmission: 'automatic',
  mileage: 0,
  price: 120000,
}

beforeEach(() => {
  vi.resetModules()
})

// ── GET /api/vehicles ────────────────────────────────────────────────────────

describe('GET /api/vehicles', () => {
  it('401 quando não autenticado', async () => {
    setupMocks({ authUser: null })
    const { GET } = await import('@/app/api/vehicles/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('404 quando usuário não tem loja vinculada', async () => {
    setupMocks({ storeUser: null })
    const { GET } = await import('@/app/api/vehicles/route')
    const res = await GET()
    expect(res.status).toBe(404)
  })

  it('200 e devolve a lista de veículos', async () => {
    const vehicles = [{ id: 'v1', brand: 'Honda', model: 'Civic' }]
    const { adminClient } = setupMocks({ results: [{ data: vehicles, error: null }] })
    const { GET } = await import('@/app/api/vehicles/route')

    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(vehicles)
    expect(adminClient.from).toHaveBeenCalledWith('vehicles')
    expect(adminClient.eq).toHaveBeenCalledWith('store_id', 'store-1')
  })

  it('500 quando Supabase falha', async () => {
    setupMocks({ results: [{ data: null, error: { message: 'db error' } }] })
    const { GET } = await import('@/app/api/vehicles/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ── POST /api/vehicles ───────────────────────────────────────────────────────

describe('POST /api/vehicles', () => {
  it('401 quando não autenticado', async () => {
    setupMocks({ authUser: null })
    const { POST } = await import('@/app/api/vehicles/route')
    const res = await POST(makeReq('http://x/api/vehicles', 'POST', VALID_VEHICLE) as never)
    expect(res.status).toBe(401)
  })

  it('422 quando payload viola schema', async () => {
    setupMocks({})
    const { POST } = await import('@/app/api/vehicles/route')
    const res = await POST(makeReq('http://x/api/vehicles', 'POST', { brand: '' }) as never)
    expect(res.status).toBe(422)
  })

  it('201 com id retornado quando insere com sucesso', async () => {
    const { adminClient } = setupMocks({
      results: [{ data: { id: 'new-vehicle-id' }, error: null }],
    })
    const { POST } = await import('@/app/api/vehicles/route')

    const res = await POST(makeReq('http://x/api/vehicles', 'POST', VALID_VEHICLE) as never)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 'new-vehicle-id' })
    expect(adminClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({ brand: 'Honda', model: 'Civic', store_id: 'store-1' })
    )
  })

  it('500 quando insert falha', async () => {
    setupMocks({
      results: [{ data: null, error: { message: 'duplicate' } }],
    })
    const { POST } = await import('@/app/api/vehicles/route')
    const res = await POST(makeReq('http://x/api/vehicles', 'POST', VALID_VEHICLE) as never)
    expect(res.status).toBe(500)
  })
})

// ── PATCH /api/vehicles/[id] ─────────────────────────────────────────────────

describe('PATCH /api/vehicles/[id]', () => {
  it('401 quando não autenticado', async () => {
    setupMocks({ authUser: null })
    const { PATCH } = await import('@/app/api/vehicles/[id]/route')
    const res = await PATCH(makeReq('http://x', 'PATCH', VALID_VEHICLE) as never, makeParams('v1') as never)
    expect(res.status).toBe(401)
  })

  it('422 com payload inválido', async () => {
    setupMocks({})
    const { PATCH } = await import('@/app/api/vehicles/[id]/route')
    const res = await PATCH(makeReq('http://x', 'PATCH', { brand: '' }) as never, makeParams('v1') as never)
    expect(res.status).toBe(422)
  })

  it('200 quando update sucesso, filtrando por store_id (anti-cross-tenant)', async () => {
    const { adminClient } = setupMocks({
      results: [{ data: { id: 'v1' }, error: null }],
    })
    const { PATCH } = await import('@/app/api/vehicles/[id]/route')

    const res = await PATCH(makeReq('http://x', 'PATCH', VALID_VEHICLE) as never, makeParams('v1') as never)
    expect(res.status).toBe(200)
    // Confirma que o update usa AMBOS eq(id) e eq(store_id), garantindo isolamento entre lojas
    expect(adminClient.eq).toHaveBeenCalledWith('id', 'v1')
    expect(adminClient.eq).toHaveBeenCalledWith('store_id', 'store-1')
  })
})

// ── DELETE /api/vehicles/[id] ────────────────────────────────────────────────

describe('DELETE /api/vehicles/[id]', () => {
  it('401 quando não autenticado', async () => {
    setupMocks({ authUser: null })
    const { DELETE } = await import('@/app/api/vehicles/[id]/route')
    const res = await DELETE(makeReq('http://x', 'DELETE') as never, makeParams('v1') as never)
    expect(res.status).toBe(401)
  })

  it('403 quando usuário não é owner', async () => {
    setupMocks({ storeUser: { store_id: 'store-1', role: 'staff' } })
    const { DELETE } = await import('@/app/api/vehicles/[id]/route')
    const res = await DELETE(makeReq('http://x', 'DELETE') as never, makeParams('v1') as never)
    expect(res.status).toBe(403)
  })

  it('404 quando veículo não existe na loja', async () => {
    // 1ª single → store_user; 2ª single → vehicle (null)
    setupMocks({ results: [{ data: null, error: null }] })
    const { DELETE } = await import('@/app/api/vehicles/[id]/route')
    const res = await DELETE(makeReq('http://x', 'DELETE') as never, makeParams('v1') as never)
    expect(res.status).toBe(404)
  })

  it('200 e remove fotos do Storage quando há imagens', async () => {
    const { adminClient, storageBucket } = setupMocks({
      // 2ª single → vehicle encontrado; await após delete → ok
      results: [
        { data: { id: 'v1' }, error: null }, // vehicle.single
        { data: null, error: null },         // delete final
      ],
      vehicleImages: [
        { storage_path: 'stores/x/v1/a.jpg' },
        { storage_path: 'stores/x/v1/b.jpg' },
      ],
    })
    const { DELETE } = await import('@/app/api/vehicles/[id]/route')

    const res = await DELETE(makeReq('http://x', 'DELETE') as never, makeParams('v1') as never)
    expect(res.status).toBe(200)
    expect(storageBucket.remove).toHaveBeenCalledWith([
      'stores/x/v1/a.jpg',
      'stores/x/v1/b.jpg',
    ])
    expect(adminClient.delete).toHaveBeenCalled()
  })

  it('200 sem chamar Storage quando não há imagens', async () => {
    const { storageBucket } = setupMocks({
      results: [
        { data: { id: 'v1' }, error: null },
        { data: null, error: null },
      ],
      vehicleImages: [],
    })
    const { DELETE } = await import('@/app/api/vehicles/[id]/route')

    const res = await DELETE(makeReq('http://x', 'DELETE') as never, makeParams('v1') as never)
    expect(res.status).toBe(200)
    expect(storageBucket.remove).not.toHaveBeenCalled()
  })
})

// ── PATCH /api/vehicles/[id]/status ──────────────────────────────────────────

describe('PATCH /api/vehicles/[id]/status', () => {
  it('401 quando não autenticado', async () => {
    setupMocks({ authUser: null })
    const { PATCH } = await import('@/app/api/vehicles/[id]/status/route')
    const res = await PATCH(makeReq('http://x', 'PATCH', { status: 'sold' }) as never, makeParams('v1') as never)
    expect(res.status).toBe(401)
  })

  it('422 quando status fora do enum', async () => {
    setupMocks({})
    const { PATCH } = await import('@/app/api/vehicles/[id]/status/route')
    const res = await PATCH(makeReq('http://x', 'PATCH', { status: 'banana' }) as never, makeParams('v1') as never)
    expect(res.status).toBe(422)
  })

  it('403 quando staff tenta marcar como sold', async () => {
    setupMocks({ storeUser: { store_id: 'store-1', role: 'staff' } })
    const { PATCH } = await import('@/app/api/vehicles/[id]/status/route')
    const res = await PATCH(makeReq('http://x', 'PATCH', { status: 'sold' }) as never, makeParams('v1') as never)
    expect(res.status).toBe(403)
  })

  it('200 quando staff troca para available (não-sold)', async () => {
    setupMocks({
      storeUser: { store_id: 'store-1', role: 'staff' },
      results: [{ data: null, error: null }],
    })
    const { PATCH } = await import('@/app/api/vehicles/[id]/status/route')
    const res = await PATCH(makeReq('http://x', 'PATCH', { status: 'available' }) as never, makeParams('v1') as never)
    expect(res.status).toBe(200)
  })

  it('200 quando owner marca como sold', async () => {
    const { adminClient } = setupMocks({
      results: [{ data: null, error: null }],
    })
    const { PATCH } = await import('@/app/api/vehicles/[id]/status/route')

    const res = await PATCH(makeReq('http://x', 'PATCH', { status: 'sold' }) as never, makeParams('v1') as never)
    expect(res.status).toBe(200)
    expect(adminClient.update).toHaveBeenCalledWith({ status: 'sold' })
    expect(adminClient.eq).toHaveBeenCalledWith('id', 'v1')
    expect(adminClient.eq).toHaveBeenCalledWith('store_id', 'store-1')
  })
})
