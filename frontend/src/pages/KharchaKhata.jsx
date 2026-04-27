import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Trash2, Edit2, X, Download, MessageCircle,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle,
  BookOpen, Zap, BarChart2, List, Lightbulb, FileDown,
} from 'lucide-react'
import { saleApi } from '../services/api'
import toast from 'react-hot-toast'

/* ─── Style constants ─────────────────────────────────────────── */
const KK = {
  card:    '#14100c',
  card2:   '#1a1410',
  border:  '#2e2218',
  border2: '#443220',
  serif:   "'Playfair Display', Georgia, 'Times New Roman', serif",
  mono:    "'IBM Plex Mono', 'Courier New', Courier, monospace",
  ledgerLines: `repeating-linear-gradient(
    to bottom,
    transparent,
    transparent calc(1.75rem - 1px),
    rgba(180,140,70,0.07) calc(1.75rem - 1px),
    rgba(180,140,70,0.07) 1.75rem
  )`,
}

/* ─── Category master data ────────────────────────────────────── */
export const CATS = [
  { id: 'bijli',     label: 'Bijli',      urdu: 'بجلی',       icon: '⚡', color: '#eab308', deductible: true  },
  { id: 'kiraya',    label: 'Kiraya',     urdu: 'کرایہ',      icon: '🏠', color: '#3b82f6', deductible: true  },
  { id: 'tankhwa',   label: 'Tankhwa',   urdu: 'تنخواہ',     icon: '👷', color: '#10b981', deductible: true  },
  { id: 'thailay',   label: 'Thailay',   urdu: 'تھیلے',      icon: '🛍',  color: '#f97316', deductible: false },
  { id: 'chai',      label: 'Chai Pani', urdu: 'چائے پانی',  icon: '☕', color: '#a855f7', deductible: false },
  { id: 'phone',     label: 'Phone',     urdu: 'فون',         icon: '📱', color: '#06b6d4', deductible: true  },
  { id: 'marmmat',   label: 'Marmmat',   urdu: 'مرمت',       icon: '🔧', color: '#f59e0b', deductible: true  },
  { id: 'transport', label: 'Transport', urdu: 'ٹرانسپورٹ',  icon: '🚗', color: '#84cc16', deductible: false },
  { id: 'packing',   label: 'Packing',   urdu: 'پیکنگ',      icon: '📦', color: '#ec4899', deductible: false },
  { id: 'safai',     label: 'Safai',     urdu: 'صفائی',      icon: '🧹', color: '#0ea5e9', deductible: false },
  { id: 'tax',       label: 'Tax',       urdu: 'ٹیکس',       icon: '📋', color: '#ef4444', deductible: false },
  { id: 'aur',       label: 'Aur',       urdu: 'اور',        icon: '📎', color: '#6b7280', deductible: false },
]

const QUICK_PRESETS = [
  { label: 'Daily Chai',    catId: 'chai',     amount: 400,  note: 'Daily chai pani' },
  { label: 'Plastic Bags',  catId: 'thailay',  amount: 650,  note: 'Plastic shopping bags' },
  { label: 'Week Wages',    catId: 'tankhwa',  amount: 8000, note: 'Weekly wages' },
  { label: 'LESCO Bill',    catId: 'bijli',    amount: 4800, note: 'LESCO electricity bill' },
]

/* ─── localStorage helpers ────────────────────────────────────── */
const EXP_KEY = 'k_expenses'
const loadExp = () => JSON.parse(localStorage.getItem(EXP_KEY) || '[]')
const saveExp = d => localStorage.setItem(EXP_KEY, JSON.stringify(d))
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)
const todayStr = () => new Date().toISOString().split('T')[0]

function filterPeriod(expenses, period) {
  const now = new Date()
  const ymd = d => d.toISOString().split('T')[0]
  const today = ymd(now)
  const weekAgo = ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6))
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  return expenses.filter(e =>
    period === 'today' ? e.date === today :
    period === 'week'  ? e.date >= weekAgo && e.date <= today :
    /* month */          e.date >= monthStart
  )
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function filterSalesPeriod(sales, period) {
  const now = new Date()
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 6)
  return sales.filter(s => {
    const d = new Date(s.saleDate)
    if (period === 'today') return isSameDay(d, now)
    if (period === 'week')  return d >= weekAgo
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
}

/* ─── Donut chart ─────────────────────────────────────────────── */
function Donut({ slices, size = 120, thick = 16 }) {
  const R = (size - thick) / 2
  const cx = size / 2, cy = size / 2
  const C = 2 * Math.PI * R
  const total = slices.reduce((s, d) => s + (d.value || 0), 0)
  let cum = 0
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx={cx} cy={cy} r={R} fill="none" strokeWidth={thick} stroke="rgba(255,255,255,0.05)" />
      {total > 0 && slices.filter(d => d.value > 0).map((d, i) => {
        const seg = (d.value / total) * C
        const off = -cum
        cum += seg
        return (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={d.color} strokeWidth={thick}
            strokeDasharray={`${seg} ${C - seg}`}
            strokeDashoffset={off} />
        )
      })}
    </svg>
  )
}

/* ─── KK Card ─────────────────────────────────────────────────── */
function KkCard({ children, style = {}, lined = false }) {
  return (
    <div style={{
      background: lined ? `${KK.card2}, ${KK.ledgerLines}` : KK.card2,
      backgroundImage: lined ? KK.ledgerLines : undefined,
      backgroundColor: KK.card2,
      border: `1px solid ${KK.border}`,
      borderRadius: 10,
      padding: 16,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ─── Tooltip (cursor-following) ────────────────────────────── */
function KkTooltip({ x, y, content }) {
  if (!content) return null
  return (
    <div style={{
      position: 'fixed', left: x + 14, top: y - 10,
      background: '#14100c', border: '1px solid #443220',
      borderRadius: 7, padding: '8px 12px', fontSize: 11,
      color: '#e2e8f0', pointerEvents: 'none', zIndex: 9999,
      fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,0.7)', lineHeight: 1.6,
    }}>
      {content}
    </div>
  )
}

/* ─── Drill Modal (warm-themed) ──────────────────────────────── */
function KkDrillModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#1a1410', border: '1px solid #2e2218',
        borderRadius: 12, width: '100%', maxWidth: 420,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid #2e2218', flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={14} style={{ color: '#64748b' }} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '14px 18px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── Profit Meter ────────────────────────────────────────────── */
function ProfitMeter({ revenue, cogs, expTotal }) {
  const gross  = revenue - cogs
  const net    = gross - expTotal
  const margin = revenue > 0 ? (net / revenue) * 100 : 0
  const isLoss = net < 0
  const color  = isLoss ? '#dc2626' : margin >= 15 ? '#16a34a' : margin >= 5 ? '#ca8a04' : '#c2410c'

  const Rs = n => <span style={{ fontFamily: KK.mono }}>{`Rs ${Math.abs(n).toLocaleString()}`}</span>

  return (
    <div style={{
      background: `linear-gradient(135deg, ${isLoss ? '#1c0a0a' : '#0a1c10'}, ${KK.card})`,
      border: `1px solid ${isLoss ? 'rgba(220,38,38,0.35)' : 'rgba(22,163,74,0.3)'}`,
      borderRadius: 10, padding: '14px 18px',
    }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Formula */}
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span style={{ color: '#94a3b8', fontFamily: KK.mono, fontSize: 12 }}>
            {Rs(revenue)}</span>
          <span style={{ color: '#475569', fontSize: 11 }}>−</span>
          <span style={{ color: '#64748b', fontFamily: KK.mono, fontSize: 12 }}>
            {Rs(cogs)}</span>
          <span style={{ color: '#475569', fontSize: 11 }}>−</span>
          <span style={{ color: '#f97316', fontFamily: KK.mono, fontSize: 12 }}>
            {Rs(expTotal)}</span>
          <span style={{ color: '#475569', fontSize: 11 }}>=</span>
          <span style={{ fontFamily: KK.mono, fontSize: 15, fontWeight: 700, color }}>
            {isLoss ? '−' : '+'}{Rs(net)}
          </span>
          {isLoss && (
            <span style={{
              fontFamily: KK.serif, fontWeight: 700, fontSize: 9, letterSpacing: 2,
              padding: '2px 7px', border: `1.5px solid ${color}`, borderRadius: 2,
              color, textTransform: 'uppercase', transform: 'rotate(-2deg)', display: 'inline-block',
            }}>DEFICIT</span>
          )}
        </div>
        {/* Labels */}
        <div className="flex gap-3 text-[10px]" style={{ color: '#475569' }}>
          <span>Sales</span>
          <span>COGS</span>
          <span style={{ color: '#f97316' }}>Expenses</span>
          <span style={{ color, fontWeight: 700 }}>Net Profit</span>
        </div>
      </div>
      {/* Health bar */}
      {revenue > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, background: color,
              width: `${Math.min(100, Math.max(0, margin))}%`,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <span style={{ fontFamily: KK.mono, fontSize: 10, color, minWidth: 36 }}>
            {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── Overview Tab ────────────────────────────────────────────── */
function OverviewTab({ expenses, sales, period }) {
  const [tip, setTip]     = useState({ x: 0, y: 0, content: null })
  const [drill, setDrill] = useState(null)

  const periodSales = filterSalesPeriod(sales, period)
  const revenue  = periodSales.reduce((s, x) => s + x.totalRevenue, 0)
  const cogs     = periodSales.reduce((s, x) => s + (x.totalCost || 0), 0)
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0)

  /* 7-day bar data */
  const now = new Date()
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (6 - i))
    const daySales = sales.filter(s => isSameDay(new Date(s.saleDate), d))
    const rev = daySales.reduce((s, x) => s + x.totalRevenue, 0)
    const dayExps = expenses.filter(e => e.date === d.toISOString().split('T')[0])
    const exp = dayExps.reduce((s, e) => s + e.amount, 0)
    return { date: d, rev, exp, daySales, dayExps }
  })
  const maxVal = Math.max(...days7.map(d => Math.max(d.rev, d.exp)), 1)
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  /* Category donut (top 5) */
  const byCat = {}
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount })
  const catSlices = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, value]) => ({ value, color: CATS.find(c => c.id === id)?.color || '#6b7280', label: id }))

  /* Drill helpers */
  function openDayDrill(day) {
    const label = day.date.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short' })
    setDrill({
      title: label,
      children: (
        <div className="space-y-4">
          <div>
            <p style={{ fontFamily: KK.serif, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
              Sales ({day.daySales.length}) · Rs {day.rev.toLocaleString()}
            </p>
            {day.daySales.length === 0
              ? <p style={{ fontSize: 12, color: '#475569', fontFamily: KK.serif }}>No sales recorded</p>
              : day.daySales.map((s, i) => (
                <div key={s.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2e2218' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>#{s.id} · {s.customerName || 'Walk-in'}</span>
                  <span style={{ fontFamily: KK.mono, fontWeight: 700, fontSize: 11, color: '#60a5fa' }}>Rs {s.totalRevenue?.toLocaleString()}</span>
                </div>
              ))
            }
          </div>
          <div>
            <p style={{ fontFamily: KK.serif, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
              Expenses ({day.dayExps.length}) · Rs {day.exp.toLocaleString()}
            </p>
            {day.dayExps.length === 0
              ? <p style={{ fontSize: 12, color: '#475569', fontFamily: KK.serif }}>No expenses recorded</p>
              : day.dayExps.map(e => {
                const cat = CATS.find(c => c.id === e.category)
                return (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2e2218' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{cat?.icon} {cat?.label}{e.note ? ` · ${e.note}` : ''}</span>
                    <span style={{ fontFamily: KK.mono, fontWeight: 700, fontSize: 11, color: '#f97316' }}>Rs {e.amount.toLocaleString()}</span>
                  </div>
                )
              })
            }
          </div>
        </div>
      ),
    })
  }

  function openStatDrill(label) {
    const gross = revenue - cogs
    const net   = gross - expTotal
    const isLoss = net < 0
    const netColor = isLoss ? '#dc2626' : net / (revenue || 1) >= 0.15 ? '#16a34a' : '#ca8a04'
    const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1])
    let children
    if (label === 'Revenue') {
      children = (
        <div>
          <p style={{ fontFamily: KK.mono, fontSize: 20, fontWeight: 700, color: '#60a5fa', marginBottom: 12 }}>Rs {revenue.toLocaleString()}</p>
          <p style={{ fontFamily: KK.serif, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>{periodSales.length} transactions</p>
          {periodSales.length === 0
            ? <p style={{ fontSize: 12, color: '#475569', fontFamily: KK.serif }}>No sales in this period</p>
            : periodSales.slice(0, 20).map((s, i) => (
              <div key={s.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #2e2218' }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.customerName || 'Walk-in'} · {new Date(s.saleDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</span>
                <span style={{ fontFamily: KK.mono, fontWeight: 700, fontSize: 11, color: '#60a5fa' }}>Rs {s.totalRevenue?.toLocaleString()}</span>
              </div>
            ))
          }
        </div>
      )
    } else if (label === 'Expenses') {
      children = (
        <div>
          <p style={{ fontFamily: KK.mono, fontSize: 20, fontWeight: 700, color: '#f97316', marginBottom: 12 }}>Rs {expTotal.toLocaleString()}</p>
          <p style={{ fontFamily: KK.serif, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>{expenses.length} entries · by category</p>
          {sortedCats.length === 0
            ? <p style={{ fontSize: 12, color: '#475569', fontFamily: KK.serif }}>No expenses in this period</p>
            : sortedCats.map(([id, amt]) => {
              const cat = CATS.find(c => c.id === id)
              const pct = expTotal > 0 ? Math.round(amt / expTotal * 100) : 0
              return (
                <div key={id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>{cat?.icon} {cat?.label}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontFamily: KK.mono, fontSize: 11, color: cat?.color }}>Rs {amt.toLocaleString()}</span>
                      <span style={{ fontSize: 10, color: '#475569' }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cat?.color || '#6b7280', borderRadius: 2 }} />
                  </div>
                </div>
              )
            })
          }
        </div>
      )
    } else if (label === 'Gross Profit') {
      children = (
        <div>
          <p style={{ fontFamily: KK.mono, fontSize: 20, fontWeight: 700, color: '#a3e635', marginBottom: 12 }}>Rs {gross.toLocaleString()}</p>
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 12 }}>
            <p style={{ fontFamily: KK.mono, fontSize: 12, color: '#94a3b8' }}>Revenue&nbsp;&nbsp;<span style={{ color: '#60a5fa' }}>Rs {revenue.toLocaleString()}</span></p>
            <p style={{ fontFamily: KK.mono, fontSize: 12, color: '#94a3b8', marginTop: 4 }}>− COGS&nbsp;&nbsp;&nbsp;<span style={{ color: '#64748b' }}>Rs {cogs.toLocaleString()}</span></p>
            <div style={{ height: 1, background: '#2e2218', margin: '8px 0' }} />
            <p style={{ fontFamily: KK.mono, fontSize: 14, fontWeight: 700, color: '#a3e635' }}>= Rs {gross.toLocaleString()}</p>
          </div>
          {revenue > 0 && <p style={{ fontSize: 12, color: '#64748b' }}>Gross margin: {((gross / revenue) * 100).toFixed(1)}%</p>}
        </div>
      )
    } else {
      children = (
        <div>
          <p style={{ fontFamily: KK.mono, fontSize: 20, fontWeight: 700, color: netColor, marginBottom: 12 }}>{isLoss ? '−' : '+'} Rs {Math.abs(net).toLocaleString()}</p>
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 12 }}>
            <p style={{ fontFamily: KK.mono, fontSize: 12, color: '#94a3b8' }}>Revenue&nbsp;&nbsp;&nbsp;<span style={{ color: '#60a5fa' }}>Rs {revenue.toLocaleString()}</span></p>
            <p style={{ fontFamily: KK.mono, fontSize: 12, color: '#94a3b8', marginTop: 4 }}>− COGS&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#64748b' }}>Rs {cogs.toLocaleString()}</span></p>
            <p style={{ fontFamily: KK.mono, fontSize: 12, color: '#94a3b8', marginTop: 4 }}>− Expenses <span style={{ color: '#f97316' }}>Rs {expTotal.toLocaleString()}</span></p>
            <div style={{ height: 1, background: '#2e2218', margin: '8px 0' }} />
            <p style={{ fontFamily: KK.mono, fontSize: 14, fontWeight: 700, color: netColor }}>= {isLoss ? '−' : '+'} Rs {Math.abs(net).toLocaleString()}</p>
          </div>
          {isLoss
            ? <p style={{ fontSize: 12, color: '#dc2626' }}>⚠ Expenses exceed gross profit by Rs {Math.abs(net).toLocaleString()}</p>
            : <p style={{ fontSize: 12, color: '#64748b' }}>Net margin: {((net / revenue) * 100).toFixed(1)}% · Rs {net.toLocaleString()} true profit</p>
          }
        </div>
      )
    }
    setDrill({ title: `${label} — Detail`, children })
  }

  function openCatDrill(catId) {
    const cat = CATS.find(c => c.id === catId)
    const catExps = expenses.filter(e => e.category === catId).sort((a, b) => b.date.localeCompare(a.date))
    const total = catExps.reduce((s, e) => s + e.amount, 0)
    setDrill({
      title: `${cat?.icon} ${cat?.label} — ${cat?.urdu}`,
      children: (
        <div>
          <p style={{ fontFamily: KK.mono, fontSize: 18, fontWeight: 700, color: cat?.color, marginBottom: 12 }}>Rs {total.toLocaleString()}</p>
          {catExps.length === 0
            ? <p style={{ fontSize: 12, color: '#475569', fontFamily: KK.serif }}>No expenses in this period</p>
            : catExps.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #2e2218' }}>
                <div>
                  <span style={{ fontFamily: KK.mono, fontSize: 10, color: '#475569', display: 'block' }}>{e.date}</span>
                  {e.note && <span style={{ fontSize: 11, color: '#94a3b8' }}>{e.note}</span>}
                </div>
                <span style={{ fontFamily: KK.mono, fontWeight: 700, fontSize: 12, color: cat?.color }}>Rs {e.amount.toLocaleString()}</span>
              </div>
            ))
          }
        </div>
      ),
    })
  }

  return (
    <div className="space-y-4" onMouseMove={e => setTip(t => ({ ...t, x: e.clientX, y: e.clientY }))}>
      {tip.content && <KkTooltip x={tip.x} y={tip.y} content={tip.content} />}
      {drill && <KkDrillModal title={drill.title} onClose={() => setDrill(null)}>{drill.children}</KkDrillModal>}

      <ProfitMeter revenue={revenue} cogs={cogs} expTotal={expTotal} />

      {/* Stats row — clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Revenue',      v: revenue,              c: '#60a5fa' },
          { l: 'Expenses',     v: expTotal,             c: '#f97316' },
          { l: 'Gross Profit', v: revenue - cogs,       c: '#a3e635' },
          { l: 'Net Profit',   v: revenue - cogs - expTotal, c: (revenue - cogs - expTotal) < 0 ? '#dc2626' : '#16a34a' },
        ].map(({ l, v, c }) => (
          <div key={l} onClick={() => openStatDrill(l)}
            onMouseEnter={() => setTip(t => ({ ...t, content: 'Click for breakdown →' }))}
            onMouseLeave={() => setTip(t => ({ ...t, content: null }))}
            style={{ cursor: 'pointer' }}>
            <KkCard lined>
              <p style={{ fontFamily: KK.serif, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 4 }}>{l}</p>
              <p style={{ fontFamily: KK.mono, fontSize: 15, fontWeight: 700, color: c }}>{`Rs ${Number(v || 0).toLocaleString()}`}</p>
              <p style={{ fontSize: 9, color: '#334155', marginTop: 3 }}>tap to drill →</p>
            </KkCard>
          </div>
        ))}
      </div>

      {/* 7-day chart — hoverable + clickable */}
      <KkCard>
        <p style={{ fontFamily: KK.serif, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>
          7-Day Revenue vs Expenses
        </p>
        <div className="flex items-end gap-2" style={{ height: 80 }}>
          {days7.map((day, i) => {
            const isToday = i === 6
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5"
                style={{ cursor: 'pointer' }}
                onClick={() => openDayDrill(day)}
                onMouseEnter={() => setTip(t => ({ ...t, content: (
                  <span>
                    <strong style={{ color: '#e2e8f0' }}>{DAYS[day.date.getDay()]} {day.date.getDate()}</strong>
                    {' — '}
                    <span style={{ color: '#60a5fa' }}>Rev Rs {day.rev.toLocaleString()}</span>
                    {' · '}
                    <span style={{ color: '#f97316' }}>Exp Rs {day.exp.toLocaleString()}</span>
                  </span>
                ) }))}
                onMouseLeave={() => setTip(t => ({ ...t, content: null }))}>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                  <div style={{ flex: 1, height: `${(day.rev / maxVal) * 72}px`, minHeight: day.rev > 0 ? 3 : 1, background: isToday ? '#16a34a' : '#334155', borderRadius: '2px 2px 0 0', transition: 'height 0.4s' }} />
                  <div style={{ flex: 1, height: `${(day.exp / maxVal) * 72}px`, minHeight: day.exp > 0 ? 3 : 1, background: '#f97316', borderRadius: '2px 2px 0 0', opacity: 0.8, transition: 'height 0.4s' }} />
                </div>
                <span style={{ fontSize: 9, color: isToday ? '#60a5fa' : '#475569', fontWeight: isToday ? 700 : 400 }}>
                  {DAYS[day.date.getDay()]}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-2">
          <span style={{ fontSize: 10, color: '#64748b' }}><span style={{ display: 'inline-block', width: 8, height: 8, background: '#16a34a', borderRadius: 1, marginRight: 4 }} />Revenue</span>
          <span style={{ fontSize: 10, color: '#64748b' }}><span style={{ display: 'inline-block', width: 8, height: 8, background: '#f97316', borderRadius: 1, marginRight: 4 }} />Expenses</span>
          <span style={{ fontSize: 10, color: '#334155', fontStyle: 'italic' }}>click any bar for details</span>
        </div>
      </KkCard>

      {/* Category donut — legend items clickable */}
      {catSlices.length > 0 && (
        <KkCard>
          <p style={{ fontFamily: KK.serif, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>
            Expense Breakdown
          </p>
          <div className="flex items-center gap-6">
            <Donut slices={catSlices} size={100} thick={14} />
            <div className="flex-1 space-y-1.5">
              {catSlices.map(s => {
                const cat = CATS.find(c => c.id === s.label)
                const pct = expTotal > 0 ? Math.round(s.value / expTotal * 100) : 0
                return (
                  <div key={s.label} className="flex items-center gap-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => openCatDrill(s.label)}
                    onMouseEnter={() => setTip(t => ({ ...t, content: `${cat?.label}: Rs ${s.value.toLocaleString()} (${pct}%) — click to view` }))}
                    onMouseLeave={() => setTip(t => ({ ...t, content: null }))}>
                    <span style={{ fontSize: 12 }}>{cat?.icon}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: KK.mono, fontSize: 10, color: '#64748b', minWidth: 26 }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </KkCard>
      )}

      {expenses.length === 0 && (
        <div className="text-center py-10">
          <BookOpen size={28} style={{ color: '#475569', margin: '0 auto 8px' }} />
          <p style={{ color: '#475569', fontSize: 13, fontFamily: KK.serif }}>No expenses recorded yet.<br />Tap "Add Kharcha" to start.</p>
        </div>
      )}
    </div>
  )
}

/* ─── Add Tab ─────────────────────────────────────────────────── */
function AddTab({ onAdd }) {
  const [cat, setCat]       = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')
  const [date, setDate]     = useState(todayStr)

  function handleAdd() {
    if (!cat)                          return toast.error('Select a category first')
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount')
    onAdd({ id: uid(), category: cat.id, amount: Number(amount), note: note.trim(), date, createdAt: new Date().toISOString() })
    toast.success(`${cat.label} — Rs ${Number(amount).toLocaleString()} added`)
    setAmount('')
    setNote('')
    setCat(null)
  }

  function applyPreset(p) {
    const c = CATS.find(x => x.id === p.catId)
    setCat(c)
    setAmount(String(p.amount))
    setNote(p.note)
  }

  return (
    <div className="space-y-4">
      {/* Category grid */}
      <div>
        <p style={{ fontFamily: KK.serif, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
          Category
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {CATS.map(c => {
            const sel = cat?.id === c.id
            return (
              <button key={c.id}
                onClick={() => setCat(sel ? null : c)}
                style={{
                  background: sel ? `${c.color}18` : KK.card,
                  border: `2px solid ${sel ? c.color : KK.border}`,
                  borderRadius: 8, padding: '10px 6px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: sel ? c.color : '#94a3b8' }}>{c.label}</span>
                <span style={{ fontSize: 9, color: '#475569', direction: 'rtl' }}>{c.urdu}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Amount form — only after category selected */}
      {cat && (
        <KkCard lined>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 18 }}>{cat.icon}</span>
            <span style={{ fontFamily: KK.serif, fontWeight: 700, fontSize: 14, color: cat.color }}>
              {cat.label} — {cat.urdu}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', display: 'block', marginBottom: 4 }}>Amount (Rs)</label>
              <input
                className="input"
                style={{ fontFamily: KK.mono, fontSize: 18, fontWeight: 700 }}
                type="number" min="1" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', display: 'block', marginBottom: 4 }}>Date</label>
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="mb-3">
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', display: 'block', marginBottom: 4 }}>Note (optional)</label>
            <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. LESCO September" />
          </div>
          {/* Live preview */}
          {amount && Number(amount) > 0 && (
            <div style={{
              padding: '8px 12px', borderRadius: 6, marginBottom: 10,
              background: `${cat.color}0d`, border: `1px solid ${cat.color}30`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Recording</span>
              <span style={{ fontFamily: KK.mono, fontWeight: 700, color: cat.color }}>
                {cat.icon} {cat.label} — Rs {Number(amount).toLocaleString()}
              </span>
            </div>
          )}
          <button className="btn-primary w-full justify-center" onClick={handleAdd}>
            <Plus size={14} /> Add {cat.label}
          </button>
        </KkCard>
      )}

      {/* Quick presets */}
      <KkCard>
        <p style={{ fontFamily: KK.serif, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
          ⚡ Quick Presets
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_PRESETS.map(p => {
            const c = CATS.find(x => x.id === p.catId)
            return (
              <button key={p.label}
                onClick={() => applyPreset(p)}
                style={{
                  background: KK.card, border: `1px solid ${KK.border2}`,
                  borderRadius: 7, padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14 }}>{c?.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>{p.label}</span>
                </div>
                <span style={{ fontFamily: KK.mono, fontSize: 13, fontWeight: 700, color: c?.color }}>
                  Rs {p.amount.toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </KkCard>
    </div>
  )
}

/* ─── Log Tab ─────────────────────────────────────────────────── */
function LogTab({ expenses, onEdit, onDelete }) {
  const [filterCat, setFilterCat] = useState('all')
  const [editEntry, setEditEntry] = useState(null)

  const visible = filterCat === 'all' ? expenses : expenses.filter(e => e.category === filterCat)
  const sorted  = [...visible].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt?.localeCompare(a.createdAt || '') || 0)

  return (
    <div className="space-y-3">
      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCat('all')}
          style={{
            flexShrink: 0, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: filterCat === 'all' ? '#f97316' : KK.card,
            color: filterCat === 'all' ? '#000' : '#94a3b8',
            border: `1px solid ${filterCat === 'all' ? '#f97316' : KK.border}`,
            cursor: 'pointer',
          }}>All</button>
        {CATS.filter(c => expenses.some(e => e.category === c.id)).map(c => (
          <button key={c.id}
            onClick={() => setFilterCat(c.id)}
            style={{
              flexShrink: 0, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: filterCat === c.id ? c.color : KK.card,
              color: filterCat === c.id ? '#000' : '#94a3b8',
              border: `1px solid ${filterCat === c.id ? c.color : KK.border}`,
              cursor: 'pointer',
            }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ fontFamily: KK.serif, fontSize: 13, color: '#475569' }}>No expenses in this period.</p>
        </div>
      ) : (
        <div style={{ border: `1px solid ${KK.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {sorted.map((e, i) => {
            const cat = CATS.find(c => c.id === e.category)
            return (
              <div key={e.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: i % 2 === 0 ? KK.card : KK.card2,
                  borderBottom: i < sorted.length - 1 ? `1px solid ${KK.border}` : 'none',
                }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{cat?.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 12, fontWeight: 600, color: cat?.color }}>{cat?.label}</span>
                    {e.note && <span style={{ fontSize: 11, color: '#64748b' }}>{e.note}</span>}
                  </div>
                  <span style={{ fontSize: 10, color: '#475569', fontFamily: KK.mono }}>{e.date}</span>
                </div>
                <span style={{ fontFamily: KK.mono, fontWeight: 700, fontSize: 13, color: '#f97316', flexShrink: 0 }}>
                  Rs {e.amount.toLocaleString()}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditEntry(e)}
                    style={{ padding: 5, borderRadius: 5, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', border: 'none' }}>
                    <Edit2 size={12} style={{ color: '#64748b' }} />
                  </button>
                  <button onClick={() => onDelete(e.id)}
                    style={{ padding: 5, borderRadius: 5, background: 'rgba(255,71,87,0.06)', cursor: 'pointer', border: 'none' }}>
                    <Trash2 size={12} style={{ color: '#dc2626' }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      {editEntry && (
        <EditModal entry={editEntry} onSave={updated => { onEdit(updated); setEditEntry(null) }} onClose={() => setEditEntry(null)} />
      )}
    </div>
  )
}

function EditModal({ entry, onSave, onClose }) {
  const [form, setForm] = useState({ ...entry })
  const cat = CATS.find(c => c.id === form.category)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.82)' }}>
      <div style={{ background: KK.card2, border: `1px solid ${KK.border}`, borderRadius: 12, padding: 20, width: '100%', maxWidth: 360 }}>
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontFamily: KK.serif, fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>Edit Expense</span>
          <button onClick={onClose}><X size={14} style={{ color: '#64748b' }} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (Rs)</label>
            <input className="input" style={{ fontFamily: KK.mono, fontSize: 16, fontWeight: 700 }}
              type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Optional note" />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn-primary flex-1 justify-center" onClick={() => onSave(form)}>Save Changes</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Categories Tab ──────────────────────────────────────────── */
function CatsTab({ expenses }) {
  const [drill, setDrill] = useState(null)

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const byCat = CATS.map(c => ({
    ...c,
    amount:  expenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0),
    count:   expenses.filter(e => e.category === c.id).length,
    entries: expenses.filter(e => e.category === c.id).sort((a, b) => b.date.localeCompare(a.date)),
  })).sort((a, b) => b.amount - a.amount)
  const maxAmt = byCat[0]?.amount || 1
  const slices = byCat.filter(c => c.amount > 0).map(c => ({ value: c.amount, color: c.color }))

  function openCatDrill(c) {
    setDrill({
      title: `${c.icon} ${c.label} — ${c.urdu}`,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontFamily: KK.mono, fontSize: 20, fontWeight: 700, color: c.color }}>Rs {c.amount.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>{c.entries.length} entries</span>
          </div>
          {c.entries.length === 0
            ? <p style={{ fontSize: 12, color: '#475569', fontFamily: KK.serif }}>No expenses in this category for this period.</p>
            : c.entries.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #2e2218' }}>
                <div>
                  <span style={{ fontFamily: KK.mono, fontSize: 10, color: '#475569', display: 'block' }}>{e.date}</span>
                  {e.note && <span style={{ fontSize: 11, color: '#94a3b8' }}>{e.note}</span>}
                </div>
                <span style={{ fontFamily: KK.mono, fontWeight: 700, fontSize: 12, color: c.color, flexShrink: 0 }}>Rs {e.amount.toLocaleString()}</span>
              </div>
            ))
          }
        </div>
      ),
    })
  }

  return (
    <div className="space-y-4">
      {drill && <KkDrillModal title={drill.title} onClose={() => setDrill(null)}>{drill.children}</KkDrillModal>}

      {slices.length > 0 && (
        <KkCard>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Donut slices={slices} size={140} thick={20} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: KK.mono, fontWeight: 700, fontSize: 14, color: '#f97316' }}>{`Rs ${total.toLocaleString()}`}</span>
                <span style={{ fontSize: 9, color: '#64748b', fontFamily: KK.serif, letterSpacing: 1 }}>TOTAL</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {byCat.filter(c => c.amount > 0).map(c => {
                const pct = total > 0 ? Math.round(c.amount / total * 100) : 0
                return (
                  <div key={c.id}
                    onClick={() => openCatDrill(c)}
                    style={{ cursor: 'pointer', borderRadius: 6, padding: '3px 5px', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 11, color: '#cbd5e1' }}>{c.icon} {c.label}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: KK.mono, fontSize: 11, color: c.color }}>Rs {c.amount.toLocaleString()}</span>
                        <span style={{ fontSize: 10, color: '#475569' }}>{pct}%</span>
                        <span style={{ fontSize: 9, color: '#334155' }}>→</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(c.amount / maxAmt) * 100}%`, background: c.color, borderRadius: 2, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
              {byCat.filter(c => c.amount === 0).length > 0 && (
                <p style={{ fontSize: 10, color: '#334155', marginTop: 6 }}>
                  + {byCat.filter(c => c.amount === 0).map(c => c.label).join(', ')} — Rs 0
                </p>
              )}
            </div>
          </div>
        </KkCard>
      )}

      {slices.length === 0 && (
        <div className="text-center py-12">
          <p style={{ fontFamily: KK.serif, fontSize: 13, color: '#475569' }}>No expenses recorded in this period.</p>
        </div>
      )}
    </div>
  )
}

/* ─── Insights Tab ────────────────────────────────────────────── */
function InsightsTab({ expenses, sales, period }) {
  const periodSales = filterSalesPeriod(sales, period)
  const revenue  = periodSales.reduce((s, x) => s + x.totalRevenue, 0)
  const cogs     = periodSales.reduce((s, x) => s + (x.totalCost || 0), 0)
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const gross    = revenue - cogs
  const net      = gross - expTotal

  const byCat = {}
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount })
  const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1])

  const byDay = {}
  expenses.forEach(e => { byDay[e.date] = (byDay[e.date] || 0) + e.amount })
  const heaviest = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]

  const insights = []

  if (sortedCats.length > 0) {
    const [topId, topAmt] = sortedCats[0]
    const cat = CATS.find(c => c.id === topId)
    const pctExp = Math.round(topAmt / expTotal * 100)
    const pctRev = revenue > 0 ? Math.round(topAmt / revenue * 100) : 0
    insights.push({
      icon: cat?.icon || '📌',
      text: `${cat?.label} is eating ${pctExp}% of your total expenses${pctRev > 0 ? ` and ${pctRev}% of revenue` : ''} — Rs ${topAmt.toLocaleString()}`,
      type: pctRev > 15 ? 'warn' : 'info',
    })
  }

  if (revenue > 0) {
    if (net < 0) {
      insights.push({ icon: '🔴', text: `You are in a loss of Rs ${Math.abs(net).toLocaleString()} — expenses exceed gross profit by ${Math.abs(net).toLocaleString()}`, type: 'urgent' })
    } else {
      const margin = (net / revenue * 100).toFixed(1)
      insights.push({ icon: '✅', text: `Net margin is ${margin}% — Rs ${net.toLocaleString()} true profit after all expenses`, type: Number(margin) >= 15 ? 'good' : 'warn' })
    }
  }

  if (gross > 0 && expTotal > 0) {
    const ratio = Math.round(expTotal / gross * 100)
    insights.push({
      icon: ratio > 30 ? '⚠️' : '📊',
      text: `Expense ratio is ${ratio}% of gross profit${ratio > 30 ? ' — above the 30% benchmark, review costs' : ' — within healthy range'}`,
      type: ratio > 30 ? 'warn' : 'good',
    })
  }

  if (heaviest) {
    const d = new Date(heaviest[0])
    const dayName = d.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short' })
    insights.push({ icon: '📅', text: `Heaviest expense day was ${dayName} — Rs ${heaviest[1].toLocaleString()} spent`, type: 'info' })
  }

  if (expenses.filter(e => e.category === 'bijli').length > 0) {
    const bijliAmt = byCat['bijli'] || 0
    if (revenue > 0 && bijliAmt / revenue > 0.1) {
      insights.push({ icon: '⚡', text: `Bijli (electricity) is ${Math.round(bijliAmt / revenue * 100)}% of revenue — Rs ${bijliAmt.toLocaleString()} — consider energy efficiency`, type: 'warn' })
    }
  }

  if (expenses.length === 0) {
    insights.push({ icon: '📖', text: 'Add expenses to see smart observations about your business', type: 'info' })
  }

  const colors = { urgent: '#dc2626', warn: '#d97706', good: '#16a34a', info: '#3b82f6' }
  const bgColors = { urgent: 'rgba(220,38,38,0.07)', warn: 'rgba(217,119,6,0.07)', good: 'rgba(22,163,74,0.07)', info: 'rgba(59,130,246,0.07)' }

  return (
    <div className="space-y-3">
      <p style={{ fontFamily: KK.serif, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>
        Observations — {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
      </p>
      {insights.map((ins, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 8, background: bgColors[ins.type], border: `1px solid ${colors[ins.type]}30` }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</span>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: '#cbd5e1' }}>{ins.text}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Export Tab ──────────────────────────────────────────────── */
function ExportTab({ expenses, sales, period }) {
  const periodSales = filterSalesPeriod(sales, period)
  const revenue  = periodSales.reduce((s, x) => s + x.totalRevenue, 0)
  const cogs     = periodSales.reduce((s, x) => s + (x.totalCost || 0), 0)
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const net      = revenue - cogs - expTotal

  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'
  const date = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })

  const waText = [
    `📒 *Kharcha Khata — ${periodLabel}*`,
    `📅 ${date}`,
    '━'.repeat(28),
    `💰 Revenue:  Rs ${revenue.toLocaleString()}`,
    `🏷  COGS:     Rs ${cogs.toLocaleString()}`,
    `📝 Expenses: Rs ${expTotal.toLocaleString()}`,
    `${net >= 0 ? '✅' : '🔴'} Net Profit: Rs ${net.toLocaleString()}`,
    '━'.repeat(28),
    ...expenses.slice(0, 10).map(e => {
      const cat = CATS.find(c => c.id === e.category)
      return `${cat?.icon} ${cat?.label}: Rs ${e.amount.toLocaleString()}${e.note ? ` (${e.note})` : ''}`
    }),
    expenses.length > 10 ? `...and ${expenses.length - 10} more` : '',
    '━'.repeat(28),
    `Margin: ${revenue > 0 ? ((net / revenue) * 100).toFixed(1) : '0'}%`,
  ].filter(Boolean).join('\n')

  function downloadCSV() {
    const rows = [
      ['Date', 'Category', 'Amount (Rs)', 'Note', 'Tax Deductible'],
      ...expenses.map(e => {
        const cat = CATS.find(c => c.id === e.category)
        return [e.date, cat?.label || e.category, e.amount, e.note, cat?.deductible ? 'Yes' : 'No']
      }),
      [],
      ['', 'Total Expenses', expTotal, '', ''],
      ['', 'Revenue', revenue, '', ''],
      ['', 'COGS', cogs, '', ''],
      ['', 'Net Profit', net, '', ''],
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `kharcha_${period}_${todayStr()}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded')
  }

  const deductible = expenses.filter(e => CATS.find(c => c.id === e.category)?.deductible)
  const dedAmt     = deductible.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <KkCard lined>
        <p style={{ fontFamily: KK.serif, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>
          {periodLabel} Summary
        </p>
        {[
          { l: 'Revenue',     v: revenue,  c: '#60a5fa' },
          { l: 'COGS',        v: cogs,     c: '#94a3b8' },
          { l: 'Expenses',    v: expTotal, c: '#f97316' },
          { l: 'Net Profit',  v: net,      c: net < 0 ? '#dc2626' : '#16a34a' },
          { l: 'Tax Deductible Expenses', v: dedAmt, c: '#eab308' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${KK.border}` }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{l}</span>
            <span style={{ fontFamily: KK.mono, fontWeight: 700, fontSize: 12, color: c }}>Rs {v.toLocaleString()}</span>
          </div>
        ))}
      </KkCard>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 8, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          <MessageCircle size={15} /> Share on WhatsApp
        </button>
        <button onClick={downloadCSV}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 8, background: `rgba(59,130,246,0.1)`, border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          <FileDown size={15} /> Download CSV
        </button>
      </div>

      {/* Deductible note */}
      {dedAmt > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)' }}>
          <p style={{ fontSize: 11, color: '#ca8a04' }}>
            💡 <strong>Rs {dedAmt.toLocaleString()}</strong> in expenses (Bijli, Kiraya, Tankhwa, Phone, Marmmat) may be tax-deductible. CSV includes a deductibility column.
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Main KharchaKhata page ──────────────────────────────────── */
const TABS = [
  { id: 'overview',    label: 'Overview',    icon: BarChart2   },
  { id: 'add',         label: 'Add',         icon: Plus        },
  { id: 'log',         label: 'Log',         icon: List        },
  { id: 'categories',  label: 'Categories',  icon: Zap         },
  { id: 'insights',    label: 'Insights',    icon: Lightbulb   },
  { id: 'export',      label: 'Export',      icon: FileDown    },
]

export default function KharchaKhata() {
  const [expenses, setExpenses] = useState(loadExp)
  const [sales, setSales]       = useState([])
  const [period, setPeriod]     = useState('month')
  const [tab, setTab]           = useState('overview')

  useEffect(() => {
    saleApi.getAll().then(setSales).catch(() => {})
  }, [])

  const filtered = useMemo(() => filterPeriod(expenses, period), [expenses, period])

  function addExpense(e)    { const n = [...expenses, e]; setExpenses(n); saveExp(n) }
  function editExpense(upd) { const n = expenses.map(e => e.id === upd.id ? upd : e); setExpenses(n); saveExp(n) }
  function delExpense(id)   {
    if (!confirm('Delete this expense?')) return
    const n = expenses.filter(e => e.id !== id); setExpenses(n); saveExp(n)
    toast.success('Expense deleted')
  }

  const periodSales = useMemo(() => filterSalesPeriod(sales, period), [sales, period])
  const revenue     = periodSales.reduce((s, x) => s + x.totalRevenue, 0)
  const cogs        = periodSales.reduce((s, x) => s + (x.totalCost || 0), 0)
  const expTotal    = filtered.reduce((s, e) => s + e.amount, 0)
  const net         = revenue - cogs - expTotal

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: KK.serif, fontSize: 26, fontWeight: 700, color: '#e2e8f0', letterSpacing: -0.5, marginBottom: 2 }}>
              Kharcha Khata
            </h1>
            <p style={{ fontSize: 11, color: '#475569', letterSpacing: 2, textTransform: 'uppercase', fontFamily: KK.serif }}>
              کھرچہ کھاتہ — Expense Ledger
            </p>
          </div>
          {/* Period selector */}
          <div className="flex gap-1.5">
            {[['today', 'Today'], ['week', 'Week'], ['month', 'Month']].map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                style={{
                  padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: period === v ? '#f97316' : KK.card2,
                  color: period === v ? '#000' : '#94a3b8',
                  border: `1px solid ${period === v ? '#f97316' : KK.border2}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Mini profit meter */}
        <div style={{ marginTop: 12 }}>
          <ProfitMeter revenue={revenue} cogs={cogs} expTotal={expTotal} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: active ? KK.card2 : 'transparent',
                color: active ? '#f97316' : '#64748b',
                border: `1px solid ${active ? KK.border2 : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              <Icon size={13} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'overview'   && <OverviewTab   expenses={filtered} sales={sales} period={period} />}
      {tab === 'add'        && <AddTab        onAdd={addExpense} />}
      {tab === 'log'        && <LogTab        expenses={filtered} onEdit={editExpense} onDelete={delExpense} />}
      {tab === 'categories' && <CatsTab       expenses={filtered} />}
      {tab === 'insights'   && <InsightsTab   expenses={filtered} sales={sales} period={period} />}
      {tab === 'export'     && <ExportTab     expenses={filtered} sales={sales} period={period} />}
    </div>
  )
}
