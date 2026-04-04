'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Star } from 'lucide-react'
import { toast } from 'sonner'

interface Photo {
  id?: string
  url: string
  storage_path: string
  is_cover: boolean
  sort_order: number
}

interface PhotoUploadProps {
  vehicleId: string
  storeId: string
  initialPhotos?: Photo[]
  onChange?: (photos: Photo[]) => void
}

export function PhotoUpload({ vehicleId, storeId, initialPhotos = [], onChange }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const MAX = 20

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (photos.length + files.length > MAX) {
      toast.error(`Máximo de ${MAX} fotos por veículo.`)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const newPhotos: Photo[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `fotos/${storeId}/${vehicleId}/${filename}`

      const { error } = await supabase.storage
        .from('vehicle-images')
        .upload(path, file, { upsert: false })

      if (error) {
        toast.error(`Erro ao enviar ${file.name}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(path)

      newPhotos.push({
        url: publicUrl,
        storage_path: path,
        is_cover: photos.length === 0 && newPhotos.length === 0,
        sort_order: photos.length + newPhotos.length,
      })
    }

    // Salva no banco
    if (newPhotos.length > 0) {
      const { error } = await supabase.from('vehicle_images').insert(
        newPhotos.map(p => ({
          vehicle_id: vehicleId,
          store_id: storeId,
          url: p.url,
          storage_path: p.storage_path,
          is_cover: p.is_cover,
          sort_order: p.sort_order,
        }))
      )
      if (error) toast.error('Erro ao salvar fotos.')
    }

    const updated = [...photos, ...newPhotos]
    setPhotos(updated)
    onChange?.(updated)
    setUploading(false)
    if (newPhotos.length > 0) toast.success(`${newPhotos.length} foto(s) adicionada(s)`)
  }

  async function removePhoto(index: number) {
    const supabase = createClient()
    const photo = photos[index]

    await supabase.storage.from('vehicle-images').remove([photo.storage_path])
    if (photo.id) {
      await supabase.from('vehicle_images').delete().eq('id', photo.id)
    }

    const updated = photos.filter((_, i) => i !== index).map((p, i) => ({ ...p, sort_order: i }))
    // Se a foto removida era capa, define a primeira como capa
    if (photo.is_cover && updated.length > 0) {
      updated[0].is_cover = true
      if (updated[0].id) {
        await supabase.from('vehicle_images').update({ is_cover: true }).eq('id', updated[0].id)
      }
    }
    setPhotos(updated)
    onChange?.(updated)
  }

  async function setCover(index: number) {
    const supabase = createClient()
    const updated = photos.map((p, i) => ({ ...p, is_cover: i === index }))
    setPhotos(updated)
    onChange?.(updated)

    // Atualiza no banco
    if (photos[index].id) {
      await supabase.from('vehicle_images')
        .update({ is_cover: false })
        .eq('vehicle_id', vehicleId)
      await supabase.from('vehicle_images')
        .update({ is_cover: true })
        .eq('id', photos[index].id)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-ds-primary-600 hover:bg-ds-primary-50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
          disabled={uploading || photos.length >= MAX}
        />
        <ImagePlus size={32} className="mx-auto mb-3 text-slate-300" />
        {uploading ? (
          <p className="text-sm text-muted-foreground">Enviando fotos...</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700">
              Clique ou arraste as fotos aqui
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou WEBP · Máximo de {MAX} fotos · {photos.length}/{MAX} adicionadas
            </p>
          </>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative group aspect-square">
              <img
                src={photo.url}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />

              {/* Cover badge */}
              {photo.is_cover && (
                <span className="absolute bottom-1 left-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--ds-primary-600)' }}>
                  Capa
                </span>
              )}

              {/* Actions on hover */}
              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.is_cover && (
                  <button
                    onClick={() => setCover(i)}
                    title="Definir como capa"
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-yellow-50"
                  >
                    <Star size={12} className="text-yellow-500" />
                  </button>
                )}
                <button
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
