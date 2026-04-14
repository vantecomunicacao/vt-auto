'use client'

import { useState, useRef } from 'react'
import { ShieldCheck, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

type UserRow = {
  id: string
  email: string
  full_name: string
  is_master: boolean
  store_name: string | null
  created_at: string
}

type FormState = {
  email: string
  password: string
  full_name: string
  is_master: boolean
}

const emptyForm: FormState = { email: '', password: '', full_name: '', is_master: false }

export default function UsersContent({ users: initialUsers, currentUserId }: { users: UserRow[], currentUserId: string }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const createDialogRef = useRef<HTMLDialogElement>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    createDialogRef.current?.showModal()
  }

  function openEdit(user: UserRow) {
    setEditingId(user.id)
    setForm({ email: user.email, password: '', full_name: user.full_name, is_master: user.is_master })
    setError('')
    createDialogRef.current?.showModal()
  }

  function closeCreateDialog() {
    createDialogRef.current?.close()
    setEditingId(null)
    setError('')
  }

  function openDelete(user: UserRow) {
    setDeletingId(user.id)
    deleteDialogRef.current?.showModal()
  }

  function closeDeleteDialog() {
    deleteDialogRef.current?.close()
    setDeletingId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (editingId) {
        const body: Record<string, unknown> = {
          full_name: form.full_name,
          is_master: form.is_master,
        }
        if (form.email) body.email = form.email
        if (form.password) body.password = form.password

        const res = await fetch(`/api/master/users/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }

        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingId
              ? { ...u, email: form.email || u.email, full_name: form.full_name, is_master: form.is_master }
              : u
          )
        )
      } else {
        const res = await fetch('/api/master/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }

        const u = data.user
        setUsers((prev) => [
          {
            id: u.id,
            email: u.email,
            full_name: u.user_metadata?.full_name ?? '',
            is_master: u.user_metadata?.is_master === true,
            store_name: null,
            created_at: u.created_at,
          },
          ...prev,
        ])
      }

      closeCreateDialog()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/master/users/${deletingId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setUsers((prev) => prev.filter((u) => u.id !== deletingId))
      closeDeleteDialog()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const deletingUser = users.find((u) => u.id === deletingId)

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-9 pr-3 h-9 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Plus size={15} />
          Novo usuário
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">E-mail</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Perfil</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Loja vinculada</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Criado em</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-900">{user.email}</td>
                  <td className="px-5 py-3 text-gray-600">{user.full_name || '—'}</td>
                  <td className="px-5 py-3">
                    {user.is_master ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-white">
                        <ShieldCheck size={11} />
                        master
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        usuário
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{user.store_name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-gray-100 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => openDelete(user)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Deletar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <dialog
        ref={createDialogRef}
        className="rounded-xl border border-gray-200 shadow-xl p-0 w-full max-w-md backdrop:bg-black/40"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {editingId ? 'Editar usuário' : 'Novo usuário'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  E-mail {editingId && <span className="text-gray-400">(deixe em branco para não alterar)</span>}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required={!editingId}
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Senha {editingId && <span className="text-gray-400">(deixe em branco para não alterar)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={!editingId}
                  minLength={6}
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder={editingId ? '••••••' : 'Mínimo 6 caracteres'}
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_master}
                  onChange={(e) => setForm((f) => ({ ...f, is_master: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 accent-slate-800"
                />
                <span className="text-sm text-gray-700">Acesso master (admin do sistema)</span>
              </label>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={closeCreateDialog}
                className="flex-1 h-9 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-9 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Salvando...' : editingId ? 'Salvar' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </form>
      </dialog>

      {/* Delete confirm dialog */}
      <dialog
        ref={deleteDialogRef}
        className="rounded-xl border border-gray-200 shadow-xl p-0 w-full max-w-sm backdrop:bg-black/40"
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Deletar usuário</h3>
          <p className="text-sm text-gray-500 mb-4">
            Tem certeza que deseja deletar <strong>{deletingUser?.email}</strong>? Esta ação não pode ser desfeita.
          </p>
          {error && (
            <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={closeDeleteDialog}
              className="flex-1 h-9 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 h-9 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Deletando...' : 'Deletar'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
