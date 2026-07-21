import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi, auth } from '../services/api'
import GroceryBackdrop from '../components/GroceryBackdrop'

export default function Signup({ onSuccess, onBack }) {
  const [form, setForm] = useState({ storeName: '', city: '', phone: '', ownerName: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, role, storeName, fullName } = await authApi.registerStore(form)
      auth.setToken(token)
      auth.setProfile({ role, storeName, fullName })
      toast.success(`${storeName} is live`)
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Could not create your store')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <GroceryBackdrop />
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <p className="kicker mb-2">New Registration</p>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>Open your ledger</h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text3)' }}>Set up your own Smart Kiryana in a minute</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div>
            <label className="label">Store Name</label>
            <input className="input" placeholder="e.g. Ahmed General Store"
              value={form.storeName} onChange={set('storeName')} autoFocus required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={set('city')} />
            </div>
            <div className="flex-1">
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div>
            <label className="label">Owner Name</label>
            <input className="input" value={form.ownerName} onChange={set('ownerName')} />
          </div>
          <hr className="rule-dashed" />
          <div>
            <label className="label">Username</label>
            <input className="input" value={form.username} onChange={set('username')} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)', color: '#f3ede1', opacity: loading ? 0.6 : 1, transition: 'var(--trans)' }}>
            {loading ? 'Creating your store…' : 'Create Store'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <button onClick={onBack}
          className="flex items-center gap-1.5 mx-auto mt-6 text-xs font-semibold"
          style={{ color: 'var(--text3)' }}>
          <ArrowLeft size={13} /> Back to login
        </button>
      </div>
    </div>
  )
}
