// Testa o handler de mídia não suportada no webhook do servidor

const mockSendReply = jest.fn().mockResolvedValue(undefined)
const mockMarkAsRead = jest.fn().mockResolvedValue(undefined)
const mockSendPresenceOnce = jest.fn().mockResolvedValue(undefined)
const mockEnqueueMessage = jest.fn()
const mockEnqueueMedia = jest.fn()
const mockIsBotSentMessage = jest.fn().mockReturnValue(false)

jest.mock('../evolution', () => ({
  sendReply: (...args: unknown[]) => mockSendReply(...args),
  markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
  sendPresenceOnce: (...args: unknown[]) => mockSendPresenceOnce(...args),
  isBotSentMessage: (...args: unknown[]) => mockIsBotSentMessage(...args),
  checkStatus: jest.fn(),
  createOrGetQR: jest.fn(),
  disconnectInstance: jest.fn(),
}))

jest.mock('../agent', () => ({
  enqueueMessage: (...args: unknown[]) => mockEnqueueMessage(...args),
  enqueueMedia: (...args: unknown[]) => mockEnqueueMedia(...args),
}))

jest.mock('../whatsapp', () => ({
  instanceName: (id: string) => `store_${id}`,
  createOrGetQR: jest.fn(),
  checkStatus: jest.fn(),
  disconnectInstance: jest.fn(),
}))

jest.mock('../rag', () => ({
  addKnowledge: jest.fn(),
  deleteKnowledge: jest.fn(),
  listKnowledge: jest.fn(),
}))

jest.mock('../followup', () => ({
  runFollowUpCycle: jest.fn(),
}))

jest.mock('../logger', () => ({
  streamLogsToClient: jest.fn(),
}))

jest.mock('../db', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnThis(),
  },
}))

import request from 'supertest'

// Testes com delay real de ~4.5s por caso — timeout aumentado
jest.setTimeout(60000)

// Importa o app depois dos mocks
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: app } = require('../server') as { default: import('express').Express }

// ─── Helpers ─────────────────────────────────────────────────────────────────

let msgCounter = 0
function makeWebhookPayload(messageType: string, extras: Record<string, unknown> = {}) {
  return {
    event: 'messages_upsert',
    instance: 'store_abc',
    data: {
      key: {
        remoteJid: '5511999990000@s.whatsapp.net',
        fromMe: false,
        id: `MSG-${++msgCounter}`,  // ID único por teste — evita bloqueio da deduplicação
      },
      messageType,
      pushName: 'Teste',
      message: {},
      ...extras,
    },
  }
}

beforeEach(() => {
  mockSendReply.mockReset()
  mockSendReply.mockResolvedValue(undefined)
  mockMarkAsRead.mockReset()
  mockSendPresenceOnce.mockReset()
  mockSendPresenceOnce.mockResolvedValue(undefined)
  mockEnqueueMessage.mockReset()
  mockEnqueueMedia.mockReset()
})

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('webhook — mídia não suportada', () => {
  const UNSUPPORTED: Array<[string, string]> = [
    ['stickerMessage', 'figurinha'],
    ['videoMessage', 'vídeo'],
    ['documentMessage', 'documento/PDF'],
    ['documentWithCaptionMessage', 'documento/PDF'],
    ['contactMessage', 'contato'],
    ['contactsArrayMessage', 'contato'],
    ['locationMessage', 'localização'],
    ['liveLocationMessage', 'localização'],
    ['pollCreationMessage', 'enquete'],
  ]

  it.each(UNSUPPORTED)('responde com sendReply para %s (%s)', async (messageType) => {
    await request(app)
      .post('/webhook')
      .send(makeWebhookPayload(messageType))
      .expect(200)

    // Aguarda o delay humanizado (2500ms mín + até 1500ms aleatório)
    await new Promise(r => setTimeout(r, 4500))

    expect(mockSendReply).toHaveBeenCalledTimes(1)
    expect(mockSendReply).toHaveBeenCalledWith(
      'store_abc',
      '5511999990000',
      '5511999990000@s.whatsapp.net',
      expect.stringMatching(/^MSG-/),
      expect.stringContaining('não consigo receber esse tipo de mídia'),
    )
  })

  it('NÃO chama enqueueMessage para mídia não suportada', async () => {
    await request(app)
      .post('/webhook')
      .send(makeWebhookPayload('stickerMessage'))
      .expect(200)

    await new Promise(r => setTimeout(r, 4500))

    expect(mockEnqueueMessage).not.toHaveBeenCalled()
    expect(mockEnqueueMedia).not.toHaveBeenCalled()
  })

  it('ignora reactionMessage silenciosamente (sem sendReply)', async () => {
    await request(app)
      .post('/webhook')
      .send(makeWebhookPayload('reactionMessage'))
      .expect(200)

    await jest.runAllTimersAsync()

    expect(mockSendReply).not.toHaveBeenCalled()
    expect(mockEnqueueMessage).not.toHaveBeenCalled()
  })

  it('ignora pollUpdateMessage silenciosamente (sem sendReply)', async () => {
    await request(app)
      .post('/webhook')
      .send(makeWebhookPayload('pollUpdateMessage'))
      .expect(200)

    await jest.runAllTimersAsync()

    expect(mockSendReply).not.toHaveBeenCalled()
  })
})

describe('webhook — mídias suportadas não são afetadas', () => {
  it('texto ainda vai para enqueueMessage', async () => {
    const payload = makeWebhookPayload('conversation', {
      message: { conversation: 'Oi, tudo bem?' },
    })
    await request(app).post('/webhook').send(payload).expect(200)
    expect(mockEnqueueMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'Oi, tudo bem?' }))
    expect(mockSendReply).not.toHaveBeenCalled()
  })

  it('áudio ainda vai para enqueueMedia', async () => {
    const payload = makeWebhookPayload('audioMessage')
    await request(app).post('/webhook').send(payload).expect(200)
    await jest.runAllTimersAsync()
    expect(mockEnqueueMedia).toHaveBeenCalledWith(expect.objectContaining({ mediaType: 'audio' }))
    expect(mockSendReply).not.toHaveBeenCalled()
  })

  it('imagem ainda vai para enqueueMedia', async () => {
    const payload = makeWebhookPayload('imageMessage')
    await request(app).post('/webhook').send(payload).expect(200)
    await jest.runAllTimersAsync()
    expect(mockEnqueueMedia).toHaveBeenCalledWith(expect.objectContaining({ mediaType: 'image' }))
    expect(mockSendReply).not.toHaveBeenCalled()
  })
})
