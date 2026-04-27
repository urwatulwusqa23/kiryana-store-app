import { useEffect, useState } from 'react'
import { ShoppingBag, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { saleApi } from '../services/api'
import {
  getAllOrders, confirmOrder as doConfirm, RIDERS,
} from '../store/orderStore'
import toast from 'react-hot-toast'

const ORANGE = '#ff6b35'

const STATUS_META = {
  pending:    { bg: 'rgba(255,71,87,0.1)',   color: '#FF4757', label: '⏳ Pending'     },
  confirmed:  { bg: 'rgba(91,138,245,0.1)',  color: '#5b8af5', label: '✅ Confirmed'   },
  picked_up:  { bg: 'rgba(255,107,53,0.1)',  color: '#ff6b35', label: '📦 Picked Up'  },
  on_the_way: { bg: 'rgba(255,214,10,0.1)',  color: '#ffd60a', label: '🛵 On the Way' },
  delivered:  { bg: 'rgba(0,212,170,0.1)',   color: '#00d4aa', label: '✓ Delivered'   },
}

/* ─── Single order card ───────────────────────────────────────── */
function OrderCard({ sale, orderState, onConfirm }) {
  const [riderId, setRiderId] = useState('')
  const status = orderState.status
  const st = STATUS_META[status] || STATUS_META.pending

  return (
    <div className="card space-y-3"
      style={{ borderLeft: status === 'pending' ? '3px solid #FF4757' : '3px solid var(--border)' }}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              Order #{sale.id}
            </p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
              style={{ background: st.bg, color: st.color }}>
              {st.label}
            </span>
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text3)' }}>
            {sale.customerName}
            {orderState.address && <> · 📍 {orderState.address}</>}
          </p>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>
            {new Date(sale.saleDate).toLocaleDateString('en-PK', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
            {' · '}
            {new Date(sale.saleDate).toLocaleTimeString('en-PK', {
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <p className="font-bold text-base flex-shrink-0" style={{ color: ORANGE }}>
          Rs. {sale.totalRevenue?.toLocaleString()}
        </p>
      </div>

      {/* Items summary */}
      <div className="text-xs px-3 py-2 rounded-lg"
        style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
        {sale.items?.slice(0, 4).map(i => `${i.itemName} ×${i.quantity}`).join(' · ')}
        {(sale.items?.length || 0) > 4 && ` +${sale.items.length - 4} more`}
      </div>

      {/* Assigned rider info */}
      {orderState.riderName && status !== 'pending' && (
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          🛵 Assigned to{' '}
          <strong style={{ color: 'var(--text2)' }}>{orderState.riderName}</strong>
          {orderState.confirmedAt && (
            <> · confirmed{' '}
              {new Date(orderState.confirmedAt).toLocaleTimeString('en-PK', {
                hour: '2-digit', minute: '2-digit',
              })}
            </>
          )}
        </p>
      )}

      {/* Delivery timestamps */}
      {status === 'delivered' && orderState.deliveredAt && (
        <p className="text-xs" style={{ color: 'var(--accent)' }}>
          ✓ Delivered at{' '}
          {new Date(orderState.deliveredAt).toLocaleTimeString('en-PK', {
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      {/* Confirm + assign (only for pending orders) */}
      {status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <select
            className="input flex-1 text-sm"
            value={riderId}
            onChange={e => setRiderId(e.target.value)}>
            <option value="">— Select rider —</option>
            {RIDERS.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.area}
              </option>
            ))}
          </select>
          <button
            onClick={() => onConfirm(sale.id, riderId)}
            className="btn-primary px-4 text-sm flex-shrink-0">
            Confirm &amp; Assign
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Main Orders page ────────────────────────────────────────── */
export default function Orders() {
  const [sales,   setSales]   = useState([])
  const [states,  setStates]  = useState({})
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('pending')

  function refreshStates() { setStates({ ...getAllOrders() }) }

  async function load() {
    try {
      const data = await saleApi.getAll()
      setSales([...data].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)))
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    refreshStates()
    const h = () => refreshStates()
    window.addEventListener('orderStateChanged', h)
    const iv = setInterval(refreshStates, 4000)
    return () => { window.removeEventListener('orderStateChanged', h); clearInterval(iv) }
  }, [])

  function handleConfirm(saleId, riderId) {
    if (!riderId) return toast.error('Select a rider first')
    doConfirm(saleId, riderId)
    refreshStates()
    toast.success('Order confirmed and rider assigned!')
  }

  // Only show sales that have a state (placed via Customer Portal)
  const enriched = sales
    .map(s => ({ ...s, orderState: states[String(s.id)] || null }))
    .filter(s => s.orderState !== null)

  const pendingCount   = enriched.filter(s => s.orderState.status === 'pending').length
  const activeCount    = enriched.filter(s =>
    ['confirmed', 'picked_up', 'on_the_way'].includes(s.orderState.status)).length
  const deliveredCount = enriched.filter(s => s.orderState.status === 'delivered').length

  const FILTERS = [
    { key: 'pending',   label: '⏳ Pending',    count: pendingCount   },
    { key: 'active',    label: '🛵 In Transit', count: activeCount    },
    { key: 'delivered', label: '✓ Delivered',   count: deliveredCount },
    { key: 'all',       label: 'All',           count: enriched.length },
  ]

  const displayed = filter === 'pending'
    ? enriched.filter(s => s.orderState.status === 'pending')
    : filter === 'active'
      ? enriched.filter(s => ['confirmed', 'picked_up', 'on_the_way'].includes(s.orderState.status))
      : filter === 'delivered'
        ? enriched.filter(s => s.orderState.status === 'delivered')
        : enriched

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: ORANGE }} />
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Pending alert banner */}
      {pendingCount > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background: 'rgba(255,71,87,0.07)',
            border: '1px solid rgba(255,71,87,0.3)',
          }}>
          <AlertCircle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: 'var(--red)' }}>
              {pendingCount} order{pendingCount !== 1 ? 's' : ''} waiting for your confirmation
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
              Assign a rider below to start delivery
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'New Orders',  val: pendingCount,    color: 'var(--red)'    },
          { label: 'In Transit',  val: activeCount,     color: 'var(--yellow)' },
          { label: 'Delivered',   val: deliveredCount,  color: 'var(--accent)' },
          { label: 'Total',       val: enriched.length, color: 'var(--blue)'   },
        ].map(({ label, val, color }) => (
          <div key={label} className="stat-card">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
              style={{ background: color }} />
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: 'var(--text3)' }}>
              {label}
            </p>
            <p className="text-2xl font-extrabold" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: filter === f.key ? 'rgba(255,107,53,0.15)' : 'var(--surface)',
              color:      filter === f.key ? ORANGE : 'var(--text3)',
              border:     `1px solid ${filter === f.key ? ORANGE + '60' : 'var(--border)'}`,
            }}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Order list */}
      {displayed.length === 0 ? (
        <div className="card text-center py-16">
          <ShoppingBag size={36} className="mx-auto mb-3 opacity-20"
            style={{ color: 'var(--text3)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>
            {filter === 'pending' ? 'No pending orders right now' : 'No orders found'}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
            Orders placed from the Customer Portal appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(sale => (
            <OrderCard
              key={sale.id}
              sale={sale}
              orderState={sale.orderState}
              onConfirm={handleConfirm}
            />
          ))}
        </div>
      )}
    </div>
  )
}
