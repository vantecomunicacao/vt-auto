'use client'

import { createContext, useContext } from 'react'

export interface StoreContextValue {
  storeName: string
  plan: string
  agentActive: boolean
  userName: string
  userRole: string
  userInitials: string
  isMaster: boolean
  newLeadsCount: number
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: StoreContextValue
}) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
