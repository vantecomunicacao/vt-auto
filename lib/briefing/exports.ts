'use client'

import type { Briefing } from '@/lib/schemas/briefing'
import { renderBriefingHtml, renderBriefingText } from './render'

function safeFileName(b: Briefing): string {
  const base = `briefing-${b.store_name}`
  return base
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const LOGO_URL = '/brand/cargrow-logo-light.png'

/** Abre uma janela só com o briefing e dispara o diálogo de impressão (usuário escolhe "Salvar como PDF"). */
export function openPrintWindow(b: Briefing): void {
  const html = renderBriefingHtml(b, { logoUrl: window.location.origin + LOGO_URL })
  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) {
    alert('Não foi possível abrir a janela de impressão. Verifique se o navegador bloqueou o popup.')
    return
  }
  win.document.write(html)
  win.document.close()
  // Aguarda o load (incluindo logo) antes de imprimir
  win.onload = () => {
    win.focus()
    win.print()
  }
}

/** Baixa o briefing como .doc — Word abre HTML com formatação preservada. */
export function downloadDoc(b: Briefing): void {
  const html = renderBriefingHtml(b, { logoUrl: window.location.origin + LOGO_URL })
  // Word reconhece o preâmbulo MHTML/Word — basta servir como application/msword
  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  triggerDownload(blob, `${safeFileName(b)}.doc`)
}

/** Monta o link wa.me com o briefing em texto. Número opcional — se vazio, abre o seletor de contatos. */
export function buildWhatsAppUrl(b: Briefing, phone?: string): string {
  const text = renderBriefingText(b)
  const encoded = encodeURIComponent(text)
  const cleanPhone = phone?.replace(/\D/g, '')
  if (cleanPhone && cleanPhone.length >= 10) {
    const withCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    return `https://wa.me/${withCountry}?text=${encoded}`
  }
  return `https://wa.me/?text=${encoded}`
}

export function shareWhatsApp(b: Briefing, phone?: string): void {
  window.open(buildWhatsAppUrl(b, phone), '_blank', 'noopener,noreferrer')
}
