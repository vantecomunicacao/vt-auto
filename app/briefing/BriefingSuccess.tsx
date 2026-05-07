'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, FileText, FileType, MessageCircle, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { Briefing } from '@/lib/schemas/briefing'
import { downloadDoc, openPrintWindow, shareWhatsApp } from '@/lib/briefing/exports'

export function BriefingSuccess({ briefing }: { briefing: Briefing }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [phone, setPhone] = useState('')

  function submitShare() {
    shareWhatsApp(briefing, phone)
    setShareOpen(false)
    setPhone('')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <Image
            src="/brand/cargrow-logo-light.png"
            alt="CarGrow"
            width={120}
            height={32}
            className="h-7 w-auto dark:hidden"
            priority
          />
          <Image
            src="/brand/cargrow-logo-dark.png"
            alt="CarGrow"
            width={120}
            height={32}
            className="hidden h-7 w-auto dark:block"
            priority
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border bg-background p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="text-2xl font-bold">Briefing recebido!</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Obrigado, <strong>{briefing.responsible_name.split(' ')[0]}</strong>. Recebemos as informações da{' '}
            <strong>{briefing.store_name}</strong> e nosso time entrará em contato em breve para iniciar a configuração.
          </p>

          <div className="mx-auto mt-8 max-w-md text-left">
            <p className="mb-3 text-sm font-medium">Quer uma cópia? Escolha o formato:</p>
            <div className="grid gap-2">
              <ExportButton
                icon={<FileText size={16} />}
                title="Baixar como PDF"
                description="Abre o diálogo de impressão — escolha 'Salvar como PDF'"
                onClick={() => openPrintWindow(briefing)}
              />
              <ExportButton
                icon={<FileType size={16} />}
                title="Baixar como Word (.doc)"
                description="Abre no Microsoft Word com formatação preservada"
                onClick={() => downloadDoc(briefing)}
              />
              <ExportButton
                icon={<MessageCircle size={16} />}
                title="Compartilhar no WhatsApp"
                description="Envia o briefing em texto para quem você quiser"
                onClick={() => setShareOpen(true)}
              />
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Salvamos uma cópia automaticamente — você não precisa baixar agora.
        </p>
      </main>

      {/* Modal compartilhar WhatsApp */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Compartilhar no WhatsApp</h3>
              <Button variant="ghost" size="icon" onClick={() => setShareOpen(false)} aria-label="Fechar">
                <X size={16} />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="share-phone">Para qual número enviar?</Label>
                <Input
                  id="share-phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Deixe em branco para escolher o contato no WhatsApp.
                </p>
              </div>
              <Button onClick={submitShare} className="w-full">
                <MessageCircle size={14} />
                Abrir WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExportButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-left transition-colors hover:bg-muted"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
  )
}
