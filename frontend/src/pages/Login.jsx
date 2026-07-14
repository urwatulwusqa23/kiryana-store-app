import { useState } from 'react'
import { Store, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi, auth } from '../services/api'

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { token } = await authApi.login(username, password)
      auth.setToken(token)
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: `radial-gradient(ellipse at 25% 25%, rgba(0,212,170,0.06) 0%, transparent 55%),
                     radial-gradient(ellipse at 75% 75%, rgba(91,138,245,0.05) 0%, transparent 55%),
                     var(--bg)`
      }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af5)', color: '#000' }}>
            <Store size={24} />
          </div>
          <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>Owner Login</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <input
            className="input w-full"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            required
          />
          <input
            className="input w-full"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: 'var(--accent)', color: '#000', opacity: loading ? 0.6 : 1 }}>
            <Lock size={14} />
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
