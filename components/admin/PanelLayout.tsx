'use client'

import { useStore } from './StoreContext'
import { Topbar } from './Topbar'

interface PanelLayoutProps {
  children: React.ReactNode
  topbar?: {
    title: string
    subtitle?: string
    action?: {
      label: string
      href?: string
    }
  }
}

export function PanelLayout({ children, topbar }: PanelLayoutProps) {
  const { agentActive, storeName } = useStore()

  return (
    <>
      {topbar && (
        <Topbar
          title={topbar.title}
          subtitle={topbar.subtitle ?? `${storeName} · ${topbar.title}`}
          agentActive={agentActive}
          action={topbar.action}
        />
      )}
      <main className="flex-1 overflow-y-auto p-6 bg-ds-page">
        {children}
      </main>
    </>
  )
}
