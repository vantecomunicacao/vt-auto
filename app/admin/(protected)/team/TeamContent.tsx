'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Member } from './page'

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function TeamContent({
  members: initialMembers,
  storeId,
}: {
  members: Member[]
  storeId: string
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)

  function openInviteDialog() {
    setInviteEmail('')
    setInviteError('')
    dialogRef.current?.showModal()
  }

  function closeInviteDialog() {
    dialogRef.current?.close()
  }

  async function handleInvite() {
    const email = inviteEmail.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Informe um e-mail válido.')
      return
    }
    setInviting(true)
    setInviteError('')
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, store_id: storeId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setInviteError(json.error ?? 'Erro ao enviar convite.')
        return
      }
      toast.success(`Convite enviado para ${email}`)
      closeInviteDialog()
    } catch {
      setInviteError('Erro de rede. Tente novamente.')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(member: Member) {
    if (!confirm(`Remover ${member.name} da equipe?`)) return
    try {
      const res = await fetch(`/api/team/${member.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao remover membro.')
        return
      }
      setMembers(prev =>
        prev.map(m => m.id === member.id ? { ...m, is_active: false } : m)
      )
      toast.success(`${member.name} foi desativado.`)
    } catch {
      toast.error('Erro de rede. Tente novamente.')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          {members.length} {members.length === 1 ? 'membro' : 'membros'} na equipe
        </p>
        <button
          onClick={openInviteDialog}
          className="px-4 py-2 text-sm rounded-lg bg-ds-primary-600 hover:bg-ds-primary-700 text-white font-medium transition-colors"
        >
          Convidar vendedor
        </button>
      </div>

      {/* Members list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {members.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Nenhum membro na equipe ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Membro</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Perfil</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Situação</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Entrada</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => (
                <tr
                  key={member.id}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i === members.length - 1 ? 'border-b-0' : ''}`}
                >
                  {/* Membro */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-ds-primary-50 flex items-center justify-center text-xs font-semibold text-ds-primary-700 flex-shrink-0 select-none">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    {member.role === 'owner' ? (
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Owner
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        Vendedor
                      </span>
                    )}
                  </td>

                  {/* Situação */}
                  <td className="px-4 py-3">
                    {member.is_active ? (
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Inativo
                      </span>
                    )}
                  </td>

                  {/* Entrada */}
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(member.created_at)}
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    {member.role !== 'owner' && member.is_active && (
                      <button
                        onClick={() => handleRemove(member)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium underline underline-offset-2"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Native Dialog — invite */}
      <dialog
        ref={dialogRef}
        className="rounded-xl shadow-xl border border-border bg-card p-0 w-full max-w-sm backdrop:bg-black/40"
        onClose={closeInviteDialog}
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Convidar vendedor</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            O vendedor receberá um e-mail para criar a conta.
          </p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <label htmlFor="invite-email" className="text-sm font-medium text-foreground">
            E-mail
          </label>
          <input
            id="invite-email"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="vendedor@email.com"
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary-300"
          />
          {inviteError && (
            <p className="text-xs text-red-600">{inviteError}</p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={closeInviteDialog}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={inviting}
            className="px-4 py-2 text-sm rounded-lg bg-ds-primary-600 hover:bg-ds-primary-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {inviting ? 'Enviando...' : 'Enviar convite'}
          </button>
        </div>
      </dialog>
    </div>
  )
}
