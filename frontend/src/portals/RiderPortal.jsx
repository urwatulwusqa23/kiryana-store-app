import { useEffect, useState } from 'react'
import { CheckCircle, Clock, ChevronRight, MapPin, Package } from 'lucide-react'
import { saleApi } from '../services/api'
import { getAllOrders, advanceOrder, STEPS } from '../store/orderStore'
import toast from 'react-hot-toast'

const YELLOW = '#ffd60a'
const RIDER  = { name: 'Asif Khan', area: 'Gulberg III, Lahore' }

const STATUS_META = {
  confirmed:  { color: '#5b8af5', bg: 'rgba(91,138,245,0.12)', label: 'Confirmed'   },
  picked_up:  { color: '#ff6b35', bg: 'rgba(255,107,53,0.12)', label: 'Picked Up'   },
  on_the_way: { color: '#ffd60a', bg: 'rgba(255,214,10,0.12)', label: 'On the Way'  },
  delivered:  { color: '#00d4aa', bg: 'rgba(0,212,170,0.12)',  label: '✓ Delivered' },
}

const NEXT_BTN = {
  confirmed:  '📦 Picked Up',
  picked_up:  '🛵 On the Way',
  on_the_way: '🏠 Mark Delivered',
}

/* ─── Shell ──────────────────────────────────────────────────── */
export default function RiderPortal({ onSwitch }) {
  const [sales,   setSales]   = useState([])
  const [states,  setStates]  = useState({})
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('active')

  async function loadSales() {
    try { setSales(await saleApi.getAll()) }
    catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function refreshStates() { setStates({ ...getAllOrders() }) }

  useEffect(() => {
    loadSales()
    refreshStates()
    const h = () => refreshStates()
    window.addEventListener('orderStateChanged', h)
    const iv = setInterval(refreshStates, 5000)
    return () => { window.removeEventListener('orderStateChanged', h); clearInterval(iv) }
  }, [])

  function handleAdvance(saleId) {
    const order = states[String(saleId)]
    if (!order) return
    advanceOrder(saleId)
    refreshStates()
    if (order.status === 'on_the_way') {
      toast.success('🏠 Delivery marked complete!')
    } else {
      toast.success('Status updated!')
    }
  }

  // Only orders tracked in the order store (placed via customer portal)
  const enriched = sales
    .map(s => ({ ...s, orderState: states[String(s.id)] || null }))
    .filter(s => s.orderState !== null)

  const active    = enriched.filter(s =>
    ['confirmed', 'picked_up', 'on_the_way'].includes(s.orderState.status))
  const delivered = enriched.filter(s => s.orderState.status === 'delivered')

  const TABS = [
    { key: 'active',    label: '🛵 Active Deliveries', badge: active.length    },
    { key: 'delivered', label: '✅ Delivered',          badge: delivered.length },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: `${YELLOW}1a`, border: `1px solid ${YELLOW}30` }}>
              🛵
            </div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>
                {RIDER.name}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--accent)' }} />
                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                  Rider · Online · {RIDER.area}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onSwitch}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            Switch Portal
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto flex" style={{ borderTop: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              style={{
                color:        tab === t.key ? YELLOW : 'var(--text3)',
                borderBottom: tab === t.key ? `2px solid ${YELLOW}` : '2px solid transparent',
              }}>
              {t.label}
              {t.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: tab === t.key ? YELLOW : 'var(--red)', color: tab === t.key ? '#000' : '#fff' }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border2)', borderTopColor: YELLOW }} />
          </div>
        ) : tab === 'active' ? (
          <ActiveDeliveries deliveries={active} onAdvance={handleAdvance} />
        ) : (
          <DeliveredOrders orders={delivered} />
        )}
      </div>
    </div>
  )
}

/* ─── Active Deliveries ──────────────────────────────────────── */
function ActiveDeliveries({ deliveries, onAdvance }) {
  if (deliveries.length === 0) return (
    <div className="text-center py-20 px-4">
      <div className="text-5xl mb-4">🛵</div>
      <p className="font-bold" style={{ color: 'var(--text2)' }}>No active deliveries</p>
      <p className="text-sm mt-1.5" style={{ color: 'var(--text3)' }}>
        Orders assigned to you will appear here
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
        Auto-refreshes every 5 seconds
      </p>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total',       val: deliveries.length,                                       color: 'var(--text)'   },
          { label: 'Confirmed',   val: deliveries.filter(d => d.orderState.status === 'confirmed').length,  color: '#5b8af5' },
          { label: 'In Transit',  val: deliveries.filter(d => ['picked_up','on_the_way'].includes(d.orderState.status)).length, color: YELLOW },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {deliveries.map(sale => (
        <DeliveryCard key={sale.id} sale={sale} onAdvance={onAdvance} />
      ))}
    </div>
  )
}

/* ─── Delivery Card ──────────────────────────────────────────── */
function DeliveryCard({ sale, onAdvance }) {
  const status = sale.orderState.status
  const sm     = STATUS_META[status] || STATUS_META.confirmed
  const currentIdx = STEPS.findIndex(s => s.key === status)

  // Progress from confirmed (idx 1) to delivered (idx 4)
  const progressSteps = STEPS.slice(1)  // confirmed → delivered
  const progressIdx   = currentIdx - 1  // 0 = confirmed, 3 = delivered

  return (
    <div className="overflow-hidden rounded-xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* Progress bar */}
      <div className="h-1" style={{ background: 'var(--surface3)' }}>
        <div className="h-full transition-all duration-700"
          style={{ width: `${(progressIdx / 3) * 100}%`, background: YELLOW }} />
      </div>

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Order #{sale.id}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text2)' }}>
              {sale.customerName}
            </p>
            {sale.orderState.address && (
              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text3)' }}>
                <MapPin size={10} /> {sale.orderState.address}
              </p>
            )}
            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text3)' }}>
              <Clock size={10} />
              {new Date(sale.saleDate).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-bold flex-shrink-0"
            style={{ background: sm.bg, color: sm.color }}>
            {sm.label}
          </span>
        </div>

        {/* Items */}
        <div className="text-xs px-3 py-2 rounded-lg"
          style={{ color: 'var(--text3)', background: 'var(--surface2)' }}>
          {sale.items?.map(i => `${i.itemName} ×${i.quantity}`).join(' · ')}
        </div>

        {/* Step progress dots */}
        <div className="flex items-center justify-between">
          {progressSteps.map((step, i) => (
            <div key={step.key} className="flex flex-col items-center gap-1"
              style={{ opacity: i <= progressIdx ? 1 : 0.3 }}>
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                style={{
                  background:   i < progressIdx ? YELLOW : 'transparent',
                  borderColor:  i <= progressIdx ? YELLOW : 'var(--border2)',
                  color:        i < progressIdx ? '#000' : i === progressIdx ? YELLOW : 'var(--text3)',
                }}>
                {i < progressIdx ? '✓' : step.icon}
              </div>
              <span className="text-[9px] font-semibold text-center leading-tight"
                style={{ color: i <= progressIdx ? YELLOW : 'var(--text3)', maxWidth: 48 }}>
                {step.label.split(' ').join('\n')}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-1">
          <p className="font-bold" style={{ color: 'var(--text)' }}>
            Rs. {sale.totalRevenue?.toLocaleString()}
          </p>
          {NEXT_BTN[status] ? (
            <button onClick={() => onAdvance(sale.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-black transition-all"
              style={{ background: YELLOW }}>
              {NEXT_BTN[status]} <ChevronRight size={13} />
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold"
              style={{ color: 'var(--accent)' }}>
              <CheckCircle size={14} /> Complete
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Delivered Orders ───────────────────────────────────────── */
function DeliveredOrders({ orders }) {
  const totalValue = orders.reduce((s, o) => s + (o.totalRevenue || 0), 0)

  if (orders.length === 0) return (
    <div className="text-center py-20 px-4">
      <CheckCircle size={40} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text3)' }} />
      <p className="font-bold" style={{ color: 'var(--text2)' }}>No delivered orders yet</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
        Completed deliveries will appear here
      </p>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      {/* Summary card */}
      <div className="card">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--text3)' }}>
          All-Time Summary
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(0,212,170,0.08)' }}>
            <p className="text-xl font-extrabold" style={{ color: 'var(--accent)' }}>
              {orders.length}
            </p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Deliveries</p>
          </div>
          <div className="rounded-xl p-3 text-center"
            style={{ background: `${YELLOW}0d` }}>
            <p className="text-sm font-extrabold" style={{ color: YELLOW }}>
              Rs. {totalValue.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Total Value</p>
          </div>
        </div>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--text3)' }}>
        {orders.length} deliveries
      </p>

      {orders.map(sale => (
        <div key={sale.id} className="card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Order #{sale.id}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text2)' }}>
                {sale.customerName}
              </p>
              {sale.orderState.address && (
                <p className="text-xs flex items-center gap-1 mt-0.5"
                  style={{ color: 'var(--text3)' }}>
                  <MapPin size={10} /> {sale.orderState.address}
                </p>
              )}
              {sale.orderState.deliveredAt && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>
                  ✓ Delivered{' '}
                  {new Date(sale.orderState.deliveredAt).toLocaleTimeString('en-PK', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="badge-green block">Delivered</span>
              <p className="text-sm font-bold mt-2" style={{ color: 'var(--text)' }}>
                Rs. {sale.totalRevenue?.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-xs px-3 py-2 rounded-lg"
            style={{ color: 'var(--text3)', background: 'var(--surface2)' }}>
            {sale.items?.map(i => `${i.itemName} ×${i.quantity}`).join(' · ')}
          </div>
        </div>
      ))}
    </div>
  )
}
