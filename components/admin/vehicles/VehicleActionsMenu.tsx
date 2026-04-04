'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { VehicleStatus } from '@/lib/supabase/types'

interface Props {
  vehicleId: string
  currentStatus: VehicleStatus
  isOwner: boolean
}

export function VehicleActionsMenu({ vehicleId, currentStatus, isOwner }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function changeStatus(status: VehicleStatus) {
    setLoading(true)
    const res = await fetch(`/api/vehicles/${vehicleId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Status atualizado!')
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao atualizar status')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={loading}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-slate-50 transition-colors"
      >
        <MoreHorizontal size={14} className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push(`/admin/vehicles/${vehicleId}/edit`)}>
          <Pencil size={13} className="mr-2" />
          Editar
        </DropdownMenuItem>

        {currentStatus !== 'available' && (
          <DropdownMenuItem onClick={() => changeStatus('available')}>
            <CheckCircle size={13} className="mr-2 text-ds-success" />
            Marcar disponível
          </DropdownMenuItem>
        )}

        {currentStatus === 'available' && (
          <DropdownMenuItem onClick={() => changeStatus('reserved')}>
            <CheckCircle size={13} className="mr-2 text-yellow-500" />
            Marcar reservado
          </DropdownMenuItem>
        )}

        {isOwner && currentStatus !== 'sold' && (
          <DropdownMenuItem onClick={() => changeStatus('sold')}>
            <CheckCircle size={13} className="mr-2" style={{ color: 'var(--ds-primary-600)' }} />
            Marcar vendido
          </DropdownMenuItem>
        )}

        {isOwner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => changeStatus('inactive')}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 size={13} className="mr-2" />
              Desativar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
