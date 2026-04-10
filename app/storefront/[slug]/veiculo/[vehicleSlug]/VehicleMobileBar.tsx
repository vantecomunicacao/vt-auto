'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  waLink: string | null
  price: number | null
  primaryColor: string
  /** ID do elemento sidebar — quando ele entrar na tela, a barra some */
  sidebarId: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

function WaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.847L.057 23.852a.5.5 0 0 0 .625.607l6.219-1.63A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a10 10 0 0 1-5.194-1.449l-.39-.23-3.688.968.987-3.594-.243-.38A10 10 0 1 1 12 22z" />
    </svg>
  )
}

export function VehicleMobileBar({ waLink, price, primaryColor, sidebarId }: Props) {
  const [visible, setVisible] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const sidebar = document.getElementById(sidebarId)
    if (!sidebar) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Quando sidebar está visível na tela, esconde a barra
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0.2 }
    )

    observerRef.current.observe(sidebar)
    return () => observerRef.current?.disconnect()
  }, [sidebarId])

  if (!waLink) return null

  return (
    <div
      className={`
        lg:hidden fixed bottom-0 left-0 right-0 z-50
        bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]
        px-4 py-3 flex items-center gap-3
        transition-transform duration-300
        ${visible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      {/* Preço */}
      <div className="flex-1 min-w-0">
        {price ? (
          <p className="text-xl font-extrabold leading-tight truncate" style={{ color: primaryColor }}>
            {formatPrice(price)}
          </p>
        ) : (
          <p className="text-sm font-semibold text-gray-500">Consulte o preço</p>
        )}
      </div>

      {/* Botão WhatsApp */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors flex-shrink-0"
      >
        <WaIcon />
        WhatsApp
      </a>
    </div>
  )
}
