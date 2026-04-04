import { PanelLayout } from '@/components/admin/PanelLayout'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { Car, MessageCircle, CalendarDays, CheckCircle, Circle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const fuelLabel: Record<string, string> = {
  flex: 'Flex', gasoline: 'Gasolina', diesel: 'Diesel',
  electric: 'Elétrico', hybrid: 'Híbrido', gas: 'GNV',
}

const statusLabel: Record<string, { label: string; className: string }> = {
  available:  { label: 'Disponível', className: 'bg-green-100 text-green-700' },
  featured:   { label: 'Destaque',   className: 'bg-blue-100 text-blue-700' },
  reserved:   { label: 'Reservado',  className: 'bg-amber-100 text-amber-700' },
  sold:       { label: 'Vendido',    className: 'bg-gray-100 text-gray-600' },
  inactive:   { label: 'Inativo',    className: 'bg-gray-100 text-gray-500' },
}

function formatPrice(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  // Busca store_id do usuário
  const { data: storeUser } = await admin
    .from('store_users')
    .select('store_id')
    .eq('user_id', user.id)
    .single()

  if (!storeUser) redirect('/admin/onboarding')

  const storeId = storeUser.store_id
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Queries em paralelo
  const [
    { count: availableCount },
    { count: leadsToday },
    { count: leadsMonth },
    { count: soldMonth },
    { data: recentVehicles },
    { data: recentLeads },
    { data: store },
  ] = await Promise.all([
    admin.from('vehicles').select('*', { count: 'exact', head: true })
      .eq('store_id', storeId).eq('status', 'available'),

    admin.from('leads').select('*', { count: 'exact', head: true })
      .eq('store_id', storeId).gte('created_at', startOfDay),

    admin.from('leads').select('*', { count: 'exact', head: true })
      .eq('store_id', storeId).gte('created_at', startOfMonth),

    admin.from('vehicles').select('*', { count: 'exact', head: true })
      .eq('store_id', storeId).eq('status', 'sold')
      .gte('updated_at', startOfMonth),

    admin.from('vehicles')
      .select('id, brand, model, version, year_model, mileage, fuel, price, status, featured, cover_image_url, slug')
      .eq('store_id', storeId)
      .neq('status', 'inactive')
      .order('created_at', { ascending: false })
      .limit(5),

    admin.from('leads')
      .select('id, name, phone, vehicle_interest, status, created_at, vehicles(brand, model)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(5),

    admin.from('stores')
      .select('agent_active, whatsapp_instance')
      .eq('id', storeId)
      .single(),
  ])

  // Checklist dinâmico
  const hasVehicles = (availableCount ?? 0) > 0
  const agentActive = store?.agent_active ?? false
  const whatsappConnected = !!store?.whatsapp_instance
  const checklistItems = [
    { done: true,              label: 'Dados e cores configurados' },
    { done: hasVehicles,       label: 'Cadastrar primeiro veículo', href: '/admin/vehicles/new' },
    { done: agentActive,       label: 'Ativar agente de IA',        href: '/admin/agent' },
    { done: whatsappConnected, label: 'Conectar WhatsApp',          href: '/admin/integrations' },
  ]
  const doneCnt = checklistItems.filter(i => i.done).length
  const progressPct = Math.round((doneCnt / checklistItems.length) * 100)

  return (
    <PanelLayout
      topbar={{
        title: 'Dashboard',
        action: { label: 'Novo veículo', href: '/admin/vehicles/new' },
      }}
    >
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={Car}
          label="Veículos disponíveis"
          value={String(availableCount ?? 0)}
          sub="no estoque agora"
          subColor="text-muted-foreground"
        />
        <MetricCard
          icon={MessageCircle}
          label="Leads hoje"
          value={String(leadsToday ?? 0)}
          sub={(leadsToday ?? 0) === 0 ? 'Nenhum ainda' : 'novos contatos'}
          subColor={(leadsToday ?? 0) > 0 ? 'text-ds-error' : 'text-muted-foreground'}
          valueColor={(leadsToday ?? 0) > 0 ? 'text-ds-error' : undefined}
        />
        <MetricCard
          icon={CalendarDays}
          label="Leads este mês"
          value={String(leadsMonth ?? 0)}
          sub="contatos no mês"
          subColor="text-muted-foreground"
        />
        <MetricCard
          icon={CheckCircle}
          label="Vendidos este mês"
          value={String(soldMonth ?? 0)}
          sub="veículos vendidos"
          subColor="text-muted-foreground"
          valueColor={(soldMonth ?? 0) > 0 ? 'text-ds-success' : undefined}
        />
      </div>

      {/* Grid 2 Colunas */}
      <div className="grid grid-cols-[1fr_340px] gap-4 mb-6">

        {/* Veículos Recentes */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Veículos recentes</span>
            <Link href="/admin/vehicles" className="text-xs text-ds-primary-600 hover:underline">Ver todos →</Link>
          </div>
          <div className="px-5 py-2">
            {!recentVehicles?.length ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum veículo cadastrado ainda.{' '}
                <Link href="/admin/vehicles/new" className="text-ds-primary-600 hover:underline">Cadastrar agora</Link>
              </div>
            ) : recentVehicles.map((v, i) => {
              const badge = v.featured ? statusLabel.featured : statusLabel[v.status] ?? statusLabel.available
              return (
                <div key={v.id} className={`flex items-center gap-3 py-2.5 ${i < recentVehicles.length - 1 ? 'border-b border-border/50' : ''}`}>
                  {v.cover_image_url ? (
                    <img src={v.cover_image_url} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-10 rounded-lg bg-ds-primary-50 flex items-center justify-center text-lg flex-shrink-0">🚗</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">{v.brand} {v.model} {v.version}</div>
                    <div className="text-[11px] text-muted-foreground">{v.year_model} · {new Intl.NumberFormat('pt-BR').format(v.mileage)} km · {fuelLabel[v.fuel] ?? v.fuel}</div>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badge.className}`}>{badge.label}</span>
                  <div className="text-[13px] font-medium text-ds-primary-700 flex-shrink-0">{formatPrice(v.price)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Leads Recentes */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Últimos leads</span>
            <Link href="/admin/leads" className="text-xs text-ds-primary-600 hover:underline">Ver todos →</Link>
          </div>
          <div className="px-5 py-2">
            {!recentLeads?.length ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhum lead ainda.</div>
            ) : recentLeads.map((lead: any, i) => {
              const initials = getInitials(lead.name ?? lead.phone)
              const isNew = lead.status === 'new'
              const vehicleName = lead.vehicles ? `${(lead.vehicles as any).brand} ${(lead.vehicles as any).model}` : lead.vehicle_interest
              return (
                <div key={lead.id} className={`flex items-start gap-2.5 py-2.5 ${i < recentLeads.length - 1 ? 'border-b border-border/50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-ds-primary-50 flex flex-shrink-0 items-center justify-center text-[11px] font-medium text-ds-primary-700">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{lead.name ?? lead.phone}</div>
                    {vehicleName && <div className="text-xs text-muted-foreground line-clamp-1">{vehicleName}</div>}
                    <div className="text-[11px] text-slate-400 mt-0.5">{timeAgo(lead.created_at)}</div>
                  </div>
                  {isNew && <span className="bg-red-100 text-red-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">Novo</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-xl p-5" style={{ background: 'var(--ds-primary-50)', border: '0.5px solid var(--ds-primary-100)' }}>
        <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--ds-primary-800)' }}>
          <CheckCircle size={14} />
          Configure sua loja
        </p>
        {checklistItems.map((item, i) => (
          <ChecklistItem key={i} done={item.done} label={item.label} href={item.href} />
        ))}
        <div className="mt-3 h-1 rounded-full bg-blue-200">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-xs mt-1.5 text-blue-600">{doneCnt} de {checklistItems.length} concluídos</p>
      </div>
    </PanelLayout>
  )
}

function MetricCard({
  icon: Icon, label, value, sub, subColor, valueColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  subColor: string
  valueColor?: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-[18px] shadow-sm">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Icon size={14} />
        {label}
      </div>
      <div className={`text-[26px] font-medium mb-1 ${valueColor ?? 'text-foreground'}`}>{value}</div>
      <div className={`text-xs ${subColor}`}>{sub}</div>
    </div>
  )
}

function ChecklistItem({ done, label, href }: { done: boolean; label: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-2 py-1.5">
      {done
        ? <CheckCircle size={14} className="text-ds-success flex-shrink-0" />
        : <Circle size={14} className="text-blue-200 flex-shrink-0" />
      }
      <span className={`text-sm ${done ? 'text-blue-400 line-through' : 'text-ds-primary-900'}`}>{label}</span>
    </div>
  )
  if (!done && href) return <Link href={href}>{content}</Link>
  return content
}
