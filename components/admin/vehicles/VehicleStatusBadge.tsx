import type { VehicleStatus } from '@/lib/supabase/types'

const styles: Record<VehicleStatus, { bg: string; color: string; label: string }> = {
  available: { bg: '#DCFCE7', color: '#166534', label: 'Disponível' },
  reserved:  { bg: '#FEF3C7', color: '#92400E', label: 'Reservado' },
  sold:      { bg: '#DBEAFE', color: '#1E40AF', label: 'Vendido' },
  inactive:  { bg: '#F1F5F9', color: '#64748B', label: 'Inativo' },
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const s = styles[status]
  return (
    <span
      className="text-xs font-medium px-2 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}
