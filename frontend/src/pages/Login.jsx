import { useState } from 'react'
import { ArrowRight, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi, auth } from '../services/api'
import GroceryBackdrop from '../components/GroceryBackdrop'
import GroceryIllustration from '../components/GroceryIllustration'

export default function Login({ onSuccess, onCreateStore, requiredRole, kicker = 'Staff Sign-in', title = 'Welcome back', subtitle = 'Sign in to manage your store' }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, role, storeName, fullName } = await authApi.login(username, password)
      if (requiredRole && role !== requiredRole) {
        toast.error(`This account is not a ${requiredRole.toLowerCase()} account`)
        return
      }
      auth.setToken(token)
      auth.setProfile({ role, storeName, fullName })
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <GroceryBackdrop />
      <div className="w-full max-w-4xl grid lg:grid-cols-2 overflow-hidden relative z-10"
        style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 8px 30px rgba(44,36,22,0.12)', border: '1px solid var(--border)' }}>

        {/* Illustration side */}
        <div className="hidden lg:flex flex-col p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(165deg, #f6ddc4 0%, #f4d0bd 60%, #f0c3ba 100%)' }}>
          <div className="flex items-center gap-2 relative z-10">
            <Flame size={22} color="#c1392b" />
            <p className="serif font-black" style={{ fontSize: 20, color: '#2c2416' }}>Smart Kiryana</p>
          </div>

          <div className="relative z-10 mt-8">
            <p className="kicker mb-3" style={{ color: '#8a6a4a' }}>Est. for the neighbourhood shop</p>
            <h2 className="serif font-black leading-tight mb-4" style={{ fontSize: 32, color: '#2c2416' }}>
              Every counter,<br />one ledger.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#6e5238', maxWidth: 300 }}>
              Track udhaar, inventory, billing and deliveries — all in one place.
            </p>
          </div>

          <GroceryIllustration className="relative z-10 mt-auto -mb-6 -mx-4 w-full" />
        </div>

        {/* Form side */}
        <div className="p-8 sm:p-12 flex flex-col justify-center" style={{ background: 'var(--surface)' }}>
          <div className="mb-8">
            <p className="kicker mb-2">{kicker}</p>
            <h1 className="serif" style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>{title}</h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text3)' }}>{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                style={{ border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '10px 12px', background: 'var(--surface2)' }}
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                style={{ border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '10px 12px', background: 'var(--surface2)' }}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)', color: '#faf4e6', opacity: loading ? 0.6 : 1, transition: 'var(--trans)', borderRadius: 'var(--r-sm)' }}>
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {onCreateStore && (
            <p className="text-center text-xs mt-6" style={{ color: 'var(--text3)' }}>
              New shop owner?{' '}
              <button onClick={onCreateStore} className="font-bold" style={{ color: 'var(--accent)' }}>
                Create your store
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
