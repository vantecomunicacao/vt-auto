'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage, ERROR_MESSAGES } from '@/lib/image/compress'

export type AssetKind = 'logo' | 'banner' | 'favicon'

interface Props {
  value: string | null | undefined
  onChange: (url: string | null) => void
  kind: AssetKind
  /** Razão de aspecto do preview (ex: "16/9", "1/1", "4/1"). */
  aspect?: string
  /** Texto no botão quando não há imagem. */
  placeholder?: string
  /** Classe extra no wrapper. */
  className?: string
  /** Ajuste de tamanho do preview (ex: "h-32"). */
  previewClassName?: string
  /** Pula compressão — útil para favicon (manter 32x32 com transparência). */
  skipCompression?: boolean
  /** Como a imagem preenche o preview. Default: "contain". */
  objectFit?: 'cover' | 'contain'
}

export function ImageUploadField({
  value,
  onChange,
  kind,
  aspect,
  placeholder = 'Enviar imagem',
  className = '',
  previewClassName = '',
  skipCompression = false,
  objectFit = 'contain',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      let toUpload: File = file

      if (!skipCompression) {
        const result = await compressImage(file)
        if (!result.ok) {
          const msg = ERROR_MESSAGES[result.error]
          toast.error(msg.title, { description: msg.description })
          return
        }
        toUpload = result.file
      } else {
        // Validação mínima para favicon: precisa ser imagem e ≤ 2MB
        if (!file.type.startsWith('image/')) {
          toast.error('Formato não suportado', { description: 'Envie PNG, WebP ou ICO.' })
          return
        }
        if (file.size > 2 * 1024 * 1024) {
          toast.error('Arquivo muito grande', { description: 'Máximo de 2MB.' })
          return
        }
      }

      const fd = new FormData()
      fd.append('file', toUpload)
      fd.append('kind', kind)

      const res = await fetch('/api/stores/assets', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        toast.error('Falha no envio', { description: err.error || 'Tente novamente.' })
        return
      }

      const data = (await res.json()) as { url: string }
      onChange(data.url)
      toast.success('Imagem enviada')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRemove() {
    onChange(null)
  }

  const acceptAttr = skipCompression
    ? 'image/png,image/x-icon,image/vnd.microsoft.icon,image/webp'
    : 'image/jpeg,image/png,image/webp,image/heic,image/heif'

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
        disabled={uploading}
      />

      {value ? (
        <div
          className={`relative border border-border rounded-lg overflow-hidden bg-slate-50 ${previewClassName}`}
          style={aspect ? { aspectRatio: aspect } : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`} />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 bg-white text-slate-900 text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 disabled:opacity-60"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Trocar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 bg-white text-red-600 text-xs font-medium px-3 py-1.5 rounded-md hover:bg-red-50 disabled:opacity-60"
            >
              <X size={12} />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full border-2 border-dashed border-slate-200 rounded-lg p-6 text-center transition-colors hover:border-ds-primary-600 hover:bg-ds-primary-50 disabled:opacity-60 disabled:cursor-not-allowed ${previewClassName}`}
          style={aspect ? { aspectRatio: aspect } : undefined}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="mx-auto mb-2 text-ds-primary-600 animate-spin" />
              <p className="text-sm text-slate-600">Enviando...</p>
            </>
          ) : (
            <>
              <ImagePlus size={24} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">{placeholder}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {skipCompression ? 'PNG ou ICO · até 2MB' : 'JPG, PNG, WebP ou HEIC · compressão automática'}
              </p>
            </>
          )}
        </button>
      )}
    </div>
  )
}
