import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, Users, Package,
  AlertTriangle, Clock, X, ChevronRight,
} from 'lucide-react'
import { saleApi, customerApi } from '../services/api'
import toast from 'react-hot-toast'

const fmt = n => `Rs. ${Number(n || 0).toLocaleString()}`

/* ─── Tooltip (follows cursor) ───────────────────────────────── */
function Tooltip({ lines, children }) {
  const [show, setShow]   = useState(false)
  const [pos, setPos]     = useState({ x: 0, y: 0 })
  return (
    <div style={{ display: 'contents' }}
      onMouseEnter={e => { setShow(true); setPos({ x: e.clientX, y: e.clientY }) }}
      onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setShow(false)}>
      {children}
      {show && lines?.length > 0 && (
        <div style={{
          position: 'fixed', left: pos.x + 14, top: pos.y - 10,
          zIndex: 9999, pointerEvents: 'none',
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 8, padding: '8px 12px', minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        }}>
          {lines.map((l, i) => (
            <p key={i} style={{
              fontSize: 11, whiteSpace: 'nowrap', marginBottom: i < lines.length - 1 ? 3 : 0,
              color: l.color || 'var(--text)', fontWeight: l.bold ? 700 : 400,
            }}>{l.label}</p>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Drill-down modal ───────────────────────────────────────── */
function DrillModal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="card w-full max-w-lg flex flex-col" style={{ maxHeight: '88vh' }}>
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{title}</h3>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose}><X size={14} style={{ color: 'var(--text3)' }} /></button>
        </div>
        <div className="overflow-y-auto flex-1 space-y-2">{children}</div>
      </div>
    </div>
  )
}

/* ─── Mini progress bar ──────────────────────────────────────── */
function MiniProgress({ value, max, color, tooltip, onClick }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const bar = (
    <div className="progress-bar mt-1.5" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
  return tooltip ? <Tooltip lines={tooltip}>{bar}</Tooltip> : bar
}

/* ─── Stat card (clickable) ──────────────────────────────────── */
const ICON_COLORS = {
  green:  { bg: 'rgba(0,212,170,0.12)',  icon: 'var(--accent)' },
  red:    { bg: 'rgba(255,71,87,0.12)',   icon: 'var(--red)' },
  blue:   { bg: 'rgba(91,138,245,0.12)', icon: 'var(--blue)' },
  yellow: { bg: 'rgba(255,214,10,0.12)', icon: 'var(--yellow)' },
  orange: { bg: 'rgba(255,107,53,0.12)', icon: 'var(--orange)' },
  purple: { bg: 'rgba(168,85,247,0.12)', icon: '#a855f7' },
}
const TOP_BORDER = {
  green: 'var(--accent)', red: 'var(--red)', blue: 'var(--blue)',
  yellow: 'var(--yellow)', orange: 'var(--orange)', purple: '#a855f7',
}

function StatCard({ icon: Icon, label, value, sub, color, onClick, tooltip }) {
  const ic = ICON_COLORS[color] || ICON_COLORS.green
  const card = (
    <div
      className="stat-card relative"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = '' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: TOP_BORDER[color] || 'var(--accent)' }} />
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text3)' }}>{label}</p>
          <p className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--text)' }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="p-2.5 rounded-xl" style={{ background: ic.bg }}>
            <Icon size={18} style={{ color: ic.icon }} />
          </div>
          {onClick && <ChevronRight size={10} style={{ color: 'var(--text3)' }} />}
        </div>
      </div>
    </div>
  )
  return tooltip ? <Tooltip lines={tooltip}>{card}</Tooltip> : card
}

/* ─── Sale detail row (reusable) ─────────────────────────────── */
function SaleRow({ sale, onClick }) {
  const profit = sale.profit ?? (sale.totalRevenue - sale.totalCost)
  const m = sale.totalRevenue > 0 ? Math.round((profit / sale.totalRevenue) * 100) : 0
  return (
    <div className="flex items-center justify-between py-2.5 rounded-lg px-2"
      style={{ borderBottom: '1px solid var(--border)', cursor: onClick ? 'pointer' : 'default', transition: 'background 0.12s' }}
      onClick={onClick}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = '' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{sale.customerName}</p>
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          {new Date(sale.saleDate).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
          {sale.items?.length ? ` · ${sale.items.length} item${sale.items.length !== 1 ? 's' : ''}` : ''}
        </p>
      </div>
      <div className="text-right ml-3 flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmt(sale.totalRevenue)}</p>
        <p className="text-xs" style={{ color: 'var(--accent)' }}>+{fmt(profit)} · {m}%</p>
      </div>
    </div>
  )
}

/* ─── Sale items drill modal ─────────────────────────────────── */
function SaleDrill({ sale, onClose }) {
  const profit = sale.profit ?? (sale.totalRevenue - sale.totalCost)
  const m = sale.totalRevenue > 0 ? Math.round((profit / sale.totalRevenue) * 100) : 0
  return (
    <DrillModal
      title={`Sale #${sale.id} — ${sale.customerName}`}
      subtitle={new Date(sale.saleDate).toLocaleString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      onClose={onClose}>
      {sale.items?.length > 0 ? (
        <>
          <div className="space-y-1.5 mb-3">
            {sale.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'var(--surface2)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{it.itemName}</p>
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>
                    {it.quantity} × Rs {it.unitPrice?.toLocaleString() ?? '—'}
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  {fmt((it.unitPrice || 0) * it.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { l: 'Total Revenue', v: fmt(sale.totalRevenue), c: 'var(--text)' },
              { l: 'Profit',        v: fmt(profit),            c: 'var(--accent)' },
              { l: 'Margin',        v: `${m}%`,                c: m >= 20 ? 'var(--accent)' : m >= 10 ? 'var(--yellow)' : 'var(--red)' },
            ].map(({ l, v, c }) => (
              <div key={l} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text2)' }}>{l}</span>
                <span className="font-bold" style={{ color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text3)' }}>No item detail available for this sale.</p>
      )}
    </DrillModal>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────── */
export default function Dashboard() {
  const [data, setData]           = useState(null)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [drill, setDrill]         = useState(null)   // generic { title, subtitle, content }
  const [drillSale, setDrillSale] = useState(null)   // individual sale for item-level drill

  useEffect(() => {
    Promise.all([saleApi.getDashboard(), customerApi.getAll()])
      .then(([d, c]) => { setData(d); setCustomers(c) })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }} />
    </div>
  )
  if (!data) return (
    <div className="card text-center py-12">
      <Package size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text3)' }} />
      <p style={{ color: 'var(--text2)' }}>Failed to load dashboard. Make sure the backend is running.</p>
    </div>
  )

  const margin       = data.todayRevenue > 0 ? Math.round((data.todayProfit  / data.todayRevenue)  * 100) : 0
  const monthMargin  = data.monthRevenue > 0 ? Math.round((data.monthProfit  / data.monthRevenue)  * 100) : 0
  const debtors      = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance)
  const totalUdhaar  = debtors.reduce((s, c) => s + c.balance, 0)

  const alerts = [
    ...(data.lowStockItems || []).map(item => ({
      type: item.quantity === 0 ? 'urgent' : 'warn',
      icon: item.quantity === 0 ? '🚨' : '⚠️',
      title: item.quantity === 0 ? `${item.name} — OUT OF STOCK` : `${item.name} — Low Stock`,
      desc: `${item.quantity} ${item.unit} remaining (min: ${item.lowStockThreshold})`,
      drill: {
        title: item.name,
        subtitle: item.quantity === 0 ? 'Out of stock' : `${item.quantity} ${item.unit} remaining`,
        content: (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Current Stock',   v: `${item.quantity} ${item.unit}`,   c: item.quantity === 0 ? 'var(--red)' : 'var(--orange)' },
                { l: 'Alert Threshold', v: `${item.lowStockThreshold} ${item.unit}`, c: 'var(--text2)' },
                { l: 'Sell Price',      v: fmt(item.sellingPrice),              c: 'var(--text)' },
                { l: 'Cost Price',      v: fmt(item.costPrice),                 c: 'var(--text2)' },
              ].map(({ l, v, c }) => (
                <div key={l} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                  <p className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text3)' }}>{l}</p>
                  <p className="text-sm font-bold" style={{ color: c }}>{v}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg flex items-center gap-2"
              style={{ background: 'rgba(255,107,53,0.07)', border: '1px solid rgba(255,107,53,0.2)' }}>
              <AlertTriangle size={13} style={{ color: 'var(--orange)' }} />
              <p className="text-xs" style={{ color: 'var(--orange)' }}>
                Go to Inventory → Reorder to send WhatsApp message to supplier
              </p>
            </div>
          </div>
        ),
      },
    })),
    totalUdhaar > 0 && {
      type: 'info', icon: '📋',
      title: `${fmt(totalUdhaar)} outstanding udhaar`,
      desc: `Across ${debtors.length} customer${debtors.length !== 1 ? 's' : ''} — check Udhaar Book`,
      drill: {
        title: 'Outstanding Udhaar',
        subtitle: `${debtors.length} customers · ${fmt(totalUdhaar)} total`,
        content: (
          <div className="space-y-1.5">
            {debtors.map(c => {
              const risk  = c.balance >= 5000 ? 'High' : c.balance >= 1000 ? 'Medium' : 'Low'
              const rc    = c.balance >= 5000 ? 'var(--red)' : c.balance >= 1000 ? 'var(--yellow)' : 'var(--accent)'
              const pct   = totalUdhaar > 0 ? Math.round(c.balance / totalUdhaar * 100) : 0
              return (
                <div key={c.id} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.name}</p>
                    <span className="text-sm font-bold" style={{ color: rc }}>{fmt(c.balance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ flex: 1, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: rc, borderRadius: 2 }} />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: rc }}>{risk}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ),
      },
    },
  ].filter(Boolean)

  /* ── Drill content builders ── */
  const todaySalesDrill = {
    title: "Today's Sales",
    subtitle: `${data.recentSales?.length || 0} transactions · ${fmt(data.todayRevenue)}`,
    content: data.recentSales?.length > 0 ? (
      <div>
        {data.recentSales.map(s => (
          <SaleRow key={s.id} sale={s} onClick={() => setDrillSale(s)} />
        ))}
        <div className="pt-3 flex justify-between text-sm font-bold mt-1"
          style={{ borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text2)' }}>Total Revenue</span>
          <span style={{ color: 'var(--accent)' }}>{fmt(data.todayRevenue)}</span>
        </div>
      </div>
    ) : <p className="text-sm text-center py-8" style={{ color: 'var(--text3)' }}>No sales recorded today.</p>,
  }

  const todayCostDrill = {
    title: 'Cost of Goods — Today',
    subtitle: `COGS ${fmt(data.todayCost)} · Gross margin ${margin}%`,
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Revenue',      v: fmt(data.todayRevenue), c: 'var(--accent)' },
            { l: 'COGS',         v: fmt(data.todayCost),    c: 'var(--red)' },
            { l: 'Gross Profit', v: fmt(data.todayRevenue - data.todayCost), c: 'var(--blue)' },
            { l: 'Gross Margin', v: `${margin}%`, c: margin >= 25 ? 'var(--accent)' : margin >= 12 ? 'var(--yellow)' : 'var(--red)' },
          ].map(({ l, v, c }) => (
            <div key={l} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
              <p className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text3)' }}>{l}</p>
              <p className="text-base font-extrabold" style={{ color: c }}>{v}</p>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text3)' }}>Cost ratio</p>
          <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${data.todayRevenue > 0 ? Math.round((data.todayCost / data.todayRevenue) * 100) : 0}%`, background: 'var(--red)', borderRadius: 4 }} />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
            {data.todayRevenue > 0 ? Math.round((data.todayCost / data.todayRevenue) * 100) : 0}% of revenue is cost
          </p>
        </div>
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          COGS = sum of purchase cost for all items sold today. To improve this, negotiate better supplier prices or focus on high-margin items.
        </p>
      </div>
    ),
  }

  const todayProfitDrill = {
    title: "Today's Profit Analysis",
    subtitle: `${fmt(data.todayProfit)} net · ${margin}% margin`,
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Revenue',   v: fmt(data.todayRevenue), c: 'var(--accent)' },
            { l: 'COGS',      v: fmt(data.todayCost),    c: 'var(--red)' },
            { l: 'Profit',    v: fmt(data.todayProfit),  c: 'var(--blue)' },
            { l: 'Margin',    v: `${margin}%`,           c: margin >= 25 ? 'var(--accent)' : margin >= 12 ? 'var(--yellow)' : 'var(--red)' },
          ].map(({ l, v, c }) => (
            <div key={l} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
              <p className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text3)' }}>{l}</p>
              <p className="text-base font-extrabold" style={{ color: c }}>{v}</p>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ background: margin >= 25 ? 'rgba(0,212,170,0.07)' : margin >= 12 ? 'rgba(255,214,10,0.07)' : 'rgba(255,71,87,0.07)', border: `1px solid ${margin >= 25 ? 'rgba(0,212,170,0.2)' : margin >= 12 ? 'rgba(255,214,10,0.2)' : 'rgba(255,71,87,0.2)'}` }}>
          <p className="text-xs font-semibold" style={{ color: margin >= 25 ? 'var(--accent)' : margin >= 12 ? 'var(--yellow)' : 'var(--red)' }}>
            {margin >= 25 ? '✅ Healthy margin — above 25% target' : margin >= 12 ? '⚠ Slim margin — below 25% target' : '🔴 Low margin — focus on higher-margin items'}
          </p>
        </div>
      </div>
    ),
  }

  const udhaarDrill = {
    title: 'Outstanding Udhaar',
    subtitle: `${debtors.length} customers · ${fmt(totalUdhaar)} total`,
    content: debtors.length === 0 ? (
      <p className="text-sm text-center py-8" style={{ color: 'var(--text3)' }}>No outstanding udhaar!</p>
    ) : (
      <div className="space-y-1.5">
        {debtors.map(c => {
          const risk = c.balance >= 5000 ? 'High' : c.balance >= 1000 ? 'Medium' : 'Low'
          const rc   = c.balance >= 5000 ? 'var(--red)' : c.balance >= 1000 ? 'var(--yellow)' : 'var(--accent)'
          return (
            <div key={c.id} className="flex justify-between items-center py-2"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.name}</p>
                <p className="text-xs" style={{ color: rc }}>Risk: {risk}</p>
              </div>
              <span className="text-sm font-bold" style={{ color: rc }}>{fmt(c.balance)}</span>
            </div>
          )
        })}
        <div className="pt-2 flex justify-between text-sm font-bold">
          <span style={{ color: 'var(--text2)' }}>Total Pending</span>
          <span style={{ color: 'var(--red)' }}>{fmt(totalUdhaar)}</span>
        </div>
      </div>
    ),
  }

  const monthRevDrill = {
    title: 'Month Revenue Breakdown',
    subtitle: `${fmt(data.monthRevenue)} this month · ${monthMargin}% margin`,
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'Month Revenue', v: fmt(data.monthRevenue), c: 'var(--accent)' },
            { l: 'Month Profit',  v: fmt(data.monthProfit),  c: 'var(--blue)' },
            { l: 'Month Margin',  v: `${monthMargin}%`,      c: monthMargin >= 25 ? 'var(--accent)' : 'var(--yellow)' },
            { l: 'Today Revenue', v: fmt(data.todayRevenue), c: 'var(--text2)' },
          ].map(({ l, v, c }) => (
            <div key={l} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
              <p className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text3)' }}>{l}</p>
              <p className="text-base font-extrabold" style={{ color: c }}>{v}</p>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'var(--text3)' }}>Today as % of Month</span>
            <span className="font-bold" style={{ color: 'var(--accent)' }}>
              {data.monthRevenue > 0 ? Math.round((data.todayRevenue / data.monthRevenue) * 100) : 0}%
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3, background: 'var(--accent)',
              width: `${data.monthRevenue > 0 ? Math.min(100, (data.todayRevenue / data.monthRevenue) * 100) : 0}%`,
            }} />
          </div>
        </div>
      </div>
    ),
  }

  const lowStockDrill = {
    title: 'Low Stock Items',
    subtitle: `${data.lowStockCount} items need restocking`,
    content: (data.lowStockItems || []).length === 0 ? (
      <p className="text-sm text-center py-8" style={{ color: 'var(--text3)' }}>All items well stocked!</p>
    ) : (
      <div className="space-y-2">
        {data.lowStockItems.map(item => {
          const pct = item.lowStockThreshold > 0
            ? Math.min(100, Math.round((item.quantity / item.lowStockThreshold) * 100)) : 0
          const color = item.quantity === 0 ? 'var(--red)' : 'var(--orange)'
          return (
            <div key={item.id} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
              <div className="flex justify-between mb-1.5">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.name}</p>
                <span className={item.quantity === 0 ? 'badge-red' : 'badge-yellow'}>
                  {item.quantity === 0 ? 'OUT' : `${item.quantity} ${item.unit}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ flex: 1, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                  min {item.lowStockThreshold}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    ),
  }

  return (
    <div className="space-y-5">
      {/* Generic drill modal */}
      {drill && (
        <DrillModal title={drill.title} subtitle={drill.subtitle} onClose={() => setDrill(null)}>
          {drill.content}
        </DrillModal>
      )}
      {/* Sale item drill modal */}
      {drillSale && <SaleDrill sale={drillSale} onClose={() => setDrillSale(null)} />}

      {/* Today */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
          Today <span className="normal-case font-normal">(click a card for detail)</span>
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={TrendingUp}   label="Revenue"      value={fmt(data.todayRevenue)}
            color="green"  onClick={() => setDrill(todaySalesDrill)}
            tooltip={[{ label: 'Today Revenue', bold: true }, { label: fmt(data.todayRevenue), color: 'var(--accent)' }, { label: 'Click for sales detail', color: 'var(--text3)' }]} />
          <StatCard icon={TrendingDown} label="Cost (COGS)"  value={fmt(data.todayCost)}
            color="red"    onClick={() => setDrill(todayCostDrill)}
            tooltip={[{ label: 'Cost of Goods Sold', bold: true }, { label: fmt(data.todayCost), color: 'var(--red)' }, { label: `${margin}% gross margin`, color: 'var(--text3)' }]} />
          <StatCard icon={DollarSign}   label="Profit"       value={fmt(data.todayProfit)}
            sub={`${margin}% margin`}
            color="blue"   onClick={() => setDrill(todayProfitDrill)}
            tooltip={[{ label: 'Today Profit', bold: true }, { label: fmt(data.todayProfit), color: 'var(--blue)' }, { label: `${margin}% net margin`, color: margin >= 25 ? 'var(--accent)' : 'var(--yellow)' }]} />
          <StatCard icon={Users}        label="Total Udhaar" value={fmt(data.totalUdhaar)}
            sub={`${debtors.length} debtors`}
            color="yellow" onClick={() => setDrill(udhaarDrill)}
            tooltip={[{ label: 'Outstanding Udhaar', bold: true }, { label: fmt(totalUdhaar), color: 'var(--yellow)' }, { label: `${debtors.length} customers`, color: 'var(--text3)' }]} />
        </div>
      </div>

      {/* This Month */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
          This Month <span className="normal-case font-normal">(click a card for detail)</span>
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard icon={TrendingUp} label="Month Revenue"   value={fmt(data.monthRevenue)}
            color="green"  onClick={() => setDrill(monthRevDrill)}
            tooltip={[{ label: 'Month Revenue', bold: true }, { label: fmt(data.monthRevenue), color: 'var(--accent)' }]} />
          <StatCard icon={DollarSign} label="Month Profit"    value={fmt(data.monthProfit)}
            sub={`${monthMargin}% margin`}
            color="purple" onClick={() => setDrill({ title: 'Month Profit', subtitle: `${monthMargin}% net margin`, content: monthRevDrill.content })}
            tooltip={[{ label: 'Month Profit', bold: true }, { label: fmt(data.monthProfit), color: '#a855f7' }, { label: `${monthMargin}% margin`, color: 'var(--text3)' }]} />
          <StatCard icon={Package}    label="Low Stock Items" value={data.lowStockCount}
            sub={`of ${data.totalItems} total`}
            color={data.lowStockCount > 0 ? 'red' : 'green'}
            onClick={() => setDrill(lowStockDrill)}
            tooltip={[{ label: 'Low Stock Items', bold: true }, { label: `${data.lowStockCount} need restocking`, color: data.lowStockCount > 0 ? 'var(--red)' : 'var(--accent)' }]} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Smart Alerts */}
        <div className="card">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: 'var(--orange)' }} />
              <h3 className="section-title">Smart Alerts</h3>
            </div>
            {alerts.length > 0 && <span className="badge-red">{alerts.length} need attention</span>}
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Everything looks good!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <Tooltip key={i} lines={alert.drill ? [{ label: alert.title, bold: true }, { label: 'Click for detail', color: 'var(--text3)' }] : null}>
                  <div
                    className={`alert-item alert-${alert.type}`}
                    style={{ cursor: alert.drill ? 'pointer' : 'default' }}
                    onClick={() => alert.drill && setDrill(alert.drill)}>
                    <span className="text-base mt-0.5 flex-shrink-0">{alert.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text)' }}>{alert.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{alert.desc}</p>
                    </div>
                    {alert.drill && <ChevronRight size={13} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
                  </div>
                </Tooltip>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="card">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: 'var(--text3)' }} />
              <h3 className="section-title">Recent Sales</h3>
            </div>
            {data.recentSales?.length > 0 && (
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>click row for items</span>
            )}
          </div>
          {!data.recentSales?.length ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text3)' }}>No sales today yet.</p>
            </div>
          ) : (
            <div>
              {data.recentSales.map(sale => (
                <SaleRow key={sale.id} sale={sale} onClick={() => setDrillSale(sale)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low stock detail */}
      {data.lowStockItems?.length > 0 && (
        <div className="card">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Package size={16} style={{ color: 'var(--red)' }} />
              <h3 className="section-title">Low Stock Detail</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>click a bar for detail</span>
              <span className="badge-red">{data.lowStockItems.length} items</span>
            </div>
          </div>
          <div className="space-y-3">
            {data.lowStockItems.map(item => {
              const pct   = item.lowStockThreshold > 0
                ? Math.min(100, Math.round((item.quantity / item.lowStockThreshold) * 100)) : 0
              const color = item.quantity === 0 ? 'var(--red)' : 'var(--orange)'
              const itemDrill = {
                title: item.name,
                subtitle: item.quantity === 0 ? 'Out of stock' : `${item.quantity} ${item.unit} remaining`,
                content: (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { l: 'Stock',      v: `${item.quantity} ${item.unit}`,        c: color },
                        { l: 'Min Threshold', v: `${item.lowStockThreshold} ${item.unit}`, c: 'var(--text2)' },
                        { l: 'Sell Price', v: fmt(item.sellingPrice),                 c: 'var(--text)' },
                        { l: 'Stock %',    v: `${pct}% of threshold`,                 c: pct < 50 ? 'var(--red)' : 'var(--yellow)' },
                      ].map(({ l, v, c }) => (
                        <div key={l} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                          <p className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text3)' }}>{l}</p>
                          <p className="text-sm font-bold" style={{ color: c }}>{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                      <p className="text-xs mb-1.5" style={{ color: 'var(--text3)' }}>Stock level vs threshold</p>
                      <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  </div>
                ),
              }
              return (
                <div key={item.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDrill(itemDrill)}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{item.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--text3)' }}>{item.unit}</span>
                      <span className={item.quantity === 0 ? 'badge-red' : 'badge-yellow'}>
                        {item.quantity === 0 ? 'OUT' : `${item.quantity} left`}
                      </span>
                    </div>
                  </div>
                  <MiniProgress
                    value={item.quantity} max={item.lowStockThreshold * 2} color={color}
                    tooltip={[
                      { label: item.name, bold: true },
                      { label: `${item.quantity} ${item.unit} remaining`, color },
                      { label: `Alert threshold: ${item.lowStockThreshold} ${item.unit}`, color: 'var(--text3)' },
                      { label: `${pct}% of threshold`, color: pct < 50 ? 'var(--red)' : 'var(--yellow)' },
                    ]}
                    onClick={() => setDrill(itemDrill)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
