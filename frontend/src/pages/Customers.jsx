import { useEffect, useState } from 'react'
import {
  Plus, ChevronDown, ChevronUp, Trash2, Edit2, Search, X, Users,
  Bell, BellOff, MessageCircle, Lock, History
} from 'lucide-react'
import { customerApi } from '../services/api'
import toast from 'react-hot-toast'

const fmt = n => `Rs. ${Number(n || 0).toLocaleString()}`
const OWNER_PIN = '1234'

/* ─── Reminder helpers (localStorage) ───────────────────────── */
const getReminderData = () => JSON.parse(localStorage.getItem('k_reminders') || '{}')
const saveReminderData = d => localStorage.setItem('k_reminders', JSON.stringify(d))

function getReminderState(id) {
  return getReminderData()[id] || { snoozed: false, sentDates: [], lastSentAt: null }
}
function patchReminder(id, patch) {
  const d = getReminderData()
  d[id] = { ...getReminderState(id), ...patch }
  saveReminderData(d)
  return d[id]
}

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86_400_000)
}
function lastCreditDate(txs) {
  const credits = txs.filter(t => t.type === 'Credit').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return credits[0]?.createdAt ?? null
}
function reminderPhase(days) {
  if (days === null) return null
  if (days >= 30) return { n: 3, label: 'Day 30', urgency: 'high' }
  if (days >= 14) return { n: 2, label: 'Day 14', urgency: 'medium' }
  if (days >= 7)  return { n: 1, label: 'Day 7',  urgency: 'low' }
  return null
}
function buildMsg(customer, phaseN) {
  const name = customer.name.split(' ')[0]
  const amt  = fmt(customer.balance)
  if (phaseN === 1) return `Assalam o Alaikum ${name} bhai, ${amt} baaki hai — jab aayen tab clear kar lena 🙏`
  if (phaseN === 2) return `Bhai ${name}, ${amt} pehle se pending hai — please jald clear kar dein 🙏`
  return `${name} bhai, ${amt} ka hisaab kaafi der se pending hai — please aakar settle karen 🙏`
}
function buildBalanceSlip(customer, txs) {
  const lines = [`📋 *Balance Slip — ${customer.name}*`, '━'.repeat(28)]
  const sorted = [...txs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  let running = 0
  sorted.forEach(tx => {
    running += tx.type === 'Credit' ? Number(tx.amount) : -Number(tx.amount)
    const sign = tx.type === 'Credit' ? '+' : '-'
    const date = new Date(tx.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
    lines.push(`${date}: ${sign}Rs ${Number(tx.amount).toLocaleString()}${tx.note ? ` (${tx.note})` : ''}`)
  })
  lines.push('━'.repeat(28))
  lines.push(`*Balance: Rs ${Number(customer.balance).toLocaleString()}*`)
  return lines.join('\n')
}
function waLink(phone, text) {
  const cleaned = phone.replace(/\D/g, '').replace(/^0/, '')
  return `https://wa.me/92${cleaned}?text=${encodeURIComponent(text)}`
}

function riskLevel(balance) {
  if (balance >= 5000) return { label: 'High Risk', badge: 'badge-red',    dot: 'var(--red)' }
  if (balance >= 1000) return { label: 'Medium',    badge: 'badge-yellow', dot: 'var(--yellow)' }
  return                        { label: 'Low',       badge: 'badge-green',  dot: 'var(--accent)' }
}

/* ─── PIN Override Modal ─────────────────────────────────────── */
function PinModal({ onConfirm, onCancel }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (pin === OWNER_PIN) { onConfirm() }
    else { setErr(true); setPin('') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="card w-full max-w-xs">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={15} style={{ color: 'var(--orange)' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Owner PIN Override</h3>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text3)' }}>Credit limit will be exceeded. Enter PIN to continue.</p>
        <form onSubmit={submit} className="space-y-3">
          <input className="input text-center tracking-[0.4em] text-lg font-bold"
            type="password" maxLength={6} value={pin} autoFocus
            onChange={e => { setPin(e.target.value); setErr(false) }} placeholder="••••" />
          {err && <p className="text-xs text-center" style={{ color: 'var(--red)' }}>Incorrect PIN</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">Confirm</button>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Reminder Preview Modal ─────────────────────────────────── */
function ReminderModal({ customer, txs, onSent, onCancel }) {
  const days   = daysSince(lastCreditDate(txs))
  const phase  = reminderPhase(days)
  const msg    = buildMsg(customer, phase?.n ?? 1)
  const phone  = customer.phone?.replace(/\D/g, '')
  const url    = phone ? waLink(customer.phone, msg) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>WhatsApp Reminder</h3>
          <button onClick={onCancel}><X size={14} style={{ color: 'var(--text3)' }} /></button>
        </div>

        {phase && (
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded mb-3"
            style={{ background: 'rgba(255,214,10,0.12)', color: 'var(--yellow)', border: '1px solid rgba(255,214,10,0.25)' }}>
            {phase.label} reminder
          </span>
        )}

        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text3)' }}>
          Message preview (approve before sending)
        </p>
        <div className="p-3 rounded-lg text-sm leading-relaxed mb-4"
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          {msg}
        </div>

        <div className="flex gap-2">
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="btn-primary flex-1 flex items-center justify-center gap-2 no-underline"
              style={{ textDecoration: 'none' }}
              onClick={onSent}>
              <MessageCircle size={13} /> Approve &amp; Send
            </a>
          ) : (
            <div className="flex-1 text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,71,87,0.1)', color: 'var(--red)' }}>
              No phone number on file
            </div>
          )}
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Full History Modal ─────────────────────────────────────── */
function CustomerHistoryModal({ customer, onClose }) {
  const [txs, setTxs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [txFilter, setTxFilter] = useState('all')

  useEffect(() => {
    customerApi.getTransactions(customer.id)
      .then(data => setTxs(data))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [customer.id])

  function withRunning(list) {
    const asc = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    let bal = 0
    return asc.map(tx => {
      bal += tx.type === 'Credit' ? Number(tx.amount) : -Number(tx.amount)
      return { ...tx, running: bal }
    })
  }

  const enriched      = withRunning(txs)
  const totalCredited = txs.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0)
  const totalPaid     = txs.filter(t => t.type === 'Payment').reduce((s, t) => s + Number(t.amount), 0)

  const FILTERS = [
    { key: 'all',     label: 'All' },
    { key: 'credit',  label: 'Udhaar only' },
    { key: 'payment', label: 'Payments only' },
  ]

  const displayed = enriched
    .filter(tx => txFilter === 'all' || tx.type.toLowerCase() === txFilter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }}>
      <div className="card w-full max-w-xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
              Udhaar History — {customer.name}
            </h3>
            {customer.phone && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{customer.phone}</p>
            )}
          </div>
          <button onClick={onClose}><X size={15} style={{ color: 'var(--text3)' }} /></button>
        </div>

        {/* Summary cards */}
        {!loading && (
          <div className="grid grid-cols-3 gap-2 mb-4 flex-shrink-0">
            {[
              { label: 'Total Udhaar',  val: fmt(totalCredited),      color: 'var(--red)'    },
              { label: 'Total Paid',    val: fmt(totalPaid),           color: 'var(--accent)' },
              { label: 'Outstanding',   val: fmt(customer.balance),
                color: customer.balance > 0 ? 'var(--red)' : 'var(--accent)' },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-xl p-2.5 text-center"
                style={{ background: 'var(--surface2)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: 'var(--text3)' }}>{label}</p>
                <p className="text-base font-extrabold" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-3 flex-shrink-0">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setTxFilter(f.key)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: txFilter === f.key ? 'rgba(0,212,170,0.15)' : 'transparent',
                color:      txFilter === f.key ? 'var(--accent)' : 'var(--text3)',
                border:     `1px solid ${txFilter === f.key ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {f.label}
            </button>
          ))}
          {!loading && (
            <span className="ml-auto text-[10px]" style={{ color: 'var(--text3)' }}>
              {displayed.length} of {txs.length} entries
            </span>
          )}
        </div>

        {/* Timeline */}
        <div className="overflow-y-auto flex-1 pr-0.5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }} />
            </div>
          ) : displayed.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--text3)' }}>No transactions found.</p>
          ) : (
            <div>
              {displayed.map((tx, i) => {
                const isCredit = tx.type === 'Credit'
                const dot    = isCredit ? 'var(--red)' : 'var(--accent)'
                const dotBg  = isCredit ? 'rgba(255,71,87,0.14)' : 'rgba(0,212,170,0.14)'
                const dotBdr = isCredit ? 'rgba(255,71,87,0.28)' : 'rgba(0,212,170,0.28)'
                return (
                  <div key={tx.id} className="flex gap-3 pb-4 last:pb-0">
                    {/* Dot + line */}
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: 32 }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold z-10"
                        style={{ background: dotBg, color: dot, border: `1.5px solid ${dotBdr}` }}>
                        {isCredit ? 'U' : 'P'}
                      </div>
                      {i < displayed.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)', minHeight: 12 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5 pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={isCredit ? 'badge-red' : 'badge-green'}
                              style={{ fontSize: 10 }}>
                              {isCredit ? 'Udhaar' : 'Payment'}
                            </span>
                            {tx.note && (
                              <span className="text-xs" style={{ color: 'var(--text2)' }}>{tx.note}</span>
                            )}
                          </div>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                            {new Date(tx.createdAt).toLocaleDateString('en-PK', {
                              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                            })}
                            {' · '}
                            {new Date(tx.createdAt).toLocaleTimeString('en-PK', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-sm" style={{ color: dot }}>
                            {isCredit ? '+' : '−'}{fmt(tx.amount)}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                            bal: {fmt(tx.running)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Customer Form ──────────────────────────────────────────── */
function CustomerForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: '', phone: '', address: '', creditLimit: '' }
  )
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    await onSave({
      name: form.name,
      phone: form.phone,
      address: form.address,
      creditLimit: form.creditLimit !== '' && form.creditLimit !== null ? Number(form.creditLimit) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Name *</label>
        <input className="input" value={form.name} onChange={set('name')} placeholder="Customer name" autoFocus />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" value={form.phone} onChange={set('phone')} placeholder="03XX-XXXXXXX" />
      </div>
      <div>
        <label className="label">Address</label>
        <input className="input" value={form.address} onChange={set('address')} placeholder="Area / Street" />
      </div>
      <div>
        <label className="label">
          Credit Limit (Rs)
          <span className="ml-1 font-normal" style={{ color: 'var(--text3)' }}>— optional, leave blank for no limit</span>
        </label>
        <input className="input" type="number" min="0" value={form.creditLimit ?? ''}
          onChange={set('creditLimit')} placeholder="e.g. 2000" />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}><X size={14} /></button>
      </div>
    </form>
  )
}

/* ─── Transaction Form ───────────────────────────────────────── */
function TransactionForm({ customer, balance, onSave, onCancel }) {
  const [form, setForm]       = useState({ customerId: customer.id, amount: '', type: 'Credit', note: '' })
  const [pinOverride, setPinOverride] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const limit      = customer.creditLimit
  const remaining  = limit != null ? limit - balance : null
  const QUICK_PAY  = [500, 1000, 2000, 5000]
  const newBalance = balance + (form.type === 'Credit' ? Number(form.amount || 0) : -Number(form.amount || 0))
  const wouldExceed = form.type === 'Credit' && limit != null && !pinOverride
    && Number(form.amount) > 0 && (balance + Number(form.amount)) > limit

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      return toast.error('Enter a valid amount')
    if (wouldExceed) { setShowPin(true); return }
    await onSave({ ...form, amount: Number(form.amount) })
  }

  return (
    <>
      {showPin && (
        <PinModal
          onConfirm={() => { setPinOverride(true); setShowPin(false) }}
          onCancel={() => setShowPin(false)}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg mt-3"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>Add Transaction</p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Amount (Rs)</label>
            <input className="input" type="number" min="1" value={form.amount}
              onChange={set('amount')} placeholder="0" autoFocus />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={set('type')}>
              <option value="Credit">Credit (Udhaar)</option>
              <option value="Payment">Payment Received</option>
            </select>
          </div>
        </div>

        {/* Quick payment chips */}
        {form.type === 'Payment' && balance > 0 && (
          <div>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: 'var(--text3)' }}>Quick amounts</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PAY.filter(a => a < balance).map(a => (
                <button key={a} type="button"
                  className="text-xs px-2.5 py-1 rounded-md font-semibold transition-colors"
                  style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.2)' }}
                  onClick={() => setForm(f => ({ ...f, amount: String(a) }))}>
                  Rs {a.toLocaleString()}
                </button>
              ))}
              <button type="button"
                className="text-xs px-2.5 py-1 rounded-md font-semibold transition-colors"
                style={{ background: 'rgba(0,212,170,0.15)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.3)' }}
                onClick={() => setForm(f => ({ ...f, amount: String(Math.round(balance)) }))}>
                Full {fmt(balance)}
              </button>
            </div>
          </div>
        )}

        {/* Credit limit warning */}
        {form.type === 'Credit' && limit != null && (
          <div className="text-xs px-2.5 py-1.5 rounded-md"
            style={{
              background: wouldExceed ? 'rgba(255,71,87,0.08)' : 'rgba(0,212,170,0.05)',
              border: `1px solid ${wouldExceed ? 'rgba(255,71,87,0.3)' : 'rgba(0,212,170,0.15)'}`,
              color: wouldExceed ? 'var(--red)' : 'var(--text3)',
            }}>
            {wouldExceed
              ? `⚠️ Exceeds limit by ${fmt((balance + Number(form.amount)) - limit)} — PIN required`
              : `Credit remaining: ${fmt(remaining)} of ${fmt(limit)}`
            }
            {pinOverride && (
              <span className="ml-2 font-semibold" style={{ color: 'var(--orange)' }}>PIN override active</span>
            )}
          </div>
        )}

        <div>
          <label className="label">Note</label>
          <input className="input" value={form.note} onChange={set('note')}
            placeholder="e.g. Groceries, flour, milk" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1">Add</button>
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </>
  )
}

/* ─── Customer Card ──────────────────────────────────────────── */
function CustomerCard({ customer, onDelete, onUpdate }) {
  const [expanded, setExpanded]           = useState(false)
  const [txs, setTxs]                     = useState([])
  const [showTxForm, setShowTxForm]       = useState(false)
  const [showEditForm, setShowEditForm]   = useState(false)
  const [showReminder, setShowReminder]   = useState(false)
  const [showHistory, setShowHistory]     = useState(false)
  const [loading, setLoading]             = useState(false)
  const [reminderSt, setReminderSt]       = useState(() => getReminderState(customer.id))

  const risk    = riskLevel(customer.balance)
  const hasDebt = customer.balance > 0
  const accent  = hasDebt ? 'var(--red)' : 'var(--accent)'
  const limit   = customer.creditLimit
  const limitPct = limit ? Math.min(100, (customer.balance / limit) * 100) : null
  const overLimit = limit != null && customer.balance > limit

  // Reminder state
  const txDays   = txs.length > 0 ? daysSince(lastCreditDate(txs)) : null
  const phase    = reminderPhase(txDays)
  const needReminder = hasDebt && !reminderSt.snoozed && phase !== null

  // Settling: last two txs are both payments
  const sorted = [...txs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const isSettling = txs.length >= 2 && sorted[0]?.type === 'Payment' && sorted[1]?.type === 'Payment'

  // Running balance timeline
  function withRunning(list) {
    const asc = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    let bal = 0
    return asc.map(tx => {
      bal += tx.type === 'Credit' ? Number(tx.amount) : -Number(tx.amount)
      return { ...tx, running: bal }
    })
  }

  async function loadTxs(forceOpen = false) {
    if (!expanded || forceOpen) {
      setLoading(true)
      try { const data = await customerApi.getTransactions(customer.id); setTxs(data) }
      catch (e) { toast.error(e.message) }
      finally { setLoading(false) }
    }
    if (!forceOpen) setExpanded(e => !e)
  }

  async function handleAddTx(form) {
    try {
      const tx = await customerApi.addTransaction(form)
      setTxs(t => [...t, tx])
      onUpdate()
      setShowTxForm(false)
      toast.success('Transaction added')
    } catch (e) { toast.error(e.message) }
  }

  async function openReminder() {
    if (txs.length === 0) await loadTxs(true)
    setShowReminder(true)
  }

  function handleReminderSent() {
    const updated = patchReminder(customer.id, {
      lastSentAt: new Date().toISOString(),
      sentDates: [...(reminderSt.sentDates || []), new Date().toISOString()],
    })
    setReminderSt(updated)
    setShowReminder(false)
    toast.success('Reminder sent via WhatsApp')
  }

  function toggleSnooze() {
    const updated = patchReminder(customer.id, { snoozed: !reminderSt.snoozed })
    setReminderSt(updated)
    toast.success(updated.snoozed ? 'Reminders paused for this customer' : 'Reminders re-enabled')
  }

  function shareSlip() {
    if (!txs.length) return toast.error('Expand history first to load transactions')
    const slip = buildBalanceSlip(customer, txs)
    if (!customer.phone) return toast.error('No phone number on file')
    window.open(waLink(customer.phone, slip), '_blank')
  }

  const timeline = expanded ? withRunning(txs) : []

  return (
    <>
      {showReminder && (
        <ReminderModal customer={customer} txs={txs} onSent={handleReminderSent} onCancel={() => setShowReminder(false)} />
      )}
      {showHistory && (
        <CustomerHistoryModal customer={customer} onClose={() => setShowHistory(false)} />
      )}

      <div className="overflow-hidden rounded-xl transition-all"
        style={{
          background: 'var(--surface)',
          border: `1px solid ${overLimit ? 'rgba(255,71,87,0.4)' : 'var(--border)'}`,
          borderLeft: `2px solid ${accent}`,
        }}>
        <div className="p-4">

          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: hasDebt ? 'rgba(255,71,87,0.15)' : 'rgba(0,212,170,0.15)', color: accent }}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{customer.name}</p>
                  {isSettling && <span className="badge-blue" style={{ fontSize: 10 }}>Settling</span>}
                  {overLimit  && <span className="badge-red"  style={{ fontSize: 10 }}>Over Limit</span>}
                </div>
                {customer.phone   && <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{customer.phone}</p>}
                {customer.address && <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{customer.address}</p>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-base leading-tight" style={{ color: accent }}>{fmt(customer.balance)}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {hasDebt && <span className="w-1.5 h-1.5 rounded-full" style={{ background: risk.dot }} />}
                <span className={hasDebt ? risk.badge : 'badge-green'}>{hasDebt ? risk.label : 'Settled'}</span>
              </div>
            </div>
          </div>

          {/* Credit limit bar */}
          {limit != null && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text3)' }}>
                <span>Used {fmt(customer.balance)}</span>
                <span>Limit {fmt(limit)}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${limitPct}%`,
                    background: limitPct >= 100 ? 'var(--red)' : limitPct >= 75 ? 'var(--orange)' : 'var(--accent)',
                  }} />
              </div>
            </div>
          )}

          {/* Reminder banner */}
          {needReminder && (
            <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(255,214,10,0.07)', border: '1px solid rgba(255,214,10,0.18)' }}>
              <Bell size={11} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
              <span style={{ color: 'var(--yellow)', flex: 1 }}>
                {phase.label} reminder overdue
                {reminderSt.lastSentAt && ` · last sent ${daysSince(reminderSt.lastSentAt)}d ago`}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            <button onClick={() => { setShowTxForm(f => !f); setShowEditForm(false) }}
              className="btn-primary text-xs py-1.5 px-3 flex-1">
              + Transaction
            </button>

            {hasDebt && (
              <>
                <button onClick={openReminder} title="Send WhatsApp reminder"
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(255,214,10,0.1)', color: 'var(--yellow)', border: '1px solid rgba(255,214,10,0.2)' }}>
                  <Bell size={13} />
                </button>
                <button onClick={toggleSnooze}
                  title={reminderSt.snoozed ? 'Reminders paused — click to re-enable' : 'Stop reminders for this customer'}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{
                    background: reminderSt.snoozed ? 'rgba(90,100,120,0.3)' : 'transparent',
                    color: reminderSt.snoozed ? 'var(--text2)' : 'var(--text3)',
                    border: '1px solid var(--border)',
                  }}>
                  <BellOff size={13} />
                </button>
              </>
            )}

            <button onClick={() => { setShowEditForm(f => !f); setShowTxForm(false) }}
              className="btn-secondary p-1.5" title="Edit">
              <Edit2 size={13} />
            </button>
            <button onClick={() => onDelete(customer.id)} className="btn-danger p-1.5" title="Delete">
              <Trash2 size={13} />
            </button>
            <button onClick={() => setShowHistory(true)} className="btn-secondary p-1.5" title="Full history">
              <History size={13} />
            </button>
            <button onClick={() => loadTxs()} className="btn-secondary p-1.5" title="Quick history">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {showTxForm && (
            <TransactionForm
              customer={customer}
              balance={customer.balance}
              onSave={handleAddTx}
              onCancel={() => setShowTxForm(false)}
            />
          )}

          {showEditForm && (
            <div className="mt-3 p-3 rounded-lg"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text3)' }}>
                Edit Customer
              </p>
              <CustomerForm
                initial={{
                  name: customer.name,
                  phone: customer.phone,
                  address: customer.address,
                  creditLimit: customer.creditLimit ?? '',
                }}
                onSave={async form => { await onUpdate(form); setShowEditForm(false) }}
                onCancel={() => setShowEditForm(false)}
              />
            </div>
          )}
        </div>

        {/* Transaction history */}
        {expanded && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
                Transaction History
              </p>
              {txs.length > 0 && (
                <button onClick={shareSlip}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold transition-colors"
                  style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}>
                  <MessageCircle size={10} /> Share Balance Slip
                </button>
              )}
            </div>

            {loading ? (
              <p className="text-xs" style={{ color: 'var(--text3)' }}>Loading...</p>
            ) : timeline.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text3)' }}>No transactions yet.</p>
            ) : (
              <div className="space-y-2">
                {[...timeline].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(tx => (
                  <div key={tx.id} className="flex items-start justify-between text-xs gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className={tx.type === 'Credit' ? 'badge-red' : 'badge-green'}
                        style={{ flexShrink: 0 }}>
                        {tx.type}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate" style={{ color: 'var(--text2)' }}>{tx.note || '—'}</p>
                        <p style={{ color: 'var(--text3)' }}>
                          {new Date(tx.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                          {' · '}bal: {fmt(tx.running)}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold flex-shrink-0"
                      style={{ color: tx.type === 'Credit' ? 'var(--red)' : 'var(--accent)' }}>
                      {tx.type === 'Credit' ? '+' : '−'}{fmt(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Main Customers Page ────────────────────────────────────── */
export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')

  async function load() {
    try { setCustomers(await customerApi.getAll()) }
    catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleCreate(form) {
    try { await customerApi.create(form); toast.success('Customer added'); setShowForm(false); load() }
    catch (e) { toast.error(e.message) }
  }
  async function handleUpdate(id, form) {
    if (!form) { load(); return }
    try { await customerApi.update(id, form); toast.success('Updated'); load() }
    catch (e) { toast.error(e.message) }
  }
  async function handleDelete(id) {
    if (!confirm('Delete this customer and all their transactions?')) return
    try { await customerApi.delete(id); toast.success('Deleted'); load() }
    catch (e) { toast.error(e.message) }
  }

  const debtors     = customers.filter(c => c.balance > 0)
  const totalUdhaar = debtors.reduce((s, c) => s + c.balance, 0)
  const highRisk    = debtors.filter(c => c.balance >= 5000).length
  const overLimit   = customers.filter(c => c.creditLimit != null && c.balance > c.creditLimit).length

  const filtered = customers.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    const mf = filter === 'all'
      || (filter === 'debt'  && c.balance > 0)
      || (filter === 'clear' && c.balance <= 0)
      || (filter === 'limit' && c.creditLimit != null && c.balance > c.creditLimit)
    return ms && mf
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }} />
    </div>
  )

  const STATS = [
    { label: 'Total Customers', val: customers.length,                       color: 'var(--blue)' },
    { label: 'Total Udhaar',    val: fmt(totalUdhaar),                       color: 'var(--red)',    sub: `${debtors.length} in debt` },
    { label: 'High Risk',       val: highRisk,                               color: 'var(--orange)', sub: 'Rs.5000+ owed' },
    { label: 'Over Limit',      val: overLimit,                              color: 'var(--yellow)', sub: 'exceeded credit limit' },
  ]

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ label, val, color, sub }) => (
          <div key={label} className="stat-card">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: color }} />
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>{label}</p>
            <p className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--text)' }}>{val}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>New Customer</h3>
          <CustomerForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          <input className="flex-1 outline-none text-sm bg-transparent"
            style={{ color: 'var(--text)', fontFamily: 'inherit' }}
            placeholder="Search by name or phone..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: 'var(--text3)' }} /></button>}
        </div>
        <select className="input" style={{ width: 152 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="debt">In Debt</option>
          <option value="clear">Settled</option>
          <option value="limit">Over Limit</option>
        </select>
        <button className="btn-primary" onClick={() => setShowForm(f => !f)}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Users size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text3)' }} />
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              {search ? 'No customers match your search.' : 'No customers yet.'}
            </p>
          </div>
        ) : filtered.map(c => (
          <CustomerCard
            key={c.id}
            customer={c}
            onDelete={handleDelete}
            onUpdate={form => handleUpdate(c.id, form)}
          />
        ))}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--text3)' }}>
          {filtered.length} of {customers.length} customers
        </p>
      )}
    </div>
  )
}
