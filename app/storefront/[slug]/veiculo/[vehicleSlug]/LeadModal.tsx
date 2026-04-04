'use client'

import { useState, useEffect, useRef } from 'react'

interface LeadModalProps {
  open: boolean
  onClose: () => void
  vehicleName: string
  storeId: string
  vehicleId: string
  primaryColor: string
}

type Status = 'idle' | 'sending' | 'success' | 'error'

export function LeadModal({ open, onClose, vehicleName, storeId, vehicleId, primaryColor }: LeadModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStatus('idle')
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setStatus('sending')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          vehicle_id: vehicleId,
          name: name.trim(),
          phone: phone.trim(),
          message: message.trim() || `Interesse no ${vehicleName}`,
          source: 'storefront',
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Tenho interesse</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[260px]">{vehicleName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'success' ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Mensagem enviada!</h3>
            <p className="text-sm text-gray-500 mb-5">A loja entrará em contato em breve.</p>
            <button onClick={onClose} className="text-sm font-medium px-5 py-2 rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}>
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input
                ref={firstInputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Seu nome"
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone / WhatsApp *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="(11) 99999-9999"
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mensagem (opcional)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder={`Tenho interesse no ${vehicleName}...`}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-gray-50 focus:bg-white transition-colors resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-600">Erro ao enviar. Tente novamente.</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primaryColor }}
            >
              {status === 'sending' ? 'Enviando...' : 'Enviar mensagem'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
