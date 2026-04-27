import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Bell, BellOff, Send, Calendar,
  Check, X, Search, CheckCheck, ScrollText, Settings,
} from 'lucide-react'
import { customerApi } from '../services/api'
import toast from 'react-hot-toast'

/* ─── WA palette ─────────────────────────────────────────────── */
const WA = {
  bg:      '#0B141A',
  surface: '#111B21',
  header:  '#1F2C33',
  bubble:  '#005C4B',
  text:    '#E9EDEF',
  meta:    '#667781',
  accent:  '#00A884',
  ticks:   '#53BDEB',
}

/* ─── Utilities ──────────────────────────────────────────────── */
const fmt = n => `Rs.${Number(n || 0).toLocaleString()}`

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86_400_000)
}

function lastCreditDate(txs) {
  return txs
    .filter(t => t.type === 'Credit')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.createdAt ?? null
}

function autoTone(days) {
  if (!days || days < 14) return 'soft'
  if (days < 30) return 'medium'
  return 'firm'
}

function waLink(phone, text) {
  const n = (phone || '').replace(/\D/g, '').replace(/^0/, '')
  return `https://wa.me/92${n}?text=${encodeURIComponent(text)}`
}

/* ─── Reminder storage ───────────────────────────────────────── */
const LS = 'k_wa_v3'
const lsLoad = () => JSON.parse(localStorage.getItem(LS) || '{}')
const lsSave = d => localStorage.setItem(LS, JSON.stringify(d))

function getCD(id) {
  return lsLoad()[id] || { schedule: [7, 14, 30], paused: false, sendTime: '10:00', history: [] }
}
function patchCD(id, patch) {
  const d = lsLoad()
  d[id] = { ...getCD(id), ...patch }
  lsSave(d)
  return d[id]
}

/* ─── Templates (3 tones × 3 languages × 2 variants) ─────────── */
const TPLS = {
  soft: {
    urdu: [
      'آداب {name} بھائی! آپ کا {amount} کا حساب ابھی باقی ہے۔ جب بھی آئیں، کلیئر کر لیں — شکریہ 🙏',
      '{name} بھائی، سب ٹھیک ہے؟ بس یاد دلانا تھا کہ {amount} ابھی باقی ہے۔ کوئی جلدی نہیں 😊',
    ],
    english: [
      'Hi {name}! Gentle reminder — Rs.{amount} is pending at {shop}. Settle whenever convenient 🙏',
      'Assalam o Alaikum {name} bhai! Hope you\'re well. Rs.{amount} is still pending. No rush 😊',
    ],
    mixed: [
      '{name} bhai, Rs.{amount} baaki hai — jab aayen tab clear kar lena 🙏',
      'Assalam o Alaikum {name}! Rs.{amount} pending hai. No rush, jab marzi karen 😊',
    ],
  },
  medium: {
    urdu: [
      'السلام علیکم {name} بھائی! {days} دن سے {amount} کا حساب باقی ہے۔ براہ کرم جلد کلیئر کریں 🙏',
      '{name} بھائی، {amount} والا حساب {days} دن سے پینڈنگ ہے — مہربانی فرما کر جلد آئیں 🙏',
    ],
    english: [
      '{name} bhai, Rs.{amount} has been pending for {days} days. Please clear at your earliest 🙏',
      'Hi {name}, Rs.{amount} from {days} days ago is still outstanding. Kindly settle soon.',
    ],
    mixed: [
      '{name} bhai, {days} din ho gaye — Rs.{amount} abhi bhi pending hai. Jald clear karen 🙏',
      'Bhai {name}, Rs.{amount} {days} dino se pending hai — zaroor aana 🙏',
    ],
  },
  firm: {
    urdu: [
      '{name} بھائی، {amount} کا حساب {days} دن سے زائد عرصے سے باقی ہے۔ براہ کرم فوری طور پر آ کر سیٹل کریں۔',
      '{name} صاحب، {shop} کا {amount} کا قرض {days} دن سے پینڈنگ ہے — آج ضرور آئیں۔',
    ],
    english: [
      '{name} bhai, Rs.{amount} has been outstanding for {days} days. Please come and settle this immediately.',
      'Final reminder for {name}: Rs.{amount} overdue {days} days. Contact {shop} today.',
    ],
    mixed: [
      '{name} bhai, Rs.{amount} ka hisaab {days} din se pending hai — aaj zaroor aayen. Shukriya.',
      'Final reminder: {name} bhai, Rs.{amount} bohot der se baaki hai ({days} din). Aaj hi settle karen.',
    ],
  },
}

function fillTpl(tpl, vars) {
  return tpl
    .replace(/\{name\}/g,   vars.name   || 'Customer')
    .replace(/\{amount\}/g, vars.amount || 'Rs.0')
    .replace(/\{days\}/g,   vars.days != null ? String(vars.days) : '?')
    .replace(/\{shop\}/g,   vars.shop   || 'Ahmed Store')
    .replace(/\{phone\}/g,  vars.phone  || '')
}

/* ─── WA Chat Bubble Preview ─────────────────────────────────── */
function WAChatPreview({ message, customerName, language }) {
  const isUrdu  = language === 'urdu'
  const timeStr = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: WA.bg, height: 420 }}>

      {/* WA header bar */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: WA.header }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: WA.accent, color: '#fff' }}>
          {customerName?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: WA.text }}>
            {customerName || 'Customer'}
          </p>
          <p className="text-xs" style={{ color: WA.meta }}>online</p>
        </div>
        <MessageCircle size={17} style={{ color: WA.meta }} />
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col justify-end gap-2">
        {/* Date pill */}
        <div className="flex justify-center">
          <span className="text-[11px] px-3 py-0.5 rounded-full"
            style={{ background: 'rgba(17,27,33,0.85)', color: WA.meta }}>
            {dateStr}
          </span>
        </div>

        {/* Sent bubble */}
        <div className="flex justify-end">
          <div className="relative max-w-[88%]">
            {/* Bubble tail */}
            <svg className="absolute -right-1.5 bottom-0 pointer-events-none"
              width="10" height="16" viewBox="0 0 10 16" style={{ zIndex: 1 }}>
              <path d="M0 16 Q10 16 10 6 L10 0 Q9 8 0 16Z" fill={WA.bubble} />
            </svg>

            <div className="rounded-xl rounded-tr-sm px-3.5 pt-2.5 pb-6 relative"
              style={{ background: WA.bubble, minWidth: 100 }}>
              <p className="text-sm whitespace-pre-wrap break-words"
                dir={isUrdu ? 'rtl' : 'ltr'}
                style={{
                  color: WA.text,
                  fontFamily: isUrdu
                    ? "'Noto Nastaliq Urdu','Jameel Noori Nastaliq','Arial Unicode MS',sans-serif"
                    : 'inherit',
                  fontSize:    isUrdu ? 15 : 13,
                  lineHeight:  isUrdu ? 2.2 : 1.55,
                }}>
                {message || '…'}
              </p>
              {/* Timestamp + read ticks */}
              <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1">
                <span className="text-[10px]" style={{ color: 'rgba(233,237,239,0.5)' }}>{timeStr}</span>
                <CheckCheck size={14} style={{ color: WA.ticks }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative input row */}
      <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{ background: WA.header }}>
        <div className="flex-1 rounded-full px-4 py-1.5 text-xs"
          style={{ background: WA.bg, color: WA.meta }}>
          Type a message
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: WA.accent }}>
          <Send size={14} style={{ color: '#fff' }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Compose Tab ─────────────────────────────────────────────── */
const VAR_CHIPS = [
  { v: '{name}',   hint: 'First name'    },
  { v: '{amount}', hint: 'Balance owed'  },
  { v: '{days}',   hint: 'Days overdue'  },
  { v: '{shop}',   hint: 'Shop name'     },
  { v: '{phone}',  hint: 'Phone number'  },
]

function ComposeTab({ customer, txs }) {
  const days = daysSince(lastCreditDate(txs))

  const [tone,      setTone]      = useState(() => autoTone(days))
  const [lang,      setLang]      = useState('mixed')
  const [variant,   setVariant]   = useState(0)
  const [customMsg, setCustomMsg] = useState(null)
  const taRef = useRef(null)

  const tpl  = TPLS[tone]?.[lang]?.[variant % 2] ?? ''
  const vars = {
    name:   customer.name.split(' ')[0],
    amount: `Rs.${Number(customer.balance).toLocaleString()}`,
    days,
    shop:   'Ahmed Store',
    phone:  customer.phone,
  }
  const filled  = fillTpl(tpl, vars)
  const message = customMsg !== null ? customMsg : filled

  useEffect(() => { setTone(autoTone(days)) }, [days])
  useEffect(() => { setCustomMsg(null) }, [tone, lang, variant])

  function insertVar(v) {
    const el = taRef.current
    if (!el) { setCustomMsg((customMsg ?? filled) + v); return }
    const s = el.selectionStart, e = el.selectionEnd
    const base = customMsg !== null ? customMsg : filled
    setCustomMsg(base.slice(0, s) + v + base.slice(e))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + v.length, s + v.length)
    })
  }

  function handleSend() {
    if (!customer.phone) return toast.error('No phone number on file')
    const cd = getCD(customer.id)
    patchCD(customer.id, {
      history: [
        { id: Date.now(), tone, lang, message, sentAt: new Date().toISOString(), status: 'sent' },
        ...(cd.history || []),
      ],
    })
    window.open(waLink(customer.phone, message), '_blank')
    toast.success('WhatsApp opened — tap Send in the app')
  }

  const TONES = [
    { key: 'soft',   icon: '🌿', label: 'Soft',         color: '#00A884' },
    { key: 'medium', icon: '⚡', label: 'Medium',        color: '#FFB347' },
    { key: 'firm',   icon: '🔴', label: 'Final Notice',  color: '#FF4757' },
  ]
  const LANGS = [
    { key: 'urdu',    label: 'اردو',    dir: 'rtl' },
    { key: 'english', label: 'English', dir: 'ltr' },
    { key: 'mixed',   label: 'Mixed',   dir: 'ltr' },
  ]

  return (
    <div className="flex flex-col xl:flex-row gap-5">
      {/* Controls */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Tone */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
            Tone
            {days !== null && (
              <span className="ml-2 normal-case font-normal" style={{ color: WA.accent }}>
                · auto: {tone} ({days}d overdue)
              </span>
            )}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TONES.map(t => (
              <button key={t.key} onClick={() => setTone(t.key)}
                className="py-3 rounded-xl flex flex-col items-center gap-1 transition-all"
                style={{
                  background: tone === t.key ? `${t.color}18` : 'var(--surface2)',
                  border: `2px solid ${tone === t.key ? t.color : 'var(--border)'}`,
                }}>
                <span className="text-xl leading-none">{t.icon}</span>
                <span className="text-[11px] font-bold"
                  style={{ color: tone === t.key ? t.color : 'var(--text3)' }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
            Language
          </p>
          <div className="flex gap-2">
            {LANGS.map(l => (
              <button key={l.key} onClick={() => setLang(l.key)}
                dir={l.dir}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: lang === l.key ? 'rgba(0,168,132,0.15)' : 'var(--surface2)',
                  border: `1.5px solid ${lang === l.key ? WA.accent : 'var(--border)'}`,
                  color:  lang === l.key ? WA.accent : 'var(--text3)',
                  fontFamily: l.key === 'urdu' ? "'Noto Nastaliq Urdu',sans-serif" : 'inherit',
                }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea header */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
            Message
          </p>
          <div className="flex gap-1.5">
            <button onClick={() => setCustomMsg(null)}
              className="text-[10px] px-2 py-0.5 rounded transition-all"
              style={{ background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
              Reset
            </button>
            <button onClick={() => setVariant(v => 1 - v)}
              className="text-[10px] px-2 py-0.5 rounded transition-all"
              style={{ background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
              Variant {variant + 1}/2
            </button>
          </div>
        </div>

        {/* Editable textarea */}
        <textarea
          ref={taRef}
          rows={lang === 'urdu' ? 6 : 5}
          dir={lang === 'urdu' ? 'rtl' : 'ltr'}
          className="w-full rounded-xl p-3 resize-none transition-all"
          style={{
            background:  'var(--surface2)',
            border:      '1px solid var(--border)',
            color:       'var(--text)',
            outline:     'none',
            fontFamily:  lang === 'urdu'
              ? "'Noto Nastaliq Urdu','Jameel Noori Nastaliq',sans-serif"
              : 'inherit',
            fontSize:    lang === 'urdu' ? 15 : 13,
            lineHeight:  lang === 'urdu' ? 2.2 : 1.55,
          }}
          value={message}
          onChange={e => setCustomMsg(e.target.value)}
        />

        {/* Variable chips */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
            Insert at cursor
          </p>
          <div className="flex flex-wrap gap-1.5">
            {VAR_CHIPS.map(c => (
              <button key={c.v} onClick={() => insertVar(c.v)} title={c.hint}
                className="text-xs px-2 py-0.5 rounded-md font-mono transition-all"
                style={{
                  background: 'rgba(0,168,132,0.1)',
                  color:  WA.accent,
                  border: '1px solid rgba(0,168,132,0.25)',
                }}>
                {c.v}
              </button>
            ))}
          </div>
        </div>

        {/* Send button */}
        <button onClick={handleSend}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          style={{ background: '#25D366', color: '#fff' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1EBE58'}
          onMouseLeave={e => e.currentTarget.style.background = '#25D366'}>
          <MessageCircle size={15} />
          Open WhatsApp &amp; Send
        </button>
      </div>

      {/* Preview */}
      <div className="w-full xl:w-72 flex-shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
          Live preview
        </p>
        <WAChatPreview message={message} customerName={customer.name} language={lang} />
      </div>
    </div>
  )
}

/* ─── Schedule Tab ────────────────────────────────────────────── */
function ScheduleTab({ customer }) {
  const [data, setData] = useState(() => getCD(customer.id))

  const toggleDay = day => setData(
    patchCD(customer.id, {
      schedule: data.schedule.includes(day)
        ? data.schedule.filter(d => d !== day)
        : [...data.schedule, day].sort((a, b) => a - b),
    })
  )

  const togglePause = () => {
    const u = patchCD(customer.id, { paused: !data.paused })
    setData(u)
    toast.success(u.paused ? 'Reminders paused' : 'Reminders re-enabled')
  }

  const DAYS = [7, 14, 30, 45, 60]
  const FLOW = [
    { day: 7,  tone: 'Soft',   icon: '🌿', color: '#00A884' },
    { day: 14, tone: 'Medium', icon: '⚡', color: '#FFB347' },
    { day: 30, tone: 'Firm',   icon: '🔴', color: '#FF4757' },
  ]

  return (
    <div className="max-w-lg space-y-6">

      {/* Pause toggle card */}
      <div className="flex items-center justify-between p-4 rounded-xl"
        style={{
          background: data.paused ? 'rgba(255,71,87,0.06)' : 'rgba(0,168,132,0.06)',
          border: `1px solid ${data.paused ? 'rgba(255,71,87,0.2)' : 'rgba(0,168,132,0.2)'}`,
        }}>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
            {data.paused ? '🔕 Reminders Paused' : '🔔 Reminders Active'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
            {data.paused
              ? 'Good for relatives — no automated nudges'
              : 'Auto-triggers on selected days below'}
          </p>
        </div>
        <button onClick={togglePause}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: data.paused ? 'rgba(0,168,132,0.15)' : 'rgba(255,71,87,0.12)',
            color: data.paused ? WA.accent : '#FF4757',
            border: `1px solid ${data.paused ? 'rgba(0,168,132,0.3)' : 'rgba(255,71,87,0.25)'}`,
          }}>
          {data.paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Trigger days */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
          Send reminder on day (after last credit)
        </p>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(day => {
            const on = data.schedule.includes(day)
            return (
              <button key={day} onClick={() => toggleDay(day)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: on ? 'rgba(0,168,132,0.15)' : 'var(--surface2)',
                  border: `2px solid ${on ? WA.accent : 'var(--border)'}`,
                  color:  on ? WA.accent : 'var(--text3)',
                }}>
                Day {day}
              </button>
            )
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text3)' }}>
          Days counted from the customer's last credit entry
        </p>
      </div>

      {/* Escalation flow */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
          Auto-escalation flow
        </p>
        <div className="flex items-stretch gap-2">
          {FLOW.map((e, i) => (
            <div key={e.day} className="flex items-center gap-2 flex-1">
              <div className="flex-1 p-3 rounded-xl text-center"
                style={{ background: `${e.color}10`, border: `1px solid ${e.color}28` }}>
                <p className="text-lg mb-0.5">{e.icon}</p>
                <p className="text-xs font-bold" style={{ color: e.color }}>Day {e.day}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{e.tone}</p>
              </div>
              {i < FLOW.length - 1 && (
                <span className="text-base flex-shrink-0" style={{ color: 'var(--text3)' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preferred send time */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
          Preferred send time
        </p>
        <input type="time" value={data.sendTime || '10:00'}
          onChange={e => setData(patchCD(customer.id, { sendTime: e.target.value }))}
          className="input" style={{ width: 150 }} />
        <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
          Due reminders appear in Queue at this time
        </p>
      </div>
    </div>
  )
}

/* ─── History Tab ─────────────────────────────────────────────── */
function HistoryTab({ customer }) {
  const history = getCD(customer.id).history || []

  const STATUS = {
    sent:      { color: '#53BDEB', bg: 'rgba(83,189,235,0.1)',  label: 'Sent' },
    delivered: { color: WA.accent, bg: 'rgba(0,168,132,0.1)',   label: 'Delivered' },
    read:      { color: WA.accent, bg: 'rgba(0,168,132,0.15)',  label: 'Read ✓✓' },
  }
  const TONE_ICON = { soft: '🌿', medium: '⚡', firm: '🔴' }
  const LANG_LBL  = { urdu: 'اردو', english: 'EN', mixed: 'MX' }

  if (!history.length) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <MessageCircle size={40} style={{ color: 'var(--text3)', opacity: 0.2 }} />
      <p className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>No reminders sent yet</p>
      <p className="text-xs" style={{ color: 'var(--text3)' }}>Compose and send from the Compose tab</p>
    </div>
  )

  return (
    <div className="space-y-2 max-w-2xl">
      {history.map(entry => {
        const st     = STATUS[entry.status] || STATUS.sent
        const isUrdu = entry.lang === 'urdu'
        return (
          <div key={entry.id} className="rounded-xl p-3 space-y-2"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            {/* Meta row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{TONE_ICON[entry.tone]}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                  {LANG_LBL[entry.lang]}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </div>
              <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text3)' }}>
                {new Date(entry.sentAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                {' · '}
                {new Date(entry.sentAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {/* Message bubble */}
            <div className="p-2.5 rounded-lg break-words"
              dir={isUrdu ? 'rtl' : 'ltr'}
              style={{
                background: WA.bg,
                color: '#aaa',
                fontFamily: isUrdu ? "'Noto Nastaliq Urdu',sans-serif" : 'inherit',
                fontSize:   isUrdu ? 14 : 12,
                lineHeight: isUrdu ? 2.1 : 1.55,
              }}>
              {entry.message}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Queue Tab ───────────────────────────────────────────────── */
function QueueTab({ customers, txsMap, onSelect }) {
  const due = customers.filter(c => {
    const cd = getCD(c.id)
    if (cd.paused || !txsMap[c.id]) return false
    const days = daysSince(lastCreditDate(txsMap[c.id]))
    return days !== null && cd.schedule.some(td => days >= td)
  })

  const unchecked = customers.filter(c =>
    !txsMap[c.id] && c.balance > 0 && !getCD(c.id).paused
  )

  const TONE_ICON  = { soft: '🌿', medium: '⚡', firm: '🔴' }

  return (
    <div className="max-w-2xl space-y-5">
      {due.length === 0 && unchecked.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Check size={40} style={{ color: WA.accent, opacity: 0.5 }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Queue clear!</p>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>No reminders are due right now</p>
        </div>
      )}

      {due.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
            Due now — {due.length} reminder{due.length !== 1 ? 's' : ''} awaiting approval
          </p>
          <div className="space-y-2">
            {due.map(c => {
              const days = daysSince(lastCreditDate(txsMap[c.id]))
              const tone = autoTone(days)
              return (
                <div key={c.id} className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--red)', fontSize: 15 }}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>
                      {fmt(c.balance)} · {days}d overdue · {TONE_ICON[tone]} {tone}
                    </p>
                  </div>
                  <button onClick={() => onSelect(c)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 flex-shrink-0 transition-all"
                    style={{ background: '#25D366', color: '#fff' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1EBE58'}
                    onMouseLeave={e => e.currentTarget.style.background = '#25D366'}>
                    <MessageCircle size={12} />
                    Review &amp; Send
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {unchecked.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
            Not yet checked — select to load days
          </p>
          <div className="space-y-2">
            {unchecked.slice(0, 6).map(c => (
              <button key={c.id} onClick={() => onSelect(c)}
                className="w-full rounded-xl p-3 flex items-center gap-3 text-left transition-all"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                  style={{ background: 'var(--surface3)', color: 'var(--text3)', fontSize: 15 }}>
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>
                    {fmt(c.balance)} pending · click to check
                  </p>
                </div>
                <span style={{ color: 'var(--text3)' }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function WhatsAppReminders() {
  const [customers,  setCustomers]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)
  const [tab,        setTab]        = useState('compose')
  const [filter,     setFilter]     = useState('all')
  const [search,     setSearch]     = useState('')
  const [txsMap,     setTxsMap]     = useState({})
  const [loadingTxs, setLoadingTxs] = useState(false)

  useEffect(() => {
    customerApi.getAll()
      .then(all => {
        const debtors = all
          .filter(c => c.balance > 0)
          .sort((a, b) => b.balance - a.balance)
        setCustomers(debtors)
        if (debtors.length > 0) setSelected(debtors[0])
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected || txsMap[selected.id]) return
    setLoadingTxs(true)
    customerApi.getTransactions(selected.id)
      .then(txs => setTxsMap(m => ({ ...m, [selected.id]: txs })))
      .catch(e => toast.error(e.message))
      .finally(() => setLoadingTxs(false))
  }, [selected?.id])

  const selectedTxs  = selected ? (txsMap[selected.id] || []) : []
  const selectedDays = daysSince(lastCreditDate(selectedTxs))

  const displayed = customers.filter(c => {
    const cd = getCD(c.id)
    const ms = !search
      || c.name.toLowerCase().includes(search.toLowerCase())
      || (c.phone || '').includes(search)
    const mf = filter === 'all'
      || (filter === 'urgent' && c.balance >= 3000)
      || (filter === 'active' && !cd.paused)
      || (filter === 'paused' && cd.paused)
    return ms && mf
  })

  const queueCount = customers.filter(c => {
    const cd = getCD(c.id)
    if (cd.paused || !txsMap[c.id]) return false
    const d = daysSince(lastCreditDate(txsMap[c.id]))
    return d !== null && cd.schedule.some(td => d >= td)
  }).length

  const TABS = [
    { key: 'compose',  label: 'Compose',  Icon: MessageCircle, badge: 0 },
    { key: 'schedule', label: 'Schedule', Icon: Calendar,      badge: 0 },
    { key: 'history',  label: 'History',  Icon: ScrollText,    badge: 0 },
    { key: 'queue',    label: 'Queue',    Icon: Bell,          badge: queueCount },
  ]

  function selectCustomer(c) { setSelected(c); setTab('compose') }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: WA.accent }} />
    </div>
  )

  if (customers.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <MessageCircle size={40} style={{ color: 'var(--text3)', opacity: 0.2 }} />
      <p className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>No customers with outstanding balance</p>
      <p className="text-xs" style={{ color: 'var(--text3)' }}>Add udhaar transactions from the Udhaar Book first</p>
    </div>
  )

  return (
    <div className="flex overflow-hidden rounded-2xl"
      style={{ height: 'calc(100vh - 116px)', minHeight: 520 }}>

      {/* ── WA-style customer sidebar ── */}
      <div className="flex-shrink-0 flex flex-col"
        style={{
          width: 272,
          background: WA.surface,
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>

        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ background: WA.header }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={15} style={{ color: WA.accent }} />
            <p className="font-bold text-sm" style={{ color: WA.text }}>Udhaar Reminders</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5"
            style={{ background: WA.bg }}>
            <Search size={12} style={{ color: WA.meta, flexShrink: 0 }} />
            <input
              className="flex-1 text-xs bg-transparent outline-none"
              style={{ color: WA.text }}
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={11} style={{ color: WA.meta }} />
              </button>
            )}
          </div>
        </div>

        {/* Filter strip */}
        <div className="flex flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            { key: 'all',    label: 'All' },
            { key: 'urgent', label: 'Urgent' },
            { key: 'active', label: 'Active' },
            { key: 'paused', label: 'Paused' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex-1 py-2 text-[10px] font-bold uppercase transition-all"
              style={{
                color: filter === f.key ? WA.accent : WA.meta,
                borderBottom: `2px solid ${filter === f.key ? WA.accent : 'transparent'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto">
          {displayed.length === 0 ? (
            <p className="p-6 text-xs text-center" style={{ color: WA.meta }}>No customers found</p>
          ) : displayed.map(c => {
            const cd    = getCD(c.id)
            const txs   = txsMap[c.id] || []
            const days  = daysSince(lastCreditDate(txs))
            const urgent = days !== null ? days >= 14 : c.balance >= 3000
            const isSel  = selected?.id === c.id

            return (
              <button key={c.id} onClick={() => selectCustomer(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b"
                style={{
                  background:   isSel ? 'rgba(0,168,132,0.08)' : 'transparent',
                  borderColor:  'rgba(255,255,255,0.03)',
                }}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                  style={{
                    background: urgent ? 'rgba(255,71,87,0.18)' : 'rgba(0,168,132,0.18)',
                    color:      urgent ? '#FF4757' : WA.accent,
                    fontSize:   15,
                  }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="font-semibold text-sm truncate" style={{ color: WA.text }}>
                      {c.name}
                    </p>
                    {days !== null && (
                      <span className="text-[10px] flex-shrink-0"
                        style={{ color: days >= 30 ? '#FF4757' : days >= 14 ? '#FFB347' : WA.meta }}>
                        {days}d
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs truncate" style={{ color: WA.meta }}>
                      {fmt(c.balance)} overdue
                    </p>
                    {cd.paused ? (
                      <BellOff size={10} style={{ color: WA.meta, flexShrink: 0 }} />
                    ) : days !== null && days >= 30 ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(255,71,87,0.18)', color: '#FF4757' }}>
                        Urgent
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Sidebar footer */}
        <div className="px-4 py-2 text-[10px] flex-shrink-0"
          style={{ background: WA.header, color: WA.meta }}>
          {customers.length} debtors · {fmt(customers.reduce((s, c) => s + c.balance, 0))} total
        </div>
      </div>

      {/* ── Right detail panel ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--bg)' }}>

        {/* Customer header */}
        <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: 'rgba(255,71,87,0.15)', color: 'var(--red)' }}>
            {selected.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{selected.name}</p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              {selected.phone || 'No phone'}
              {' · '}
              {fmt(selected.balance)} overdue
              {loadingTxs
                ? ' · loading…'
                : selectedDays !== null ? ` · ${selectedDays} days` : ''}
            </p>
          </div>
          {!loadingTxs && selectedDays !== null && selectedDays >= 14 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,71,87,0.12)', color: 'var(--red)' }}>
              ⚠ {selectedDays >= 30 ? 'Critical' : 'Overdue'}
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex px-5 flex-shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          {TABS.map(({ key, label, Icon, badge }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-1.5 py-3 px-3 text-xs font-semibold transition-all"
              style={{
                color:        tab === key ? WA.accent : 'var(--text3)',
                borderBottom: `2px solid ${tab === key ? WA.accent : 'transparent'}`,
                marginBottom: -1,
              }}>
              <Icon size={13} />
              {label}
              {badge > 0 && (
                <span className="ml-0.5 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#FF4757', color: '#fff' }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'compose'  && <ComposeTab  key={selected.id} customer={selected} txs={selectedTxs} />}
          {tab === 'schedule' && <ScheduleTab key={selected.id} customer={selected} />}
          {tab === 'history'  && <HistoryTab  key={selected.id} customer={selected} />}
          {tab === 'queue'    && (
            <QueueTab
              customers={customers}
              txsMap={txsMap}
              onSelect={selectCustomer}
            />
          )}
        </div>
      </div>
    </div>
  )
}
