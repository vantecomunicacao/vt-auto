import { EventEmitter } from 'events'
import type { Response } from 'express'
import { supabase } from './db'

export interface LogEntry {
  store_id: string
  session_id: string
  phone: string
  step: string
  status: 'ok' | 'error'
  data?: Record<string, unknown>
  duration_ms?: number
  created_at?: string
}

const emitter = new EventEmitter()
emitter.setMaxListeners(100)

export async function logStep(entry: LogEntry): Promise<void> {
  const full = { ...entry, created_at: new Date().toISOString() }

  // Persiste no banco
  const { error } = await supabase.from('agent_logs').insert(full)
  if (error) console.error('[logger] Erro ao salvar log:', error.message)

  // Emite para clientes SSE conectados
  emitter.emit(`store:${entry.store_id}`, full)
}

export function streamLogsToClient(storeId: string, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  res.write(': connected\n\n')

  const handler = (log: LogEntry) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`)
  }

  emitter.on(`store:${storeId}`, handler)

  res.on('close', () => {
    emitter.off(`store:${storeId}`, handler)
  })
}
