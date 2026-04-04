'use client'

import { Bell, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface TopbarProps {
  title: string
  subtitle?: string
  agentActive?: boolean
  onToggleAgent?: () => void
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  notificationCount?: number
}

export function Topbar({
  title,
  subtitle,
  agentActive = false,
  onToggleAgent,
  action,
  notificationCount = 0,
}: TopbarProps) {
  return (
    <header
      className="h-14 px-6 flex items-center justify-between flex-shrink-0 bg-white"
      style={{ borderBottom: '0.5px solid var(--ds-border)' }}
    >
      {/* Left: title + breadcrumb */}
      <div>
        <h1 className="text-base font-medium text-slate-900">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500">{subtitle}</p>
        )}
      </div>

      {/* Right: agent toggle + notification + action */}
      <div className="flex items-center gap-3">
        {/* Agent toggle */}
        <button
          onClick={onToggleAgent}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
          style={
            agentActive
              ? { border: '0.5px solid #BBF7D0', background: '#F0FDF4' }
              : { border: '0.5px solid var(--ds-border)', background: '#F8FAFC' }
          }
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: agentActive ? 'var(--ds-success)' : '#94A3B8' }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: agentActive ? 'var(--ds-success)' : '#64748B' }}
          >
            {agentActive ? 'Agente ativo' : 'Agente inativo'}
          </span>
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-white transition-colors hover:bg-slate-50"
          style={{ border: '0.5px solid var(--ds-border)' }}
        >
          <Bell size={16} className="text-slate-500" />
          {notificationCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-red-600"
              style={{ border: '1.5px solid white' }}
            />
          )}
        </button>

        {/* CTA action */}
        {action && (
          action.href ? (
            <Link href={action.href}>
              <Button className="h-9 px-4 text-sm font-medium bg-ds-primary-600 hover:bg-ds-primary-700 text-white rounded-lg">
                <Plus size={14} className="mr-1.5" />
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={action.onClick}
              className="h-9 px-4 text-sm font-medium bg-ds-primary-600 hover:bg-ds-primary-700 text-white rounded-lg"
            >
              <Plus size={14} className="mr-1.5" />
              {action.label}
            </Button>
          )
        )}
      </div>
    </header>
  )
}
