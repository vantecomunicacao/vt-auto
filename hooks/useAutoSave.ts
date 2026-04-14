import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface Options<T> {
  onSave: (data: T) => Promise<void>
  debounceMs?: number
}

export function useAutoSave<T>(data: T, { onSave, debounceMs = 2000 }: Options<T>) {
  const timer = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  useEffect(() => {
    // Enquanto data for null (ainda carregando), não faz nada
    if (data === null || data === undefined) return

    // Primeira vez que data chega com valor = carga inicial, apenas registra
    if (!isInitialized.current) {
      isInitialized.current = true
      return
    }

    // A partir daqui, são mudanças feitas pelo usuário — dispara o save
    if (timer.current) clearTimeout(timer.current)

    timer.current = setTimeout(async () => {
      const toastId = toast.loading('Salvando...', { position: 'bottom-right' })
      try {
        await onSaveRef.current(data)
        toast.success('Salvo', { id: toastId, position: 'bottom-right', duration: 2000 })
      } catch {
        toast.dismiss(toastId)
      }
    }, debounceMs)

    return () => { if (timer.current) clearTimeout(timer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, debounceMs])
}
