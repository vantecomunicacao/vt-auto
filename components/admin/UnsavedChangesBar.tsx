'use client'

import { AlertCircle } from 'lucide-react'

interface Props {
  isDirty: boolean
}

export function UnsavedChangesBar({ isDirty }: Props) {
  if (!isDirty) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm shadow-lg border border-slate-700 pointer-events-none">
      <AlertCircle size={14} className="shrink-0 text-amber-400" />
      <span className="font-medium">Você tem alterações não salvas</span>
    </div>
  )
}
