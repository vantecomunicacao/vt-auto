import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PanelLayout } from '@/components/admin/PanelLayout'
import { VehicleStatusBadge } from '@/components/admin/vehicles/VehicleStatusBadge'
import { VehicleActionsMenu } from '@/components/admin/vehicles/VehicleActionsMenu'
import { Car } from 'lucide-react'
import type { Vehicle } from '@/lib/supabase/types'
import { FUEL_LABELS, TRANSMISSION_LABELS } from '@/lib/schemas/vehicle'

function formatPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)
}

function formatKm(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value) + ' km'
}

export default async function VehiclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id, role')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) redirect('/admin/login')

  const { data: vehicles } = await admin
    .from('vehicles')
    .select('*')
    .eq('store_id', storeUser.store_id)
    .order('created_at', { ascending: false })

  const list = (vehicles || []) as Vehicle[]
  const isOwner = storeUser.role === 'owner'

  return (
    <PanelLayout topbar={{ title: 'Veículos', action: { label: 'Novo veículo', href: '/admin/vehicles/new' } }}>
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {list.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Car size={48} className="text-slate-200 mb-4" />
            <p className="text-base font-medium text-slate-500 mb-1">Nenhum veículo cadastrado</p>
            <p className="text-sm text-muted-foreground mb-6">Adicione seu primeiro veículo ao estoque</p>
            <Link
              href="/admin/vehicles/new"
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white rounded-lg"
              style={{ background: 'var(--ds-primary-600)' }}
            >
              + Adicionar veículo
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '0.5px solid #F1F5F9' }}>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Veículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Ano / KM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Combustível</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Preço</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map(v => (
                <tr
                  key={v.id}
                  className="hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: '0.5px solid #F1F5F9' }}
                >
                  {/* Veículo */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {v.cover_image_url ? (
                        <img
                          src={v.cover_image_url}
                          alt=""
                          className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ds-primary-50)' }}>
                          <Car size={18} style={{ color: 'var(--ds-primary-600)' }} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">
                          {v.brand} {v.model}
                          {v.version && <span className="text-muted-foreground font-normal"> {v.version}</span>}
                        </p>
                        {v.featured && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white" style={{ background: '#D97706' }}>
                            Destaque
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Ano / KM */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {v.year_model} · {formatKm(v.mileage)}
                  </td>

                  {/* Combustível */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {FUEL_LABELS[v.fuel]} · {TRANSMISSION_LABELS[v.transmission]}
                  </td>

                  {/* Preço */}
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ds-primary-700)' }}>
                    {formatPrice(v.price)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <VehicleStatusBadge status={v.status} />
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3 text-right">
                    <VehicleActionsMenu
                      vehicleId={v.id}
                      vehicleLabel={`${v.brand} ${v.model}${v.version ? ` ${v.version}` : ''}`}
                      currentStatus={v.status}
                      isOwner={isOwner}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PanelLayout>
  )
}
