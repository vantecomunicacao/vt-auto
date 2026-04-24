'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, CheckCircle, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { VehicleStatus } from '@/lib/supabase/types'

interface Props {
  vehicleId: string
  vehicleLabel: string
  currentStatus: VehicleStatus
  isOwner: boolean
}

export function VehicleActionsMenu({ vehicleId, vehicleLabel, currentStatus, isOwner }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      toast.success('Veículo excluído permanentemente')
      setConfirmOpen(false)
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Erro ao excluir veículo')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={loading}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-slate-50 transition-colors"
        >
          <MoreHorizontal size={14} className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
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
              {currentStatus !== 'inactive' && (
                <DropdownMenuItem onClick={() => changeStatus('inactive')}>
                  <Trash2 size={13} className="mr-2 text-slate-500" />
                  Desativar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setConfirmOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 size={13} className="mr-2" />
                Excluir permanentemente
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-50">
              <AlertTriangle className="text-red-600" />
            </AlertDialogMedia>
            <AlertDialogTitle>Excluir {vehicleLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>permanente e não pode ser desfeita</strong>. O veículo,
              todas as fotos e o histórico vinculado serão apagados.
              Se quer só tirar da vitrine temporariamente, use <strong>Desativar</strong> no lugar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? (
                <><Loader2 size={14} className="animate-spin mr-2" />Excluindo...</>
              ) : (
                'Excluir permanentemente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
