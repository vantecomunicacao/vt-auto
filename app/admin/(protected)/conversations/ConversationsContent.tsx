'use client'

import { useState } from 'react'
import { MessageCircle, Search } from 'lucide-react'

interface Message {
  role: string
  content: string
  phone: string
  created_at: string
}

interface Lead {
  phone: string
  name: string | null
}

interface Conversation {
  phone: string
  name: string | null
  messages: Message[]
  lastAt: string
  lastMessage: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function groupConversations(messages: Message[], leads: Lead[]): Conversation[] {
  const leadMap = new Map(leads.map(l => [l.phone, l.name]))
  const map = new Map<string, Message[]>()

  for (const msg of messages) {
    const existing = map.get(msg.phone) ?? []
    existing.push(msg)
    map.set(msg.phone, existing)
  }

  return Array.from(map.entries())
    .map(([phone, msgs]) => ({
      phone,
      name: leadMap.get(phone) ?? null,
      messages: msgs,
      lastAt: msgs[msgs.length - 1]?.created_at ?? '',
      lastMessage: msgs[msgs.length - 1]?.content ?? '',
    }))
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.slice(0, 2).toUpperCase()
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-rose-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`${size === 'md' ? 'w-11 h-11' : 'w-8 h-8'} rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
      <span className={`${size === 'md' ? 'text-sm' : 'text-xs'} font-semibold text-white`}>{initials}</span>
    </div>
  )
}

export function ConversationsContent({ messages, leads }: { messages: Message[]; leads: Lead[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const conversations = groupConversations(messages, leads)
  const filtered = conversations.filter(c => {
    const q = search.toLowerCase()
    return (c.name ?? c.phone).toLowerCase().includes(q) || c.phone.includes(q)
  })

  const active = conversations.find(c => c.phone === selected)

  return (
    <div className="flex h-[calc(100vh-64px)] border border-border rounded-xl overflow-hidden bg-card shadow-sm">

      {/* ── Coluna esquerda: lista ── */}
      <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-border">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Conversas</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
              <MessageCircle size={24} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
            </div>
          ) : (
            filtered.map(conv => {
              const isActive = selected === conv.phone
              const displayName = conv.name ?? conv.phone
              return (
                <button
                  key={conv.phone}
                  onClick={() => setSelected(conv.phone)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-slate-50 ${
                    isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <Avatar name={displayName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                        {displayName}
                      </p>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
                        {timeAgo(conv.lastAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Painel direito: conversa ── */}
      {active ? (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header da conversa */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-white">
            <Avatar name={active.name ?? active.phone} size="sm" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{active.name ?? active.phone}</p>
              {active.name && <p className="text-xs text-muted-foreground">{active.phone}</p>}
            </div>
            <div className="ml-auto">
              <span className="text-xs text-muted-foreground">{active.messages.length} mensagens</span>
            </div>
          </div>

          {/* Mensagens */}
          <div
            className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
            style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e2e8f0\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), #f0f4f8' }}
          >
            {active.messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(active.messages[i - 1].created_at).toDateString()
              return (
                <div key={i}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">
                        {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[72%] px-3.5 py-2 shadow-sm ${
                        isUser
                          ? 'bg-white text-slate-800 rounded-2xl rounded-tl-sm'
                          : 'bg-[#dcf8c6] text-slate-800 rounded-2xl rounded-tr-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] text-slate-400 mt-1 text-right">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center bg-slate-50">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
            <MessageCircle size={28} className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Selecione uma conversa</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em um contato para ver o histórico</p>
          </div>
        </div>
      )}
    </div>
  )
}
