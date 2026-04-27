import { useEffect, useState } from 'react'
import { Package, Users, TrendingUp, DollarSign, AlertTriangle, BarChart2, Sun, MessageCircle, TrendingDown, Minus, X, ShoppingCart } from 'lucide-react'
import { itemApi, customerApi, saleApi } from '../services/api'
import toast from 'react-hot-toast'

const fmt  = n => `Rs. ${Number(n || 0).toLocaleString()}`
const fmtS = n => Number(n || 0).toLocaleString()

function isSameDay(dateStr, target) {
  const d = new Date(dateStr)
  return d.getFullYear() === target.getFullYear()
    && d.getMonth() === target.getMonth()
    && d.getDate() === target.getDate()
}

function calcDay(sales, date) {
  const ds = sales.filter(s => isSameDay(s.saleDate, date))
  return {
    revenue: ds.reduce((s, x) => s + x.totalRevenue, 0),
    cost:    ds.reduce((s, x) => s + x.totalCost,    0),
    profit:  ds.reduce((s, x) => s + (x.totalRevenue - x.totalCost), 0),
    count:   ds.length,
    sales:   ds,
  }
}

function buildDailySlip(today, todayStats, todayUdhaar, storeName = 'Kiryana Store') {
  const dateStr = today.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })
  const lines = [
    `📊 *Daily Closing — ${storeName}*`,
    `📅 ${dateStr}`,
    '━'.repeat(28),
    `💰 Revenue:  Rs ${fmtS(todayStats.revenue)}`,
    `🏷  Cost:     Rs ${fmtS(todayStats.cost)}`,
    `✅ Profit:   Rs ${fmtS(todayStats.profit)}`,
    `📝 Udhaar:   Rs ${fmtS(todayUdhaar)}`,
    `🧾 Orders:   ${todayStats.count}`,
    '━'.repeat(28),
    todayStats.revenue > 0
      ? `Margin: ${Math.round((todayStats.profit / todayStats.revenue) * 100)}%`
      : 'No sales today',
  ]
  return lines.join('\n')
}

/* ─── Tooltip ────────────────────────────────────────────────── */
function Tooltip({ lines, children, position = 'top' }) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })

  return (
    <div className="relative" style={{ display: 'contents' }}
      onMouseEnter={e => { setShow(true); setCoords({ x: e.clientX, y: e.clientY }) }}
      onMouseMove={e => setCoords({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setShow(false)}>
      {children}
      {show && lines && (
        <div style={{
          position: 'fixed',
          left: coords.x + 14,
          top: coords.y - 10,
          zIndex: 9999,
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 8,
          padding: '8px 12px',
          pointerEvents: 'none',
          minWidth: 140,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {lines.map((line, i) => (
            <p key={i} style={{
              fontSize: 11,
              color: line.color || 'var(--text)',
              fontWeight: line.bold ? 700 : 400,
              marginBottom: i < lines.length - 1 ? 2 : 0,
              whiteSpace: 'nowrap',
            }}>{line.label}</p>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Drill-down Modal ───────────────────────────────────────── */
function DrillModal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }}>
      <div className="card w-full max-w-lg flex flex-col" style={{ maxHeight: '88vh' }}>
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{title}</h3>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose}><X size={14} style={{ color: 'var(--text3)' }} /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

/* ─── Bar (with tooltip + click) ────────────────────────────── */
function Bar({ pct, color, tooltip, onClick }) {
  const bar = (
    <div className="h-2 rounded-full flex-1 overflow-hidden"
      style={{ background: 'var(--surface3)', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  )
  if (!tooltip) return bar
  return <Tooltip lines={tooltip}>{bar}</Tooltip>
}

/* ─── Daily Closing Summary ──────────────────────────────────── */
function DailyClosingSummary({ sales, customers }) {
  const [drillDay, setDrillDay] = useState(null)

  const today     = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  const todayStats     = calcDay(sales, today)
  const yesterdayStats = calcDay(sales, yesterday)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i))
    return { date: d, stats: calcDay(sales, d) }
  })
  const weekRevenue = weekDays.reduce((s, d) => s + d.stats.revenue, 0)
  const weekProfit  = weekDays.reduce((s, d) => s + d.stats.profit, 0)
  const maxRevenue  = Math.max(...weekDays.map(d => d.stats.revenue), 1)

  const totalUdhaar = customers.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0)

  function shareWhatsApp() {
    const slip = buildDailySlip(today, todayStats, totalUdhaar)
    window.open(`https://wa.me/?text=${encodeURIComponent(slip)}`, '_blank')
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <>
      {drillDay && (
        <DrillModal
          title={drillDay.date.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}
          subtitle={`${drillDay.stats.count} sale${drillDay.stats.count !== 1 ? 's' : ''} · ${fmt(drillDay.stats.revenue)} revenue · ${fmt(drillDay.stats.profit)} profit`}
          onClose={() => setDrillDay(null)}>
          {drillDay.stats.sales.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text3)' }}>No sales on this day.</p>
          ) : (
            <div className="space-y-2">
              {drillDay.stats.sales.map(sale => {
                const profit = sale.profit ?? (sale.totalRevenue - sale.totalCost)
                const m = sale.totalRevenue > 0 ? Math.round((profit / sale.totalRevenue) * 100) : 0
                return (
                  <div key={sale.id} className="p-3 rounded-lg flex items-center justify-between"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{sale.customerName}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                        {new Date(sale.saleDate).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                        {sale.items?.length ? ` · ${sale.items.length} item${sale.items.length !== 1 ? 's' : ''}` : ''}
                      </p>
                      {sale.items?.length > 0 && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                          {sale.items.slice(0, 3).map(it => `${it.itemName} ×${it.quantity}`).join(', ')}
                          {sale.items.length > 3 ? ` +${sale.items.length - 3} more` : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmt(sale.totalRevenue)}</p>
                      <p className="text-xs" style={{ color: 'var(--accent)' }}>+{fmt(profit)} · {m}%</p>
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 flex items-center justify-between text-sm font-bold"
                style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                <span>Total</span>
                <div className="text-right">
                  <span style={{ color: 'var(--accent)' }}>{fmt(drillDay.stats.revenue)}</span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--text3)' }}>
                    profit {fmt(drillDay.stats.profit)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DrillModal>
      )}

      <div className="card">
        <div className="section-header">
          <div className="flex items-center gap-2">
            <Sun size={16} style={{ color: 'var(--yellow)' }} />
            <h3 className="section-title">Daily Closing Summary</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,214,10,0.1)', color: 'var(--yellow)', border: '1px solid rgba(255,214,10,0.2)' }}>
              {today.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
            </span>
            <button onClick={shareWhatsApp}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold"
              style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}>
              <MessageCircle size={12} /> Share
            </button>
          </div>
        </div>

        {/* Today vs Yesterday */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Revenue',  today: todayStats.revenue, yesterday: yesterdayStats.revenue, color: 'var(--accent)' },
            { label: 'Profit',   today: todayStats.profit,  yesterday: yesterdayStats.profit,  color: 'var(--blue)' },
            { label: 'Orders',   today: todayStats.count,   yesterday: yesterdayStats.count,   color: '#a855f7', isCount: true },
          ].map(({ label, today: tv, yesterday: yv, color, isCount }) => {
            const delta = tv - yv
            const up = delta > 0
            return (
              <div key={label} className="rounded-xl p-3"
                style={{ background: 'var(--surface2)', cursor: 'pointer', transition: 'opacity 0.15s' }}
                onClick={() => setDrillDay({ date: today, stats: todayStats })}
                title="Click for today's sales detail">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>
                  {label}
                </p>
                <p className="text-lg font-extrabold leading-tight" style={{ color: 'var(--text)' }}>
                  {isCount ? tv : fmt(tv)}
                </p>
                {yv > 0 || tv > 0 ? (
                  <div className="flex items-center gap-1 mt-1">
                    {delta === 0
                      ? <Minus size={10} style={{ color: 'var(--text3)' }} />
                      : up
                      ? <TrendingUp size={10} style={{ color: 'var(--accent)' }} />
                      : <TrendingDown size={10} style={{ color: 'var(--red)' }} />
                    }
                    <span className="text-[10px] font-semibold"
                      style={{ color: delta === 0 ? 'var(--text3)' : up ? 'var(--accent)' : 'var(--red)' }}>
                      {delta === 0 ? 'same as yday' : `${up ? '+' : ''}${isCount ? delta : fmt(Math.abs(delta))} vs yday`}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>no data</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Weekly bar chart */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
          7-Day Revenue — Rs {weekRevenue.toLocaleString()} total · Rs {weekProfit.toLocaleString()} profit
          <span className="ml-2 normal-case font-normal" style={{ color: 'var(--text3)' }}>(click a bar for detail)</span>
        </p>
        <div className="flex items-end gap-1.5 h-20">
          {weekDays.map(({ date, stats }, i) => {
            const isToday = i === 6
            const pct = stats.revenue / maxRevenue
            const barH = Math.max(pct * 80, stats.revenue > 0 ? 6 : 2)
            const margin = stats.revenue > 0 ? Math.round((stats.profit / stats.revenue) * 100) : 0
            const tooltipLines = [
              { label: date.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short' }), bold: true },
              { label: `Revenue: ${fmt(stats.revenue)}`, color: 'var(--accent)' },
              { label: `Profit: ${fmt(stats.profit)}`, color: 'var(--blue)' },
              { label: `Orders: ${stats.count}`, color: 'var(--text2)' },
              stats.revenue > 0 && { label: `Margin: ${margin}%`, color: margin >= 20 ? 'var(--accent)' : 'var(--yellow)' },
            ].filter(Boolean)

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <Tooltip lines={tooltipLines}>
                  <div className="w-full rounded-t transition-all duration-500"
                    style={{
                      height: barH,
                      background: isToday ? 'var(--accent)' : stats.revenue > 0 ? 'var(--border2)' : 'var(--border)',
                      opacity: isToday ? 1 : 0.7,
                      cursor: 'pointer',
                    }}
                    onClick={() => setDrillDay({ date, stats })} />
                </Tooltip>
                <span className="text-[9px]"
                  style={{ color: isToday ? 'var(--accent)' : 'var(--text3)', fontWeight: isToday ? 700 : 400 }}>
                  {days[date.getDay()]}
                </span>
              </div>
            )
          })}
        </div>

        {todayStats.revenue > 0 && totalUdhaar / todayStats.revenue > 0.15 && (
          <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(255,71,87,0.07)', border: '1px solid rgba(255,71,87,0.2)' }}>
            <AlertTriangle size={13} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: 'var(--red)' }}>
              Total udhaar ({fmt(totalUdhaar)}) is more than 15% of today's revenue — consider chasing payments
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function SectionCard({ title, icon: Icon, iconColor, badge, children }) {
  return (
    <div className="card">
      <div className="section-header">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: iconColor }} />
          <h3 className="section-title">{title}</h3>
        </div>
        {badge}
      </div>
      {children}
    </div>
  )
}

export default function Analytics() {
  const [items, setItems]         = useState([])
  const [customers, setCustomers] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [sales, setSales]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [drillItem, setDrillItem]         = useState(null)
  const [drillCustomer, setDrillCustomer] = useState(null)
  const [drillUnit, setDrillUnit]         = useState(null)
  const [drillOverview, setDrillOverview] = useState(null)

  useEffect(() => {
    Promise.all([itemApi.getAll(), customerApi.getAll(), saleApi.getDashboard(), saleApi.getAll()])
      .then(([i, c, d, s]) => { setItems(i); setCustomers(c); setDashboard(d); setSales(s) })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }} />
    </div>
  )

  const totalCostValue  = items.reduce((s, i) => s + i.costPrice  * i.quantity, 0)
  const totalSellValue  = items.reduce((s, i) => s + i.sellingPrice * i.quantity, 0)
  const potentialProfit = totalSellValue - totalCostValue
  const lowStockItems   = items.filter(i => i.isLowStock)
  const outOfStock      = items.filter(i => i.quantity === 0)

  const topByMargin = [...items]
    .filter(i => i.sellingPrice > 0 && i.costPrice > 0)
    .map(i => ({
      ...i,
      margin:   Math.round(((i.sellingPrice - i.costPrice) / i.sellingPrice) * 100),
      marginRs: i.sellingPrice - i.costPrice,
    }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 8)
  const maxMargin = topByMargin[0]?.margin || 1

  const byUnit = items.reduce((acc, i) => { acc[i.unit] = (acc[i.unit] || 0) + 1; return acc }, {})

  const debtors     = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance)
  const totalUdhaar = debtors.reduce((s, c) => s + c.balance, 0)
  const maxDebt     = debtors[0]?.balance || 1
  const riskBuckets = {
    high:   debtors.filter(c => c.balance >= 5000),
    medium: debtors.filter(c => c.balance >= 1000 && c.balance < 5000),
    low:    debtors.filter(c => c.balance < 1000),
  }

  const OVERVIEW = [
    {
      label: 'Inventory (Sell)', val: fmt(totalSellValue), sub: `Cost: ${fmt(totalCostValue)}`, color: 'var(--accent)',
      drillTitle: 'Inventory Value Breakdown',
      drillContent: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { l: 'Sell Value', v: fmt(totalSellValue), c: 'var(--accent)' },
              { l: 'Cost Value', v: fmt(totalCostValue), c: 'var(--text2)' },
              { l: 'Pot. Profit', v: fmt(potentialProfit), c: 'var(--blue)' },
              { l: 'SKUs', v: items.length, c: 'var(--text)' },
            ].map(({ l, v, c }) => (
              <div key={l} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text3)' }}>{l}</p>
                <p className="text-base font-extrabold mt-1" style={{ color: c }}>{v}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>Top 5 by Sell Value</p>
          {[...items].sort((a, b) => (b.sellingPrice * b.quantity) - (a.sellingPrice * a.quantity)).slice(0, 5).map(item => (
            <div key={item.id} className="flex justify-between items-center py-2"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text)' }}>{item.name}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                {fmt(item.sellingPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: 'Potential Profit', val: fmt(potentialProfit), sub: 'If all stock sells', color: 'var(--blue)',
      drillTitle: 'Profit Potential Breakdown',
      drillContent: (
        <div className="space-y-2">
          {[...items]
            .filter(i => i.sellingPrice > i.costPrice)
            .map(i => ({ ...i, pot: (i.sellingPrice - i.costPrice) * i.quantity }))
            .sort((a, b) => b.pot - a.pot)
            .slice(0, 10)
            .map(item => (
              <div key={item.id} className="flex justify-between items-center py-2"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{item.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>
                    ×{item.quantity} {item.unit} @ Rs {item.sellingPrice - item.costPrice}/unit
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--blue)' }}>{fmt(item.pot)}</span>
              </div>
            ))}
        </div>
      ),
    },
    {
      label: 'Total Udhaar', val: fmt(totalUdhaar), sub: `${debtors.length} in debt`, color: 'var(--red)',
      drillTitle: 'All Outstanding Udhaar',
      drillContent: (
        <div className="space-y-2">
          {debtors.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text3)' }}>No outstanding udhaar!</p>
          ) : debtors.map(c => {
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
        </div>
      ),
    },
    {
      label: 'Stock Issues', val: lowStockItems.length, sub: `${outOfStock.length} out`, color: 'var(--yellow)',
      drillTitle: 'Stock Issues Detail',
      drillContent: (
        <div className="space-y-2">
          {lowStockItems.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text3)' }}>All items well stocked!</p>
          ) : lowStockItems.map(item => (
            <div key={item.id} className="flex justify-between items-center py-2"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.name}</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                  Threshold: {item.lowStockThreshold} {item.unit}
                </p>
              </div>
              <span className={item.quantity === 0 ? 'badge-red' : 'badge-yellow'}>
                {item.quantity === 0 ? 'OUT' : `${item.quantity} left`}
              </span>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Drill-down modals */}
      {drillOverview && (
        <DrillModal title={drillOverview.drillTitle} onClose={() => setDrillOverview(null)}>
          {drillOverview.drillContent}
        </DrillModal>
      )}

      {drillItem && (
        <DrillModal
          title={drillItem.name}
          subtitle={`${drillItem.unit} · Margin ${drillItem.margin}%`}
          onClose={() => setDrillItem(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Cost Price',    v: fmt(drillItem.costPrice),                          c: 'var(--text2)' },
                { l: 'Sell Price',    v: fmt(drillItem.sellingPrice),                        c: 'var(--text)' },
                { l: 'Profit/Unit',   v: fmt(drillItem.marginRs),                           c: 'var(--accent)' },
                { l: 'Margin %',      v: `${drillItem.margin}%`,                            c: drillItem.margin >= 30 ? 'var(--accent)' : drillItem.margin >= 15 ? 'var(--yellow)' : 'var(--red)' },
                { l: 'In Stock',      v: `${drillItem.quantity} ${drillItem.unit}`,          c: drillItem.isLowStock ? 'var(--orange)' : 'var(--text)' },
                { l: 'Stock Value',   v: fmt(drillItem.sellingPrice * drillItem.quantity),   c: 'var(--blue)' },
              ].map(({ l, v, c }) => (
                <div key={l} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                  <p className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text3)' }}>{l}</p>
                  <p className="text-sm font-bold" style={{ color: c }}>{v}</p>
                </div>
              ))}
            </div>
            {drillItem.isLowStock && (
              <div className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
                <AlertTriangle size={13} style={{ color: 'var(--orange)' }} />
                <p className="text-xs" style={{ color: 'var(--orange)' }}>
                  Low stock — only {drillItem.quantity} {drillItem.unit} remaining (alert at {drillItem.lowStockThreshold})
                </p>
              </div>
            )}
          </div>
        </DrillModal>
      )}

      {drillCustomer && (
        <DrillModal
          title={drillCustomer.name}
          subtitle={`Balance: ${fmt(drillCustomer.balance)} · ${drillCustomer.balance >= 5000 ? 'High Risk' : drillCustomer.balance >= 1000 ? 'Medium Risk' : 'Low Risk'}`}
          onClose={() => setDrillCustomer(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Outstanding', v: fmt(drillCustomer.balance), c: drillCustomer.balance >= 5000 ? 'var(--red)' : 'var(--yellow)' },
                { l: 'Risk Level',  v: drillCustomer.balance >= 5000 ? 'High' : drillCustomer.balance >= 1000 ? 'Medium' : 'Low',
                  c: drillCustomer.balance >= 5000 ? 'var(--red)' : drillCustomer.balance >= 1000 ? 'var(--yellow)' : 'var(--accent)' },
              ].map(({ l, v, c }) => (
                <div key={l} className="p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
                  <p className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text3)' }}>{l}</p>
                  <p className="text-sm font-bold" style={{ color: c }}>{v}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center py-4" style={{ color: 'var(--text3)' }}>
              For full transaction history, visit the Udhaar Book page.
            </p>
          </div>
        </DrillModal>
      )}

      {drillUnit && (
        <DrillModal
          title={`Items by Unit: ${drillUnit}`}
          subtitle={`${items.filter(i => i.unit === drillUnit).length} items`}
          onClose={() => setDrillUnit(null)}>
          <div className="space-y-2">
            {items.filter(i => i.unit === drillUnit).map(item => {
              const margin = item.sellingPrice > 0
                ? Math.round(((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100) : 0
              return (
                <div key={item.id} className="flex justify-between items-center py-2"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>
                      Stock: {item.quantity} · Sell: {fmt(item.sellingPrice)}
                    </p>
                  </div>
                  <span className="text-xs font-bold"
                    style={{ color: margin >= 25 ? 'var(--accent)' : margin >= 12 ? 'var(--yellow)' : 'var(--red)' }}>
                    {margin}%
                  </span>
                </div>
              )
            })}
          </div>
        </DrillModal>
      )}

      {/* Overview */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
          Business Overview <span className="normal-case font-normal">(click a card for detail)</span>
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {OVERVIEW.map(({ label, val, sub, color, drillTitle, drillContent }) => (
            <div key={label} className="stat-card"
              style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
              onClick={() => setDrillOverview({ drillTitle, drillContent })}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = '' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: color }} />
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>{label}</p>
              <p className="text-xl font-extrabold leading-tight" style={{ color: 'var(--text)' }}>{val}</p>
              {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top items by margin */}
        <SectionCard title="Top Items by Margin %" icon={TrendingUp} iconColor="var(--accent)"
          badge={<span className="badge-green">Top {topByMargin.length}</span>}>
          {topByMargin.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text3)' }}>No items with pricing data.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px]" style={{ color: 'var(--text3)' }}>Click a row for item detail</p>
              {topByMargin.map((item, idx) => {
                const mc = item.margin >= 30 ? 'var(--accent)' : item.margin >= 15 ? 'var(--yellow)' : 'var(--red)'
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-1"
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => setDrillItem(item)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                    <span className="text-xs font-bold w-5 text-right" style={{ color: 'var(--text3)' }}>{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold truncate pr-2" style={{ color: 'var(--text)' }}>{item.name}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs" style={{ color: 'var(--text3)' }}>{fmt(item.marginRs)}/unit</span>
                          <span className="text-xs font-bold" style={{ color: mc }}>{item.margin}%</span>
                        </div>
                      </div>
                      <Bar
                        pct={(item.margin / maxMargin) * 100}
                        color={mc}
                        onClick={() => setDrillItem(item)}
                        tooltip={[
                          { label: item.name, bold: true },
                          { label: `Cost: ${fmt(item.costPrice)}`, color: 'var(--text2)' },
                          { label: `Sell: ${fmt(item.sellingPrice)}`, color: 'var(--text)' },
                          { label: `Profit/unit: ${fmt(item.marginRs)}`, color: 'var(--accent)' },
                          { label: `Margin: ${item.margin}%`, color: mc },
                          { label: `Stock: ${item.quantity} ${item.unit}`, color: 'var(--text3)' },
                        ]}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* Udhaar risk */}
        <SectionCard title="Udhaar Risk Analysis" icon={Users} iconColor="var(--red)"
          badge={totalUdhaar > 0 ? <span className="badge-red">{fmt(totalUdhaar)}</span> : null}>
          {debtors.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>No outstanding udhaar!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'High Risk', val: riskBuckets.high.length,   sub: 'Rs.5000+',  color: 'var(--red)',    bg: 'rgba(255,71,87,0.08)',   bucket: riskBuckets.high },
                  { label: 'Medium',    val: riskBuckets.medium.length, sub: 'Rs.1k–5k',  color: 'var(--yellow)', bg: 'rgba(255,214,10,0.08)',  bucket: riskBuckets.medium },
                  { label: 'Low Risk',  val: riskBuckets.low.length,    sub: '< Rs.1k',   color: 'var(--accent)', bg: 'rgba(0,212,170,0.08)',   bucket: riskBuckets.low },
                ].map(b => (
                  <div key={b.label} className="rounded-lg p-2.5 text-center"
                    style={{ background: b.bg, cursor: 'pointer', transition: 'opacity 0.15s' }}
                    onClick={() => b.bucket.length > 0 && setDrillOverview({
                      drillTitle: `${b.label} Debtors`,
                      drillContent: (
                        <div className="space-y-2">
                          {b.bucket.map(c => (
                            <div key={c.id} className="flex justify-between items-center py-2"
                              style={{ borderBottom: '1px solid var(--border)' }}>
                              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.name}</p>
                              <span className="text-sm font-bold" style={{ color: b.color }}>{fmt(c.balance)}</span>
                            </div>
                          ))}
                        </div>
                      ),
                    })}>
                    <p className="text-lg font-bold" style={{ color: b.color }}>{b.val}</p>
                    <p className="text-[10px] font-bold uppercase" style={{ color: b.color }}>{b.label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{b.sub}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
                Top Debtors <span className="normal-case font-normal">(click for detail)</span>
              </p>
              <div className="space-y-2.5">
                {debtors.slice(0, 5).map(c => {
                  const dc = c.balance >= 5000 ? 'var(--red)' : c.balance >= 1000 ? 'var(--yellow)' : 'var(--text2)'
                  return (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-1"
                      style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => setDrillCustomer(c)}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold truncate pr-2" style={{ color: 'var(--text)' }}>{c.name}</p>
                          <span className="text-xs font-bold" style={{ color: dc }}>{fmt(c.balance)}</span>
                        </div>
                        <Bar
                          pct={(c.balance / maxDebt) * 100}
                          color={c.balance >= 5000 ? 'var(--red)' : c.balance >= 1000 ? 'var(--yellow)' : 'var(--surface3)'}
                          onClick={() => setDrillCustomer(c)}
                          tooltip={[
                            { label: c.name, bold: true },
                            { label: `Balance: ${fmt(c.balance)}`, color: dc },
                            { label: `Risk: ${c.balance >= 5000 ? 'High' : c.balance >= 1000 ? 'Medium' : 'Low'}`, color: dc },
                            { label: `${Math.round((c.balance / totalUdhaar) * 100)}% of total udhaar`, color: 'var(--text3)' },
                          ]}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Inventory breakdown */}
        <SectionCard title="Inventory Breakdown" icon={Package} iconColor="var(--blue)">
          <table className="tbl">
            <thead>
              <tr><th>Item</th><th>Stock</th><th>Cost Val</th><th>Sell Val</th><th>Margin</th></tr>
            </thead>
            <tbody>
              {[...items].sort((a, b) => (b.sellingPrice * b.quantity) - (a.sellingPrice * a.quantity)).slice(0, 8).map(item => {
                const margin = item.sellingPrice > 0
                  ? Math.round(((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100) : 0
                const mc = margin >= 30 ? 'var(--accent)' : margin >= 15 ? 'var(--yellow)' : 'var(--red)'
                return (
                  <tr key={item.id} style={{ cursor: 'pointer' }}
                    onClick={() => setDrillItem({ ...item, margin, marginRs: item.sellingPrice - item.costPrice })}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                    <td>
                      <p className="font-medium" style={{ color: 'var(--text)' }}>{item.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>{item.unit}</p>
                    </td>
                    <td>
                      <span className={item.isLowStock ? 'badge-red' : 'badge-green'}>{item.quantity}</span>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{fmt(item.costPrice * item.quantity)}</td>
                    <td className="font-semibold" style={{ color: 'var(--text)' }}>{fmt(item.sellingPrice * item.quantity)}</td>
                    <td><span className="text-xs font-bold" style={{ color: mc }}>{margin}%</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {items.length > 8 && (
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text3)' }}>
              Top 8 by sell value · {items.length} total · click a row for detail
            </p>
          )}
        </SectionCard>

        <div className="space-y-5">
          {/* Unit distribution */}
          <SectionCard title="Items by Unit Type" icon={BarChart2} iconColor="#a855f7">
            {Object.entries(byUnit).length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text3)' }}>No items yet.</p>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[10px]" style={{ color: 'var(--text3)' }}>Click a bar to see items</p>
                {Object.entries(byUnit).sort((a, b) => b[1] - a[1]).map(([unit, count]) => {
                  const pct = (count / items.length) * 100
                  return (
                    <div key={unit} className="flex items-center gap-3 rounded-lg px-1 py-1"
                      style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => setDrillUnit(unit)}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                      <span className="text-xs font-semibold w-12" style={{ color: 'var(--text2)' }}>{unit}</span>
                      <Bar
                        pct={pct}
                        color="#a855f7"
                        onClick={() => setDrillUnit(unit)}
                        tooltip={[
                          { label: `Unit: ${unit}`, bold: true },
                          { label: `${count} item${count !== 1 ? 's' : ''}`, color: '#a855f7' },
                          { label: `${Math.round(pct)}% of inventory`, color: 'var(--text3)' },
                        ]}
                      />
                      <span className="text-xs w-20 text-right" style={{ color: 'var(--text2)' }}>
                        {count} ({Math.round(pct)}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* Month performance */}
          <SectionCard title="Month Performance" icon={DollarSign} iconColor="var(--accent)">
            {!dashboard ? (
              <p className="text-sm" style={{ color: 'var(--text3)' }}>No data.</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Month Revenue', val: fmt(dashboard.monthRevenue), color: 'var(--accent)' },
                  { label: 'Month Profit',  val: fmt(dashboard.monthProfit),  color: 'var(--blue)' },
                  { label: 'Today Revenue', val: fmt(dashboard.todayRevenue), color: 'var(--accent)' },
                  { label: 'Today Profit',  val: fmt(dashboard.todayProfit),  color: 'var(--blue)' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text2)' }}>{row.label}</p>
                    <p className="text-sm font-bold" style={{ color: row.color }}>{row.val}</p>
                  </div>
                ))}
                {dashboard.monthRevenue > 0 && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>Month margin</p>
                      <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                        {Math.round((dashboard.monthProfit / dashboard.monthRevenue) * 100)}%
                      </p>
                    </div>
                    <Bar
                      pct={Math.round((dashboard.monthProfit / dashboard.monthRevenue) * 100)}
                      color="var(--accent)"
                      tooltip={[
                        { label: 'Month Margin', bold: true },
                        { label: `${Math.round((dashboard.monthProfit / dashboard.monthRevenue) * 100)}%`, color: 'var(--accent)' },
                        { label: `Revenue: ${fmt(dashboard.monthRevenue)}`, color: 'var(--text2)' },
                        { label: `Profit: ${fmt(dashboard.monthProfit)}`, color: 'var(--blue)' },
                      ]}
                    />
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Daily Closing Summary */}
      <DailyClosingSummary sales={sales} customers={customers} />
    </div>
  )
}
