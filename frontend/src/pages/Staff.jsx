import { useEffect, useState } from 'react'
import { Plus, Trash2, UserCog, Bike, ToggleLeft, ToggleRight } from 'lucide-react'
import { usersApi } from '../services/api'
import toast from 'react-hot-toast'

function StaffForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ username: '', password: '', role: 'Employee', fullName: '', phone: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim() || !form.fullName.trim())
      return toast.error('Name, username and password are required')
    await onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setForm(f => ({ ...f, role: 'Employee' }))}
          className="flex-1 py-2 rounded-lg text-sm font-semibold border"
          style={{
            background: form.role === 'Employee' ? 'rgba(179,69,46,0.1)' : 'transparent',
            borderColor: form.role === 'Employee' ? 'var(--accent)' : 'var(--border)',
            color: form.role === 'Employee' ? 'var(--accent)' : 'var(--text2)',
          }}>Employee</button>
        <button type="button" onClick={() => setForm(f => ({ ...f, role: 'Rider' }))}
          className="flex-1 py-2 rounded-lg text-sm font-semibold border"
          style={{
            background: form.role === 'Rider' ? 'rgba(179,69,46,0.1)' : 'transparent',
            borderColor: form.role === 'Rider' ? 'var(--accent)' : 'var(--border)',
            color: form.role === 'Rider' ? 'var(--accent)' : 'var(--text2)',
          }}>Rider</button>
      </div>
      <div>
        <label className="label">Full Name *</label>
        <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="e.g. Bilal Ahmed" />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" value={form.phone} onChange={set('phone')} placeholder="03XX-XXXXXXX" />
      </div>
      <div>
        <label className="label">Username *</label>
        <input className="input" value={form.username} onChange={set('username')} placeholder="Login username" />
      </div>
      <div>
        <label className="label">Password *</label>
        <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Login password" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1">Add {form.role}</button>
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export default function Staff() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    try { setUsers(await usersApi.getAll()) }
    catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(form) {
    try {
      await usersApi.create(form)
      toast.success(`${form.fullName} added`)
      setShowForm(false)
      load()
    } catch (e) { toast.error(e.message) }
  }

  async function toggleActive(u) {
    try {
      await usersApi.update(u.id, { fullName: u.fullName, phone: u.phone, isActive: !u.isActive })
      load()
    } catch (e) { toast.error(e.message) }
  }

  async function handleDelete(u) {
    if (!confirm(`Remove ${u.fullName}?`)) return
    try { await usersApi.delete(u.id); toast.success('Removed'); load() }
    catch (e) { toast.error(e.message) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }} />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Staff & Riders</h2>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>Manage employee and rider accounts for your store</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Add Staff
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <StaffForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {users.length === 0 ? (
        <div className="card text-center py-16">
          <UserCog size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text3)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>No staff accounts yet</p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>Add employees for billing/inventory or riders for deliveries</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: u.role === 'Rider' ? 'rgba(179,69,46,0.1)' : 'rgba(92,122,138,0.1)' }}>
                  {u.role === 'Rider' ? <Bike size={16} style={{ color: 'var(--accent)' }} /> : <UserCog size={16} style={{ color: 'var(--blue)' }} />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{u.fullName}</p>
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>{u.role} · @{u.username}{u.phone && ` · ${u.phone}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(u)} title={u.isActive ? 'Active — click to disable' : 'Disabled — click to enable'}>
                  {u.isActive
                    ? <ToggleRight size={26} style={{ color: 'var(--accent)' }} />
                    : <ToggleLeft size={26} style={{ color: 'var(--text3)' }} />}
                </button>
                <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg" style={{ color: 'var(--red)' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
