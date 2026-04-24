'use client'

import { useState, useRef } from 'react'
import { ImagePlus, X, Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage, ERROR_MESSAGES } from '@/lib/image/compress'

interface Photo {
  id?: string
  url: string
  storage_path: string
  is_cover: boolean
  sort_order: number
}

interface PhotoUploadProps {
  vehicleId: string
  initialPhotos?: Photo[]
  onChange?: (photos: Photo[]) => void
}

const MAX = 5

export function PhotoUpload({ vehicleId, initialPhotos = [], onChange }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploading = progress !== null

  async function uploadOne(file: File): Promise<Photo | null> {
    const compressed = await compressImage(file)
    if (!compressed.ok) {
      const msg = ERROR_MESSAGES[compressed.error]
      toast.error(`${file.name} — ${msg.title}`, { description: msg.description })
      return null
    }

    const fd = new FormData()
    fd.append('file', compressed.file)

    const res = await fetch(`/api/vehicles/${vehicleId}/photos`, {
      method: 'POST',
      body: fd,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
      toast.error(`${file.name} — Falha no envio`, {
        description: err.error || 'Tente novamente em alguns segundos.',
      })
      return null
    }

    return (await res.json()) as Photo
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const remaining = MAX - photos.length
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX} fotos atingido`)
      return
    }

    const toUpload = Array.from(files).slice(0, remaining)
    if (files.length > remaining) {
      toast.warning(`Apenas ${remaining} foto(s) serão adicionadas (máx. ${MAX})`)
    }

    setProgress({ current: 0, total: toUpload.length })

    const uploaded: Photo[] = []
    for (let i = 0; i < toUpload.length; i++) {
      setProgress({ current: i + 1, total: toUpload.length })
      const result = await uploadOne(toUpload[i])
      if (result) uploaded.push(result)
    }

    if (uploaded.length > 0) {
      const updated = [...photos, ...uploaded]
      setPhotos(updated)
      onChange?.(updated)
      toast.success(`${uploaded.length} foto(s) adicionada(s)`)
    }

    setProgress(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function removePhoto(index: number) {
    const photo = photos[index]
    if (!photo.id) return

    const res = await fetch(`/api/vehicles/${vehicleId}/photos/${photo.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Erro ao remover foto')
      return
    }

    const updated = photos.filter((_, i) => i !== index)
    // Se a capa foi removida, promove a primeira (o servidor já fez isso no banco)
    if (photo.is_cover && updated.length > 0) {
      updated[0] = { ...updated[0], is_cover: true }
    }
    setPhotos(updated)
    onChange?.(updated)
  }

  async function setCover(index: number) {
    const photo = photos[index]
    if (!photo.id) return

    const res = await fetch(`/api/vehicles/${vehicleId}/photos/${photo.id}`, { method: 'PATCH' })
    if (!res.ok) {
      toast.error('Erro ao definir capa')
      return
    }

    const updated = photos.map((p, i) => ({ ...p, is_cover: i === index }))
    setPhotos(updated)
    onChange?.(updated)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const reachedMax = photos.length >= MAX

  return (
    <div className="space-y-4">
      <div
        onClick={() => !reachedMax && !uploading && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={e => !reachedMax && !uploading && handleDrop(e)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          reachedMax || uploading
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
            : 'border-slate-200 cursor-pointer hover:border-ds-primary-600 hover:bg-ds-primary-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
          disabled={uploading || reachedMax}
        />
        {uploading ? (
          <>
            <Loader2 size={32} className="mx-auto mb-3 text-ds-primary-600 animate-spin" />
            <p className="text-sm font-medium text-slate-700">
              Comprimindo e enviando {progress!.current} de {progress!.total}...
            </p>
          </>
        ) : (
          <>
            <ImagePlus size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              {reachedMax ? `Limite de ${MAX} fotos atingido` : 'Clique ou arraste as fotos aqui'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WEBP ou HEIC · Máximo {MAX} fotos · {photos.length}/{MAX} adicionadas
            </p>
          </>
        )}
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {photos.map((photo, i) => (
            <div key={photo.id ?? i} className="relative group aspect-square">
              <img
                src={photo.url}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />

              {photo.is_cover && (
                <span className="absolute bottom-1 left-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--ds-primary-600)' }}>
                  Capa
                </span>
              )}

              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.is_cover && (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    title="Definir como capa"
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-yellow-50"
                  >
                    <Star size={12} className="text-yellow-500" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  title="Remover"
                  className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-red-50"
                >
                  <X size={12} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
