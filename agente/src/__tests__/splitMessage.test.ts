// Mock obrigatório antes de importar o módulo (que importa supabase/openai no topo)
jest.mock('../db', () => ({ supabase: {} }))
jest.mock('../evolution', () => ({
  sendMessage: jest.fn(),
  sendImage: jest.fn(),
  startTyping: jest.fn(() => () => {}),
  downloadMedia: jest.fn(),
  isBotSentMessage: jest.fn(),
}))
jest.mock('openai', () => ({ default: jest.fn() }))

import { splitMessage, splitAtWords } from '../agent'

describe('splitAtWords', () => {
  it('retorna texto inteiro quando menor que maxLen', () => {
    expect(splitAtWords('ola mundo', 50)).toEqual(['ola mundo'])
  })

  it('quebra por palavra quando excede maxLen', () => {
    const result = splitAtWords('um dois tres quatro cinco', 10)
    expect(result.every(chunk => chunk.length <= 10 || !chunk.includes(' '))).toBe(true)
    expect(result.join(' ')).toBe('um dois tres quatro cinco')
  })

  it('não perde palavras na quebra', () => {
    const text = 'Esta é uma frase longa que precisa ser quebrada em partes menores para o WhatsApp'
    const result = splitAtWords(text, 20)
    expect(result.join(' ')).toBe(text)
  })

  it('lida com palavra única maior que maxLen (não quebra a palavra)', () => {
    const result = splitAtWords('supercalifragilístico', 5)
    expect(result).toEqual(['supercalifragilístico'])
  })
})

describe('splitMessage', () => {
  it('retorna texto curto como chunk único', () => {
    expect(splitMessage('Olá, como posso ajudar?', 300)).toEqual(['Olá, como posso ajudar?'])
  })

  it('divide por parágrafo duplo', () => {
    const text = 'Primeiro parágrafo.\n\nSegundo parágrafo.'
    const result = splitMessage(text, 300)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('Primeiro parágrafo.')
    expect(result[1]).toBe('Segundo parágrafo.')
  })

  it('divide parágrafo longo por sentença', () => {
    const text = 'Primeira frase. Segunda frase. Terceira frase muito longa que ultrapassa o limite.'
    const result = splitMessage(text, 30)
    expect(result.length).toBeGreaterThan(1)
    // Nenhum chunk vazio
    expect(result.every(c => c.trim().length > 0)).toBe(true)
  })

  it('não perde conteúdo ao dividir', () => {
    const text = 'Parágrafo um completo.\n\nParágrafo dois completo.\n\nParágrafo três completo.'
    const result = splitMessage(text, 300)
    expect(result).toHaveLength(3)
  })

  it('retorna o texto original quando não consegue dividir', () => {
    const text = 'texto simples'
    expect(splitMessage(text, 300)).toEqual(['texto simples'])
  })

  it('divide por linha simples dentro de parágrafo', () => {
    const text = 'Linha um\nLinha dois\nLinha tres'
    const result = splitMessage(text, 12)
    expect(result.every(c => c.trim().length > 0)).toBe(true)
    expect(result.join('\n').replace(/\s+/g, ' ')).toContain('Linha')
  })

  it('remove parágrafos em branco', () => {
    const text = 'Parágrafo um.\n\n\n\nParágrafo dois.'
    const result = splitMessage(text, 300)
    expect(result).toHaveLength(2)
  })

  it('remove espaços extras no início/fim de cada chunk', () => {
    const text = '  Parágrafo com espaços.  \n\n  Outro parágrafo.  '
    const result = splitMessage(text, 300)
    expect(result[0]).toBe('Parágrafo com espaços.')
    expect(result[1]).toBe('Outro parágrafo.')
  })
})
