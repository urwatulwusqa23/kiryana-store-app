import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard, Users, Package, Truck, ShoppingCart,
  BarChart2, Menu, Store, ShoppingBag, ChevronRight, LogOut, X, MessageCircle, BookOpen,
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
import CustomerPortal from './portals/CustomerPortal'
import RiderPortal    from './portals/RiderPortal'
import { getPendingCount } from './store/orderStore'

/* ─── Portal definitions ─────────────────────────────────────── */
const PORTALS = [
  {
    key: 'owner',
    emoji: '🏪',
    accent: '#00d4aa',
    glow: 'rgba(0,212,170,0.08)',
    border: 'rgba(0,212,170,0.25)',
    title: 'Owner Portal',
    sub: 'Manage inventory, udhaar, billing, suppliers & analytics',
    badge: 'Full Management',
  },
  {
    key: 'customer',
    emoji: '🛒',
    accent: '#ff6b35',
    glow: 'rgba(255,107,53,0.08)',
    border: 'rgba(255,107,53,0.25)',
    title: 'Customer Portal',
    sub: 'Browse & order from the store, track your delivery live',
    badge: 'Shop Online',
  },
  {
    key: 'rider',
    emoji: '🛵',
    accent: '#ffd60a',
    glow: 'rgba(255,214,10,0.08)',
    border: 'rgba(255,214,10,0.25)',
    title: 'Rider Portal',
    sub: 'View assigned deliveries, update status & track earnings',
    badge: 'Deliveries',
  },
]

/* ─── Portal Selector ────────────────────────────────────────── */
function PortalSelect({ onSelect }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: `radial-gradient(ellipse at 25% 25%, rgba(0,212,170,0.06) 0%, transparent 55%),
                     radial-gradient(ellipse at 75% 75%, rgba(91,138,245,0.05) 0%, transparent 55%),
                     var(--bg)`
      }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af5)', color: '#000' }}>
            K
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Smart Kiryana</h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text3)' }}>Choose your portal to continue</p>
        </div>

        <div className="space-y-3">
          {PORTALS.map(p => (
            <button key={p.key}
              onClick={() => onSelect(p.key)}
              onMouseEnter={() => setHovered(p.key)}
              onMouseLeave={() => setHovered(null)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 relative overflow-hidden"
              style={{
                background: hovered === p.key
                  ? `radial-gradient(ellipse at top left, ${p.glow}, transparent 70%), var(--surface)`
                  : 'var(--surface)',
                border: `1px solid ${hovered === p.key ? p.border : 'var(--border)'}`,
                transform: hovered === p.key ? 'translateY(-2px)' : 'none',
                boxShadow: hovered === p.key ? '0 8px 32px rgba(0,0,0,0.35)' : 'none',
              }}>
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: `${p.accent}1a`, border: `1px solid ${p.accent}30` }}>
                {p.emoji}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm" style={{ color: p.accent }}>{p.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{ background: `${p.accent}1a`, color: p.accent }}>
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs leading-snug" style={{ color: 'var(--text3)' }}>{p.sub}</p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text3)', flexShrink: 0 }} />
            </button>
          ))}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: 'var(--text3)' }}>
          Ahmed General Store · Gulberg III, Lahore
        </p>
      </div>
    </div>
  )
}

/* ─── Owner Portal nav ───────────────────────────────────────── */
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
      { to: '/suppliers',    icon: Truck,           label: 'Suppliers' },
    ]
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics',       icon: BarChart2, label: 'Analytics'      },
      { to: '/kharcha-khata',   icon: BookOpen,  label: 'Kharcha Khata'  },
    ]
  }
]

const allNavItems = navGroups.flatMap(g => g.items)

function Sidebar({ open, onClose, onSwitch }) {
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const check = () => setPendingCount(getPendingCount())
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
        style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
              style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af5)', color: '#000' }}>
              K
            </div>
            <div>
              <p className="font-extrabold text-sm leading-tight" style={{ color: 'var(--text)' }}>Smart Kiryana</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text3)' }}>
                Owner Portal
              </p>
            </div>
          </div>
          <button className="lg:hidden p-1 rounded-lg" style={{ color: 'var(--text3)' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1"
                style={{ color: 'var(--text3)' }}>
                {group.label}
              </p>
              {group.items.map(({ to, icon: Icon, label }) => {
                const badge = to === '/orders' ? pendingCount : 0
                return (
                  <NavLink key={to} to={to} end={to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                        isActive ? 'active-nav' : 'inactive-nav'
                      }`
                    }
                    style={({ isActive }) => ({
                      background: isActive ? 'rgba(0,212,170,0.1)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text2)',
                    })}
                    onClick={onClose}>
                    <Icon size={15} />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                        style={{ background: 'var(--red)', color: '#fff' }}>
                        {badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--surface2)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,212,170,0.12)' }}>
              <Store size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>Ahmed General Store</p>
              <p className="text-[10px]" style={{ color: 'var(--text3)' }}>Gulberg III, Lahore</p>
            </div>
          </div>
          <button onClick={onSwitch}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ color: 'var(--text3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)' }}>
            <LogOut size={13} />
            Switch Portal
          </button>
        </div>
      </aside>
    </>
  )
}

function OwnerLayout({ onSwitch }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const current = allNavItems.find(n =>
    n.to === location.pathname || (n.to !== '/' && location.pathname.startsWith(n.to))
  )
  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSwitch={onSwitch} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text3)' }}
              onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-extrabold text-base leading-tight" style={{ color: 'var(--text)' }}>
                {current?.label || 'Dashboard'}
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--text3)' }}>{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text3)' }}>Live</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/orders"    element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/billing"   element={<Billing />} />
            <Route path="/analytics"      element={<Analytics />} />
            <Route path="/wa-reminders"   element={<WhatsAppReminders />} />
            <Route path="/kharcha-khata"  element={<KharchaKhata />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

/* ─── Root ────────────────────────────────────────────────────── */
const TOAST_OPTS = {
  style: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '13px', background: '#1e2535', color: '#e8edf5', border: '1px solid #2a3347' },
  success: { iconTheme: { primary: '#00d4aa', secondary: '#0d1117' } },
  error:   { iconTheme: { primary: '#ff4757', secondary: '#0d1117' } },
}

export default function App() {
  const [portal, setPortal] = useState(() => localStorage.getItem('k_portal') || null)

  const selectPortal = p => { localStorage.setItem('k_portal', p); setPortal(p) }
  const switchPortal = () => { localStorage.removeItem('k_portal'); setPortal(null) }

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

  if (portal === 'rider') return (
    <>
      <Toaster position="top-right" toastOptions={TOAST_OPTS} />
      <RiderPortal onSwitch={switchPortal} />
    </>
  )

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={TOAST_OPTS} />
      <OwnerLayout onSwitch={switchPortal} />
    </BrowserRouter>
  )
}
