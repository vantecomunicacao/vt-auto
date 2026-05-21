import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeSupabaseChain, mockSupabaseModule } from '../helpers/supabase-mock'

// Stub do Next: cookies (não usado nesta rota, mas o helper de supabase importa de 'next/headers')
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: () => {} }),
}))

async function importRoute() {
  return await import('@/app/api/leads/[id]/route')
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/leads/abc', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  vi.resetModules()
})

describe('PATCH /api/leads/[id]', () => {
  it('retorna 400 quando o body não é JSON válido', async () => {
    mockSupabaseModule(makeSupabaseChain())
    const { PATCH } = await importRoute()

    const req = new Request('http://localhost/api/leads/abc', {
      method: 'PATCH',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await PATCH(req as never, makeParams('abc') as never)

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('inválido') })
  })

  it('retorna 422 para status inválido', async () => {
    mockSupabaseModule(makeSupabaseChain())
    const { PATCH } = await importRoute()

    const res = await PATCH(makeRequest({ status: 'invalid_status' }) as never, makeParams('abc') as never)

    expect(res.status).toBe(422)
    const json = await res.json() as { error: string }
    expect(json.error).toMatch(/Status inválido/)
  })

  it('retorna 400 quando nem status nem ai_active são informados', async () => {
    mockSupabaseModule(makeSupabaseChain())
    const { PATCH } = await importRoute()

    const res = await PATCH(makeRequest({}) as never, makeParams('abc') as never)

    expect(res.status).toBe(400)
  })

  it('atualiza status com sucesso', async () => {
    const chain = makeSupabaseChain([{ data: null, error: null }])
    mockSupabaseModule(chain)
    const { PATCH } = await importRoute()

    const res = await PATCH(makeRequest({ status: 'qualified' }) as never, makeParams('abc') as never)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'qualified' }))
    expect(chain.eq).toHaveBeenCalledWith('id', 'abc')
  })

  it('limpa ai_paused_reason quando ai_active vira true', async () => {
    const chain = makeSupabaseChain([{ data: null, error: null }])
    mockSupabaseModule(chain)
    const { PATCH } = await importRoute()

    const res = await PATCH(makeRequest({ ai_active: true }) as never, makeParams('abc') as never)

    expect(res.status).toBe(200)
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      ai_active: true,
      ai_paused_reason: null,
    }))
  })

  it('NÃO limpa ai_paused_reason quando ai_active vira false', async () => {
    const chain = makeSupabaseChain([{ data: null, error: null }])
    mockSupabaseModule(chain)
    const { PATCH } = await importRoute()

    await PATCH(makeRequest({ ai_active: false }) as never, makeParams('abc') as never)

    const updateArg = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>
    expect(updateArg.ai_active).toBe(false)
    expect(updateArg).not.toHaveProperty('ai_paused_reason')
  })

  it('retorna 500 quando Supabase falha', async () => {
    mockSupabaseModule(makeSupabaseChain([
      { data: null, error: { message: 'conn refused' } },
    ]))
    const { PATCH } = await importRoute()

    const res = await PATCH(makeRequest({ status: 'qualified' }) as never, makeParams('abc') as never)

    expect(res.status).toBe(500)
    expect(await res.json()).toMatchObject({ error: 'conn refused' })
  })
})

describe('DELETE /api/leads/[id]', () => {
  it('deleta o lead com sucesso (sem phone: não faz cascade)', async () => {
    // 1º select retorna lead sem phone → pula cascade; 2º (await) é o delete do lead
    const chain = makeSupabaseChain([
      { data: { store_id: 's1', phone: null }, error: null },
      { data: null, error: null },
    ])
    mockSupabaseModule(chain)
    const { DELETE } = await importRoute()

    const req = new Request('http://localhost/api/leads/abc', { method: 'DELETE' })
    const res = await DELETE(req as never, makeParams('abc') as never)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'abc')
  })

  it('faz cascade: apaga conversas e logs do telefone antes de remover o lead', async () => {
    const chain = makeSupabaseChain([
      { data: { store_id: 's1', phone: '5511999990000' }, error: null }, // select store_id/phone
      { data: null, error: null }, // delete agent_conversations
      { data: null, error: null }, // delete agent_logs
      { data: null, error: null }, // delete lead
    ])
    mockSupabaseModule(chain)
    const { DELETE } = await importRoute()

    const req = new Request('http://localhost/api/leads/abc', { method: 'DELETE' })
    const res = await DELETE(req as never, makeParams('abc') as never)

    expect(res.status).toBe(200)
    expect(chain.from).toHaveBeenCalledWith('agent_conversations')
    expect(chain.from).toHaveBeenCalledWith('agent_logs')
    expect(chain.eq).toHaveBeenCalledWith('phone', '5511999990000')
  })

  it('retorna 500 quando o delete do lead falha', async () => {
    mockSupabaseModule(makeSupabaseChain([
      { data: { store_id: 's1', phone: null }, error: null }, // select
      { data: null, error: { message: 'fk violation' } },     // delete lead falha
    ]))
    const { DELETE } = await importRoute()

    const req = new Request('http://localhost/api/leads/abc', { method: 'DELETE' })
    const res = await DELETE(req as never, makeParams('abc') as never)

    expect(res.status).toBe(500)
    expect(await res.json()).toMatchObject({ error: 'fk violation' })
  })
})

describe('DELETE /api/leads/[id]/conversation', () => {
  async function importConvRoute() {
    return await import('@/app/api/leads/[id]/conversation/route')
  }

  it('zera mensagens, presented_vehicles e logs do lead', async () => {
    const chain = makeSupabaseChain([
      { data: { store_id: 's1', phone: '5511999990000' }, error: null }, // select lead
      { data: null, error: null }, // delete agent_conversations
      { data: null, error: null }, // update presented_vehicles
      { data: null, error: null }, // delete agent_logs
    ])
    mockSupabaseModule(chain)
    const { DELETE } = await importConvRoute()

    const req = new Request('http://localhost/api/leads/abc/conversation', { method: 'DELETE' })
    const res = await DELETE(req as never, makeParams('abc') as never)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(chain.from).toHaveBeenCalledWith('agent_conversations')
    expect(chain.update).toHaveBeenCalledWith({ presented_vehicles: {} })
    expect(chain.from).toHaveBeenCalledWith('agent_logs')
  })

  it('retorna 404 quando o lead não existe', async () => {
    mockSupabaseModule(makeSupabaseChain([
      { data: null, error: { message: 'not found' } },
    ]))
    const { DELETE } = await importConvRoute()

    const req = new Request('http://localhost/api/leads/abc/conversation', { method: 'DELETE' })
    const res = await DELETE(req as never, makeParams('abc') as never)

    expect(res.status).toBe(404)
  })

  it('retorna 400 quando o lead não tem telefone', async () => {
    mockSupabaseModule(makeSupabaseChain([
      { data: { store_id: 's1', phone: null }, error: null },
    ]))
    const { DELETE } = await importConvRoute()

    const req = new Request('http://localhost/api/leads/abc/conversation', { method: 'DELETE' })
    const res = await DELETE(req as never, makeParams('abc') as never)

    expect(res.status).toBe(400)
  })
})
