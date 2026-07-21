import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard, Users, Package, Truck, ShoppingCart,
  BarChart2, Menu, ShoppingBag, ArrowRight, LogOut, X, MessageCircle, BookOpen, UserCog,
  Store, Bike, Check, Flame,
} from 'lucide-react'
import Dashboard  from './pages/Dashboard'
import Customers  from './pages/Customers'
import Inventory  from './pages/Inventory'
import Suppliers  from './pages/Suppliers'
import Billing    from './pages/Billing'
import Analytics  from './pages/Analytics'
import WhatsAppReminders from './pages/WhatsAppReminders'
import Orders            from './pages/Orders'
import KharchaKhata      from './pages/KharchaKhata'
import Staff             from './pages/Staff'
import CustomerPortal from './portals/CustomerPortal'
import RiderPortal    from './portals/RiderPortal'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import GroceryBackdrop from './components/GroceryBackdrop'
import { getPendingCount, fetchOrders } from './store/orderStore'
import { auth } from './services/api'

/* ─── Portal definitions ─────────────────────────────────────── */
const PORTALS = [
  {
    key: 'owner',
    icon: Store,
    title: 'Owner Portal',
    sub: 'Inventory, udhaar, billing, suppliers & analytics — the full ledger.',
    badge: 'Management',
    color: 'var(--accent)',
    tint: '#faece9',
  },
  {
    key: 'customer',
    icon: ShoppingBag,
    title: 'Customer Portal',
    sub: 'Browse the store, place an order, track your delivery live.',
    badge: 'Shop',
    color: 'var(--gold)',
    tint: '#fbf1dc',
  },
  {
    key: 'rider',
    icon: Bike,
    title: 'Rider Portal',
    sub: 'View assigned deliveries, update status, track earnings.',
    badge: 'Delivery',
    color: 'var(--forest)',
    tint: '#eaf3e6',
  },
]

/* ─── Portal Selector ────────────────────────────────────────── */
function PortalSelect({ onSelect }) {
  const [hover, setHover] = useState(null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <GroceryBackdrop />
      <div className="w-full max-w-3xl relative z-10">
        {/* Masthead */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999 }}>
            <Flame size={14} color="var(--accent)" />
            <p className="kicker" style={{ color: 'var(--text2)' }}>Smart Kiryana</p>
          </div>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', lineHeight: 1.15 }}>
            How would you like to continue?
          </h1>
          <p className="text-sm mt-3" style={{ color: 'var(--text3)' }}>
            Pick a portal — we'll take you straight there.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          {PORTALS.map(p => {
            const Icon = p.icon
            const active = hover === p.key
            return (
              <button key={p.key}
                onClick={() => onSelect(p.key)}
                onMouseEnter={() => setHover(p.key)}
                onMouseLeave={() => setHover(null)}
                className="relative text-left p-5 flex flex-col"
                style={{
                  background: 'var(--surface)',
                  border: `1.5px solid ${active ? p.color : 'var(--border)'}`,
                  borderRadius: 'var(--r-lg)',
                  boxShadow: active ? '0 6px 20px rgba(44,36,22,0.10)' : 'var(--shadow)',
                  transform: active ? 'translateY(-2px)' : 'none',
                  transition: 'var(--trans)',
                }}>
                <span className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ border: `1.5px solid ${active ? p.color : 'var(--border2)'}`, background: active ? p.color : 'transparent' }}>
                  {active && <Check size={12} color="#fff" strokeWidth={3} />}
                </span>

                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: p.tint }}>
                  <Icon size={22} color={p.color} />
                </div>

                <p className="serif font-bold mb-1.5" style={{ fontSize: 16, color: 'var(--text)' }}>{p.title}</p>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text3)' }}>{p.sub}</p>

                <span className="mt-auto kicker" style={{ color: p.color }}>{p.badge}</span>
              </button>
            )
          })}
        </div>

        <p className="text-center kicker mt-10">One ledger. Every counter.</p>
      </div>
    </div>
  )
}

/* ─── Owner Portal nav ───────────────────────────────────────── */
// `ownerOnly` items are hidden from Employee accounts. The backend enforces this for real
// (403 on the API) — this is UX only, so a curious Employee doesn't even see the door.
const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/orders',  icon: ShoppingBag,     label: 'Orders'    },
      { to: '/billing', icon: ShoppingCart,    label: 'Billing'   },
    ]
  },
  {
    label: 'Manage',
    items: [
      { to: '/customers',    icon: Users,          label: 'Udhaar Book' },
      { to: '/wa-reminders', icon: MessageCircle,   label: 'Reminders' },
      { to: '/inventory',    icon: Package,         label: 'Inventory' },
      { to: '/suppliers',    icon: Truck,           label: 'Suppliers', ownerOnly: true },
    ]
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics',       icon: BarChart2, label: 'Analytics',     ownerOnly: true },
      { to: '/kharcha-khata',   icon: BookOpen,  label: 'Kharcha Khata', ownerOnly: true },
    ]
  },
  {
    label: 'Store',
    items: [
      { to: '/staff', icon: UserCog, label: 'Staff & Riders', ownerOnly: true },
    ]
  }
]

function navGroupsForRole(role) {
  return navGroups
    .map(g => ({ ...g, items: g.items.filter(i => !i.ownerOnly || role === 'Owner') }))
    .filter(g => g.items.length > 0)
}

function Sidebar({ open, onClose, onSwitch, role }) {
  const groups = navGroupsForRole(role)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const check = async () => { try { await fetchOrders() } catch { /* ignore */ } setPendingCount(getPendingCount()) }
    check()
    window.addEventListener('orderStateChanged', check)
    const iv = setInterval(check, 5000)
    return () => { window.removeEventListener('orderStateChanged', check); clearInterval(iv) }
  }, [])

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block`}
        style={{ width: 224, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        {/* Wordmark */}
        <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="serif font-bold leading-tight" style={{ fontSize: 19, color: 'var(--text)' }}>Smart Kiryana</p>
            <p className="kicker mt-0.5">{role === 'Owner' ? 'Owner Portal' : 'Staff Portal'}</p>
          </div>
          <button className="lg:hidden p-1" style={{ color: 'var(--text3)' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {groups.map(group => (
            <div key={group.label}>
              <p className="kicker px-3 mb-1">{group.label}</p>
              {group.items.map(({ to, icon: Icon, label }) => {
                const badge = to === '/orders' ? pendingCount : 0
                return (
                  <NavLink key={to} to={to} end={to === '/'}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium mb-0.5"
                    style={({ isActive }) => ({
                      background: isActive ? 'var(--surface3)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text2)',
                      borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      transition: 'var(--trans)',
                    })}
                    onClick={onClose}>
                    <Icon size={15} />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="text-[10px] font-bold px-1.5 leading-tight"
                        style={{ background: 'var(--accent)', color: '#f3ede1' }}>
                        {badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer nameplate */}
        <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="px-3 py-3" style={{ background: 'var(--surface2)', borderLeft: '2px solid var(--gold)' }}>
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
              {auth.getProfile()?.storeName || 'Your Store'}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{auth.getProfile()?.fullName || role}</p>
          </div>
          <button onClick={onSwitch}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium"
            style={{ color: 'var(--text3)', transition: 'var(--trans)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)' }}>
            <LogOut size={13} />
            Switch Portal
          </button>
        </div>
      </aside>
    </>
  )
}

function OwnerLayout({ onSwitch, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const allNavItems = navGroupsForRole(role).flatMap(g => g.items)
  const current = allNavItems.find(n =>
    n.to === location.pathname || (n.to !== '/' && location.pathname.startsWith(n.to))
  )
  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
  const isOwner = role === 'Owner'

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: 'var(--bg)' }}>
      <GroceryBackdrop variant="subtle" fixed />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSwitch={onSwitch} role={role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5"
              style={{ color: 'var(--text3)' }}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="serif font-bold leading-tight" style={{ fontSize: 18, color: 'var(--text)' }}>
                {current?.label || 'Dashboard'}
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--text3)' }}>{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--forest)' }} />
            <span className="kicker">Live</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/orders"    element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/billing"   element={<Billing />} />
            <Route path="/wa-reminders"   element={<WhatsAppReminders />} />
            {isOwner && <Route path="/suppliers" element={<Suppliers />} />}
            {isOwner && <Route path="/analytics" element={<Analytics />} />}
            {isOwner && <Route path="/kharcha-khata" element={<KharchaKhata />} />}
            {isOwner && <Route path="/staff" element={<Staff />} />}
          </Routes>
        </main>
      </div>
    </div>
  )
}

/* ─── Root ────────────────────────────────────────────────────── */
const TOAST_OPTS = {
  style: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '13px', background: '#ffffff', color: '#2c2416', border: '1px solid #ecdfc0', borderRadius: '8px', boxShadow: '0 4px 14px rgba(44,36,22,0.1)' },
  success: { iconTheme: { primary: '#4c7a41', secondary: '#ffffff' } },
  error:   { iconTheme: { primary: '#c1392b', secondary: '#ffffff' } },
}

export default function App() {
  const [portal, setPortal] = useState(() => localStorage.getItem('k_portal') || null)
  const [authed, setAuthed] = useState(() => !!auth.getToken())
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup'

  const selectPortal = p => { localStorage.setItem('k_portal', p); setPortal(p) }
  const switchPortal = () => { localStorage.removeItem('k_portal'); auth.clearToken(); setAuthed(false); setPortal(null); setAuthMode('login') }

  useEffect(() => {
    const onExpired = () => setAuthed(false)
    window.addEventListener('k_auth_expired', onExpired)
    return () => window.removeEventListener('k_auth_expired', onExpired)
  }, [])

  if (!portal) return (
    <>
      <Toaster position="top-right" toastOptions={TOAST_OPTS} />
      <PortalSelect onSelect={selectPortal} />
    </>
  )

  if (portal === 'customer') return (
    <>
      <Toaster position="top-right" toastOptions={TOAST_OPTS} />
      <CustomerPortal onSwitch={switchPortal} />
    </>
  )

  if (portal === 'rider') {
    if (!authed || auth.getRole() !== 'Rider') return (
      <>
        <Toaster position="top-right" toastOptions={TOAST_OPTS} />
        <Login
          onSuccess={() => setAuthed(true)}
          requiredRole="Rider"
          kicker="Rider Sign-in"
          title="On the road"
          subtitle="Sign in to see your deliveries"
        />
      </>
    )
    return (
      <>
        <Toaster position="top-right" toastOptions={TOAST_OPTS} />
        <RiderPortal onSwitch={switchPortal} />
      </>
    )
  }

  if (!authed && authMode === 'signup') return (
    <>
      <Toaster position="top-right" toastOptions={TOAST_OPTS} />
      <Signup onSuccess={() => setAuthed(true)} onBack={() => setAuthMode('login')} />
    </>
  )

  if (!authed) return (
    <>
      <Toaster position="top-right" toastOptions={TOAST_OPTS} />
      <Login onSuccess={() => setAuthed(true)} onCreateStore={() => setAuthMode('signup')} />
    </>
  )

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={TOAST_OPTS} />
      <OwnerLayout onSwitch={switchPortal} role={auth.getRole()} />
    </BrowserRouter>
  )
}
