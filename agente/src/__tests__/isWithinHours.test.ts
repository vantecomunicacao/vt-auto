jest.mock('../db', () => ({ supabase: {} }))
jest.mock('../evolution', () => ({
  sendMessage: jest.fn(),
  sendImage: jest.fn(),
  startTyping: jest.fn(() => () => {}),
  downloadMedia: jest.fn(),
  isBotSentMessage: jest.fn(),
}))
jest.mock('openai', () => ({ default: jest.fn() }))

import { isWithinHours } from '../agent'

// Nomes dos dias em inglês no formato usado por Date
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function todayKey(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return DAYS[now.getDay()]
}

function hourMinuteNow(): { h: number; m: number } {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return { h: now.getHours(), m: now.getMinutes() }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

describe('isWithinHours', () => {
  it('retorna true quando agentHours é null (sem restrição)', () => {
    expect(isWithinHours(null)).toBe(true)
  })

  it('retorna true quando horário atual está dentro da janela', () => {
    const key = todayKey()
    const hours: Record<string, { start: string; end: string }> = {
      [key]: { start: '00:00', end: '23:59' },
    }
    expect(isWithinHours(hours)).toBe(true)
  })

  it('retorna false quando dia de hoje não está configurado', () => {
    // Cria config sem o dia de hoje
    const key = todayKey()
    const allDays = DAYS.filter(d => d !== key)
    const hours: Record<string, { start: string; end: string }> = {}
    allDays.forEach(d => { hours[d] = { start: '00:00', end: '23:59' } })
    expect(isWithinHours(hours)).toBe(false)
  })

  it('retorna false quando horário atual é anterior ao início', () => {
    const key = todayKey()
    const { h } = hourMinuteNow()
    // Define janela que começa daqui a 2h
    const startH = Math.min(h + 2, 23)
    const endH = Math.min(h + 4, 23)
    const hours: Record<string, { start: string; end: string }> = {
      [key]: { start: `${pad(startH)}:00`, end: `${pad(endH)}:59` },
    }
    if (h + 2 > 23) return // pula se não for possível montar o cenário no horário atual
    expect(isWithinHours(hours)).toBe(false)
  })

  it('retorna false quando horário atual é posterior ao fim', () => {
    const key = todayKey()
    const { h } = hourMinuteNow()
    if (h < 2) return // pula se não der para montar janela já encerrada
    const endH = h - 1
    const hours: Record<string, { start: string; end: string }> = {
      [key]: { start: '00:00', end: `${pad(endH)}:00` },
    }
    expect(isWithinHours(hours)).toBe(false)
  })

  it('retorna true exatamente no início da janela (inclusive)', () => {
    const key = todayKey()
    const { h, m } = hourMinuteNow()
    const hours: Record<string, { start: string; end: string }> = {
      [key]: { start: `${pad(h)}:${pad(m)}`, end: '23:59' },
    }
    expect(isWithinHours(hours)).toBe(true)
  })

  it('retorna true exatamente no fim da janela (inclusive)', () => {
    const key = todayKey()
    const { h, m } = hourMinuteNow()
    const hours: Record<string, { start: string; end: string }> = {
      [key]: { start: '00:00', end: `${pad(h)}:${pad(m)}` },
    }
    expect(isWithinHours(hours)).toBe(true)
  })
})
