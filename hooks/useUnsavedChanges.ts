'use client'

import { useEffect, useRef } from 'react'

/**
 * Detecta alterações não salvas comparando o estado atual com o salvo.
 * Bloqueia fechar aba/refresh com beforeunload.
 *
 * @param current  — estado atual do formulário
 * @param saved    — estado salvo (após carregar ou salvar com sucesso)
 * @returns isDirty e markSaved (chamar ao salvar com sucesso)
 */
export function useUnsavedChanges<T>(current: T, saved: T) {
  const isDirty = JSON.stringify(current) !== JSON.stringify(saved)
  const isDirtyRef = useRef(isDirty)
  
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return { isDirty }
}
