import { useEffect, useState, useRef } from 'react'
import {
  Plus, Edit2, Trash2, AlertTriangle, Search, X,
  RefreshCw, PackageCheck, MessageCircle, History,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  Upload, Download, CheckCircle, AlertCircle, ScanLine,
} from 'lucide-react'
import { itemApi, supplierApi, purchaseApi } from '../services/api'
import toast from 'react-hot-toast'
import BarcodeScanner from '../components/BarcodeScanner'
import { link as linkBarcode, unlink as unlinkBarcode, unlinkItem, find as findBarcode, reverseFind } from '../store/barcodeStore'

const UNITS = ['pcs', 'kg', 'litre', 'box', 'bag', 'dozen', 'pack']

/* ─── Reorder localStorage helpers ──────────────────────────── */
const getReorders = () => JSON.parse(localStorage.getItem('k_reorders') || '{}')
const saveReorders = d => localStorage.setItem('k_reorders', JSON.stringify(d))

function setReorder(itemId, data) {
  const d = getReorders(); d[itemId] = data; saveReorders(d)
}
function clearReorder(itemId) {
  const d = getReorders(); delete d[itemId]; saveReorders(d)
}

/* ─── Item Form ──────────────────────────────────────────────── */
function ItemForm({ initial, initialBarcode = '', onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', unit: 'pcs', costPrice: '', sellingPrice: '', quantity: '', lowStockThreshold: '5'
  })
  const [barcode, setBarcode] = useState(initialBarcode)
  const [scanBarcode, setScanBarcode] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Item name required')
    if (!form.costPrice || !form.sellingPrice || !form.quantity) return toast.error('Fill all price/qty fields')
    await onSave(
      {
        ...form,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity),
        lowStockThreshold: Number(form.lowStockThreshold),
      },
      barcode.trim()
    )
  }

  const margin = form.costPrice && form.sellingPrice
    ? Math.round(((form.sellingPrice - form.costPrice) / form.sellingPrice) * 100)
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Item Name *</label>
          <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Basmati Rice (1kg)" autoFocus />
        </div>
        <div>
          <label className="label">Unit</label>
          <select className="input" value={form.unit} onChange={set('unit')}>
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Quantity *</label>
          <input className="input" type="number" min="0" value={form.quantity} onChange={set('quantity')} placeholder="0" />
        </div>
        <div>
          <label className="label">Cost Price (Rs) *</label>
          <input className="input" type="number" min="0" step="0.01" value={form.costPrice} onChange={set('costPrice')} placeholder="0" />
        </div>
        <div>
          <label className="label">Selling Price (Rs) *</label>
          <input className="input" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={set('sellingPrice')} placeholder="0" />
        </div>
        <div className="col-span-2">
          <label className="label">Low Stock Alert Threshold</label>
          <input className="input" type="number" min="1" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
        </div>
        <div className="col-span-2">
          <label className="label">Barcode (optional)</label>
          <div className="flex gap-2">
            <input className="input flex-1" value={barcode} onChange={e => setBarcode(e.target.value)}
              placeholder="EAN-13, UPC-A, or any code…" />
            <button type="button"
              onClick={() => setScanBarcode(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
              style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.25)' }}>
              <ScanLine size={14} /> Scan
            </button>
          </div>
          {barcode && (
            <p className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>
              Barcode will be linked to this item after saving.
            </p>
          )}
        </div>
      </div>
      {scanBarcode && (
        <BarcodeScanner
          title="Scan Item Barcode"
          onScan={code => { setBarcode(code); setScanBarcode(false); toast.success(`Barcode captured: ${code}`) }}
          onClose={() => setScanBarcode(false)}
        />
      )}
      {margin !== null && (
        <div className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            background: margin >= 20 ? 'rgba(0,212,170,0.1)' : margin >= 10 ? 'rgba(255,214,10,0.1)' : 'rgba(255,71,87,0.1)',
            color: margin >= 20 ? 'var(--accent)' : margin >= 10 ? 'var(--yellow)' : 'var(--red)',
            border: `1px solid ${margin >= 20 ? 'rgba(0,212,170,0.2)' : margin >= 10 ? 'rgba(255,214,10,0.2)' : 'rgba(255,71,87,0.2)'}`,
          }}>
          Margin: {margin}% · Profit per unit: Rs. {(Number(form.sellingPrice) - Number(form.costPrice)).toFixed(2)}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1">Save Item</button>
        <button type="button" className="btn-secondary" onClick={onCancel}><X size={14} /></button>
      </div>
    </form>
  )
}

/* ─── Reorder Modal ──────────────────────────────────────────── */
function ReorderModal({ item, suppliers, onClose }) {
  const [supplierId, setSupplierId] = useState('')
  const [qty, setQty]               = useState(String(Math.max(item.lowStockThreshold * 3, 10)))
  const [deliveryDate, setDeliveryDate] = useState('')

  const supplier = suppliers.find(s => s.id === Number(supplierId))
  const msg = supplier
    ? `Assalam o Alaikum ${supplier.name} bhai, ${item.name} ${qty} ${item.unit} bhej dena. Shukriya 🙏`
    : ''

  function send() {
    if (!supplier) return toast.error('Select a supplier first')
    const phone = supplier.phone?.replace(/\D/g, '').replace(/^0/, '')
    setReorder(item.id, {
      itemId: item.id, itemName: item.name,
      supplierId, supplierName: supplier.name,
      qty, orderedAt: new Date().toISOString(), expectedDelivery: deliveryDate,
    })
    window.open(`https://wa.me/92${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    toast.success('Reorder sent & logged as pending')
    onClose(true)
  }

  function savePending() {
    if (!supplier) return toast.error('Select a supplier first')
    setReorder(item.id, {
      itemId: item.id, itemName: item.name,
      supplierId, supplierName: supplier.name,
      qty, orderedAt: new Date().toISOString(), expectedDelivery: deliveryDate,
    })
    toast.success('Reorder saved as pending')
    onClose(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="card w-full max-w-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Reorder: {item.name}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--orange)' }}>
              ⚠ Only {item.quantity} {item.unit} left (alert at {item.lowStockThreshold})
            </p>
          </div>
          <button onClick={() => onClose(false)}><X size={14} style={{ color: 'var(--text3)' }} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Supplier</label>
            <select className="input" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} — {s.company}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Qty to order ({item.unit})</label>
              <input className="input" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div>
              <label className="label">Expected by</label>
              <input className="input" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
          </div>

          {msg && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>
                WhatsApp message
              </p>
              <div className="p-2.5 rounded-lg text-sm leading-relaxed"
                style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                {msg}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={send} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <MessageCircle size={13} /> Send to Supplier
            </button>
            <button onClick={savePending} className="btn-secondary">Save Pending</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Receive Stock Modal ────────────────────────────────────── */
function ReceiveStockModal({ items, suppliers, onClose }) {
  const [supplierId, setSupplierId] = useState('')
  const [lines, setLines]           = useState([{ itemId: '', qty: '', unitCost: '' }])
  const [submitting, setSubmitting] = useState(false)

  const addLine    = () => setLines(l => [...l, { itemId: '', qty: '', unitCost: '' }])
  const removeLine = i => setLines(l => l.filter((_, idx) => idx !== i))
  const setLine    = (i, k, v) => setLines(l => l.map((row, idx) => idx === i ? { ...row, [k]: v } : row))

  function prefillCost(i, itemId) {
    const item = items.find(it => it.id === Number(itemId))
    setLine(i, 'itemId', itemId)
    if (item) setLine(i, 'unitCost', String(item.costPrice))
  }

  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitCost) || 0), 0)

  async function handleSubmit() {
    if (!supplierId) return toast.error('Select a supplier')
    const valid = lines.filter(l => l.itemId && l.qty && l.unitCost)
    if (!valid.length) return toast.error('Add at least one item')
    setSubmitting(true)
    try {
      await purchaseApi.create({
        supplierId: Number(supplierId),
        notes: `Received ${new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        items: valid.map(l => ({ itemId: Number(l.itemId), quantity: Number(l.qty), unitCost: Number(l.unitCost) })),
      })
      // clear any pending reorders for received items
      valid.forEach(l => clearReorder(l.itemId))
      toast.success(`Stock received! Total cost Rs ${total.toLocaleString()}`)
      onClose(true)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="card w-full max-w-lg flex flex-col" style={{ maxHeight: '88vh' }}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Receive Stock</h3>
          <button onClick={() => onClose(false)}><X size={14} style={{ color: 'var(--text3)' }} /></button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-4 pr-0.5">
          <div>
            <label className="label">Supplier</label>
            <select className="input" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} — {s.company}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
                Items Received
              </p>
              <button onClick={addLine} className="text-xs font-semibold flex items-center gap-1"
                style={{ color: 'var(--accent)' }}>
                <Plus size={11} /> Add Row
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => {
                const item = items.find(it => it.id === Number(line.itemId))
                const costUp   = item && line.unitCost && Number(line.unitCost) > item.costPrice
                const costDown = item && line.unitCost && Number(line.unitCost) < item.costPrice

                return (
                  <div key={i} className="p-3 rounded-lg space-y-2"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-3">
                        <select className="input text-sm" value={line.itemId}
                          onChange={e => prefillCost(i, e.target.value)}>
                          <option value="">Select item...</option>
                          {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <input className="input text-sm" type="number" min="1"
                          value={line.qty} onChange={e => setLine(i, 'qty', e.target.value)}
                          placeholder={`Qty (${item?.unit || 'pcs'})`} />
                      </div>
                      <div>
                        <input className="input text-sm" type="number" min="0" step="0.01"
                          value={line.unitCost} onChange={e => setLine(i, 'unitCost', e.target.value)}
                          placeholder="Unit cost"
                          style={{ borderColor: costUp ? 'rgba(255,107,53,0.6)' : undefined }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>
                          Rs {((Number(line.qty) || 0) * (Number(line.unitCost) || 0)).toLocaleString()}
                        </span>
                        {lines.length > 1 && (
                          <button onClick={() => removeLine(i)}
                            style={{ color: 'var(--red)' }}><X size={12} /></button>
                        )}
                      </div>
                    </div>

                    {costUp && (
                      <p className="text-[11px]" style={{ color: 'var(--orange)' }}>
                        ⚠ Cost increased Rs {item.costPrice} → Rs {line.unitCost} — consider updating selling price
                      </p>
                    )}
                    {costDown && (
                      <p className="text-[11px]" style={{ color: 'var(--accent)' }}>
                        ✓ Cost decreased Rs {item.costPrice} → Rs {line.unitCost}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>Total Received Cost</span>
            <span className="font-extrabold text-base" style={{ color: 'var(--text)' }}>Rs {total.toLocaleString()}</span>
          </div>
          <button onClick={handleSubmit} disabled={submitting}
            className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Saving...' : 'Confirm Receipt & Update Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Stock History — By Supplier ───────────────────────────── */
function SupplierHistoryView({ purchases, suppliers }) {
  const [expanded, setExpanded] = useState({})
  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const grouped = suppliers
    .map(sup => ({
      ...sup,
      purchases: purchases
        .filter(p => p.supplierId === sup.id)
        .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)),
    }))
    .filter(s => s.purchases.length > 0)

  if (grouped.length === 0)
    return <p className="text-sm text-center py-12" style={{ color: 'var(--text3)' }}>No purchase records found.</p>

  return (
    <div className="space-y-2">
      {grouped.map(sup => {
        const isOpen    = expanded[sup.id]
        const totalSpent = sup.purchases.reduce((s, p) => s + p.totalCost, 0)
        return (
          <div key={sup.id} className="rounded-xl overflow-hidden"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>

            {/* Supplier header */}
            <button className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => toggle(sup.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(91,138,245,0.15)', color: 'var(--blue)' }}>
                  {sup.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text)' }}>{sup.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                    {sup.company}{sup.phone ? ` · ${sup.phone}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    Rs {totalSpent.toLocaleString()}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text3)' }}>
                    {sup.purchases.length} purchase{sup.purchases.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text3)' }} />
                        : <ChevronDown size={14} style={{ color: 'var(--text3)' }} />}
              </div>
            </button>

            {/* Purchase list */}
            {isOpen && (
              <div className="divide-y" style={{ borderTop: '1px solid var(--border)' }}>
                {sup.purchases.map(p => (
                  <div key={p.id} className="px-4 py-3">
                    {/* Purchase header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          {new Date(p.purchaseDate).toLocaleDateString('en-PK', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                        {p.notes && (
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{p.notes}</p>
                        )}
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)' }}>
                        Rs {p.totalCost.toLocaleString()}
                      </span>
                    </div>

                    {/* Items in this purchase */}
                    <div className="space-y-1">
                      {p.items?.map((pi, idx) => (
                        <div key={idx}
                          className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: 'var(--surface3)' }}>
                          <span className="font-medium" style={{ color: 'var(--text)' }}>{pi.itemName}</span>
                          <div className="flex items-center gap-4" style={{ color: 'var(--text3)' }}>
                            <span>×{pi.quantity} {pi.unit || 'pcs'}</span>
                            <span>@ <span className="font-semibold" style={{ color: 'var(--text2)' }}>
                              Rs {pi.unitCost}
                            </span></span>
                            <span className="font-semibold" style={{ color: 'var(--text)' }}>
                              = Rs {(pi.quantity * pi.unitCost).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Stock History — By Item ────────────────────────────────── */
function ItemHistoryView({ purchases, items }) {
  const [expanded, setExpanded] = useState({})
  const [search, setSearch]     = useState('')
  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  // Build per-item history from all purchases
  const byItem = items
    .map(item => {
      const history = []
      purchases.forEach(p => {
        (p.items || []).forEach(pi => {
          if (pi.itemId === item.id) {
            history.push({
              date:         p.purchaseDate,
              supplierName: p.supplierName,
              qty:          pi.quantity,
              unitCost:     pi.unitCost,
              total:        pi.quantity * pi.unitCost,
              notes:        p.notes,
            })
          }
        })
      })
      return { ...item, history: history.sort((a, b) => new Date(b.date) - new Date(a.date)) }
    })
    .filter(i => i.history.length > 0
      && i.name.toLowerCase().includes(search.toLowerCase()))

  if (byItem.length === 0 && !search)
    return <p className="text-sm text-center py-12" style={{ color: 'var(--text3)' }}>No purchase records found.</p>

  return (
    <div className="space-y-2">
      {/* Per-item search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <Search size={12} style={{ color: 'var(--text3)' }} />
        <input className="flex-1 outline-none text-xs bg-transparent"
          style={{ color: 'var(--text)', fontFamily: 'inherit' }}
          placeholder="Filter by item name..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')}><X size={11} style={{ color: 'var(--text3)' }} /></button>}
      </div>

      {byItem.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text3)' }}>No items match.</p>
      ) : byItem.map(item => {
        const isOpen     = expanded[item.id]
        const totalQty   = item.history.reduce((s, h) => s + h.qty, 0)
        const totalCost  = item.history.reduce((s, h) => s + h.total, 0)
        const costs      = item.history.map(h => h.unitCost)
        const minCost    = Math.min(...costs)
        const maxCost    = Math.max(...costs)
        const hasCostVar = minCost !== maxCost

        return (
          <div key={item.id} className="rounded-xl overflow-hidden"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>

            {/* Item header */}
            <button className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => toggle(item.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)' }}>
                  {item.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{item.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                    {item.history.length} restocks · {totalQty} {item.unit} in · Rs {totalCost.toLocaleString()} total
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {hasCostVar && (
                  <div className="text-right">
                    <p className="text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>
                      Rs {minCost} – {maxCost}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--orange)' }}>cost varied</p>
                  </div>
                )}
                {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text3)' }} />
                        : <ChevronDown size={14} style={{ color: 'var(--text3)' }} />}
              </div>
            </button>

            {/* Cost history table */}
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Date', 'Supplier', 'Qty', 'Unit Cost', 'Total'].map(h => (
                        <th key={h}
                          className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'var(--text3)', background: 'var(--surface3)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.history.map((h, i) => {
                      const prev      = item.history[i + 1]?.unitCost
                      const priceUp   = prev != null && h.unitCost > prev
                      const priceDown = prev != null && h.unitCost < prev
                      return (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="px-4 py-2 text-xs" style={{ color: 'var(--text2)' }}>
                            {new Date(h.date).toLocaleDateString('en-PK', {
                              day: 'numeric', month: 'short', year: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-2 text-xs" style={{ color: 'var(--text2)' }}>
                            {h.supplierName}
                          </td>
                          <td className="px-4 py-2 text-xs text-right font-semibold"
                            style={{ color: 'var(--text)' }}>
                            {h.qty} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-xs text-right font-bold">
                            <span style={{ color: priceUp ? 'var(--orange)' : priceDown ? 'var(--accent)' : 'var(--text)' }}>
                              Rs {h.unitCost}
                              {priceUp   && <TrendingUp   size={11} className="inline ml-1" />}
                              {priceDown && <TrendingDown size={11} className="inline ml-1" />}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-right font-semibold"
                            style={{ color: 'var(--text)' }}>
                            Rs {h.total.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Stock History Modal ────────────────────────────────────── */
function StockHistoryModal({ items, suppliers, onClose }) {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('supplier')

  useEffect(() => {
    purchaseApi.getAll()
      .then(setPurchases)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalSpent  = purchases.reduce((s, p) => s + p.totalCost, 0)
  const totalOrders = purchases.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }}>
      <div className="card w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>Stock History</h3>
            {!loading && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                {totalOrders} purchase order{totalOrders !== 1 ? 's' : ''} · Rs {totalSpent.toLocaleString()} total spent
              </p>
            )}
          </div>
          <button onClick={onClose}><X size={15} style={{ color: 'var(--text3)' }} /></button>
        </div>

        {/* View toggle */}
        <div className="flex gap-1.5 mb-4 flex-shrink-0">
          {[
            { key: 'supplier', label: 'By Supplier' },
            { key: 'item',     label: 'By Item / Pricing' },
          ].map(t => (
            <button key={t.key} onClick={() => setView(t.key)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: view === t.key ? 'rgba(0,212,170,0.15)' : 'var(--surface2)',
                color:      view === t.key ? 'var(--accent)' : 'var(--text3)',
                border:     `1px solid ${view === t.key ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }} />
            </div>
          ) : view === 'supplier' ? (
            <SupplierHistoryView purchases={purchases} suppliers={suppliers} />
          ) : (
            <ItemHistoryView purchases={purchases} items={items} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Bulk Upload Modal ──────────────────────────────────────── */
const CSV_HEADERS = ['name', 'unit', 'costPrice', 'sellingPrice', 'quantity', 'lowStockThreshold']
const TEMPLATE_ROWS = [
  ['Basmati Rice 1kg', 'kg', '120', '150', '50', '10'],
  ['Cooking Oil 1L', 'litre', '200', '250', '30', '5'],
  ['Sugar 1kg', 'kg', '90', '110', '40', '8'],
]

function downloadTemplate() {
  const rows = [CSV_HEADERS, ...TEMPLATE_ROWS]
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'inventory_template.csv'; a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return { error: 'CSV must have a header row and at least one data row.' }
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
  const required = ['name', 'unit', 'costprice', 'sellingprice', 'quantity']
  for (const r of required) {
    if (!headers.includes(r)) return { error: `Missing required column: "${r}"` }
  }
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
    const row = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] || '' })
    const name = row['name']
    const unit = row['unit'] || 'pcs'
    const costPrice = Number(row['costprice'])
    const sellingPrice = Number(row['sellingprice'])
    const quantity = Number(row['quantity'])
    const lowStockThreshold = Number(row['lowstockthreshold'] || row['lowstock'] || '5') || 5
    const errors = []
    if (!name) errors.push('name required')
    if (!UNITS.includes(unit)) errors.push(`unit must be one of: ${UNITS.join(', ')}`)
    if (isNaN(costPrice) || costPrice < 0) errors.push('invalid costPrice')
    if (isNaN(sellingPrice) || sellingPrice < 0) errors.push('invalid sellingPrice')
    if (isNaN(quantity) || quantity < 0) errors.push('invalid quantity')
    rows.push({ name, unit, costPrice, sellingPrice, quantity, lowStockThreshold, errors, _line: i + 1 })
  }
  return { rows }
}

function BulkUploadModal({ onClose, onDone }) {
  const [rows, setRows]           = useState(null)
  const [parseError, setParseError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [results, setResults]     = useState(null)
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const { rows, error } = parseCSV(ev.target.result)
      if (error) { setParseError(error); setRows(null) }
      else { setParseError(''); setRows(rows) }
    }
    reader.readAsText(file)
  }

  const validRows   = rows?.filter(r => r.errors.length === 0) || []
  const invalidRows = rows?.filter(r => r.errors.length > 0)  || []

  async function handleUpload() {
    if (!validRows.length) return
    setUploading(true)
    const res = []
    for (const row of validRows) {
      try {
        await itemApi.create({
          name: row.name, unit: row.unit,
          costPrice: row.costPrice, sellingPrice: row.sellingPrice,
          quantity: row.quantity, lowStockThreshold: row.lowStockThreshold,
        })
        res.push({ name: row.name, ok: true })
      } catch (e) {
        res.push({ name: row.name, ok: false, err: e.message })
      }
    }
    setResults(res)
    setUploading(false)
    const ok = res.filter(r => r.ok).length
    if (ok > 0) { toast.success(`${ok} item${ok !== 1 ? 's' : ''} added`); onDone() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }}>
      <div className="card w-full max-w-xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Bulk Upload Items</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
              Upload a CSV file to add multiple items at once
            </p>
          </div>
          <button onClick={onClose}><X size={14} style={{ color: 'var(--text3)' }} /></button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-4">
          {/* Step 1: Download template */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>Step 1 — Download Template</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text3)' }}>
              Download the CSV template with sample data, fill it in, then upload.
              Columns: <span style={{ color: 'var(--accent)' }}>name, unit, costPrice, sellingPrice, quantity, lowStockThreshold</span>
            </p>
            <p className="text-xs mb-2" style={{ color: 'var(--text3)' }}>
              Valid units: {UNITS.join(', ')}
            </p>
            <button onClick={downloadTemplate}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.2)' }}>
              <Download size={13} /> Download inventory_template.csv
            </button>
          </div>

          {/* Step 2: Upload file */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold mb-3" style={{ color: 'var(--text)' }}>Step 2 — Upload Your CSV</p>
            <label
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl text-center"
              style={{
                border: '2px dashed var(--border2)', cursor: 'pointer',
                background: 'var(--surface3)', transition: 'border-color 0.2s',
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) { fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: [f] } }) }
              }}>
              <Upload size={22} style={{ color: 'var(--text3)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>
                Click to choose file or drag & drop
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text3)' }}>CSV files only</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </label>
            {parseError && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}>
                <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: 'var(--red)' }}>{parseError}</p>
              </div>
            )}
          </div>

          {/* Preview */}
          {rows && !results && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                  Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} found
                </p>
                <div className="flex items-center gap-3">
                  {validRows.length > 0 && (
                    <span className="text-xs" style={{ color: 'var(--accent)' }}>
                      {validRows.length} valid
                    </span>
                  )}
                  {invalidRows.length > 0 && (
                    <span className="text-xs" style={{ color: 'var(--red)' }}>
                      {invalidRows.length} errors
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface3)' }}>
                        {['#', 'Name', 'Unit', 'Cost', 'Sell', 'Qty', 'Status'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => {
                        const ok = row.errors.length === 0
                        return (
                          <tr key={i} style={{ borderTop: '1px solid var(--border)', background: ok ? '' : 'rgba(255,71,87,0.04)' }}>
                            <td style={{ padding: '6px 10px', color: 'var(--text3)' }}>{row._line}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--text)', fontWeight: 500 }}>{row.name || '—'}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>{row.unit}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>Rs {row.costPrice}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>Rs {row.sellingPrice}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>{row.quantity}</td>
                            <td style={{ padding: '6px 10px' }}>
                              {ok ? (
                                <CheckCircle size={13} style={{ color: 'var(--accent)' }} />
                              ) : (
                                <span style={{ color: 'var(--red)', fontSize: 10 }}>{row.errors.join('; ')}</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {invalidRows.length > 0 && (
                <p className="text-xs mt-2" style={{ color: 'var(--text3)' }}>
                  Rows with errors will be skipped. Fix the CSV and re-upload to include them.
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {results && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text)' }}>Upload Results</p>
              <div className="space-y-1.5">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: r.ok ? 'rgba(0,212,170,0.06)' : 'rgba(255,71,87,0.06)', border: `1px solid ${r.ok ? 'rgba(0,212,170,0.15)' : 'rgba(255,71,87,0.15)'}` }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{r.name}</span>
                    {r.ok
                      ? <CheckCircle size={13} style={{ color: 'var(--accent)' }} />
                      : <span className="text-xs" style={{ color: 'var(--red)' }}>{r.err}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          {!results ? (
            <button
              onClick={handleUpload}
              disabled={uploading || !validRows.length}
              className="btn-primary w-full disabled:opacity-40">
              {uploading
                ? 'Uploading...'
                : validRows.length
                ? `Add ${validRows.length} Item${validRows.length !== 1 ? 's' : ''}`
                : 'Upload a CSV to continue'}
            </button>
          ) : (
            <button onClick={onClose} className="btn-secondary w-full">Close</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Inventory Page ────────────────────────────────────── */
export default function Inventory() {
  const [items, setItems]         = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')
  const [reorderItem, setReorderItem]   = useState(null)
  const [showReceive, setShowReceive]   = useState(false)
  const [showHistory, setShowHistory]   = useState(false)
  const [reorders, setReordersState]    = useState(getReorders)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [scanFind, setScanFind]             = useState(false)
  const [highlightId, setHighlightId]       = useState(null)

  function handleScanFind(code) {
    setScanFind(false)
    const itemId = findBarcode(code)
    if (!itemId) { toast.error(`Barcode "${code}" not registered — set it via Edit on the item`); return }
    const item = items.find(i => i.id === itemId)
    if (!item) { toast.error('Item not found'); return }
    setSearch('')
    setFilter('all')
    setHighlightId(itemId)
    toast.success(`Found: ${item.name}`)
    setTimeout(() => {
      document.getElementById(`inv-row-${itemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
    setTimeout(() => setHighlightId(null), 3000)
  }

  async function load() {
    try {
      const [its, sups] = await Promise.all([itemApi.getAll(), supplierApi.getAll()])
      setItems(its); setSuppliers(sups)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function refreshReorders() { setReordersState(getReorders()) }

  async function handleCreate(form, barcode) {
    try {
      const created = await itemApi.create(form)
      if (barcode) linkBarcode(barcode, created.id)
      toast.success('Item added')
      setShowForm(false)
      load()
    } catch (e) { toast.error(e.message) }
  }
  async function handleUpdate(id, form, barcode) {
    try {
      await itemApi.update(id, form)
      unlinkItem(id)
      if (barcode) linkBarcode(barcode, id)
      toast.success('Updated')
      setEditItem(null)
      load()
    } catch (e) { toast.error(e.message) }
  }
  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return
    try {
      await itemApi.delete(id)
      clearReorder(id)
      unlinkItem(id)
      toast.success('Deleted')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const lowCount  = items.filter(i => i.isLowStock).length
  const outCount  = items.filter(i => i.quantity === 0).length
  const costValue = items.reduce((s, i) => s + i.costPrice * i.quantity, 0)
  const sellValue = items.reduce((s, i) => s + i.sellingPrice * i.quantity, 0)

  const filtered = items.filter(i => {
    const ms = i.name.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || (filter === 'low' && i.isLowStock) || (filter === 'ok' && !i.isLowStock)
    return ms && mf
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }} />
    </div>
  )

  return (
    <>
      {reorderItem && (
        <ReorderModal
          item={reorderItem}
          suppliers={suppliers}
          onClose={changed => { setReorderItem(null); if (changed) refreshReorders() }}
        />
      )}
      {showReceive && (
        <ReceiveStockModal
          items={items}
          suppliers={suppliers}
          onClose={changed => { setShowReceive(false); if (changed) load() }}
        />
      )}
      {showHistory && (
        <StockHistoryModal
          items={items}
          suppliers={suppliers}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showBulkUpload && (
        <BulkUploadModal
          onClose={() => setShowBulkUpload(false)}
          onDone={() => { setShowBulkUpload(false); load() }}
        />
      )}
      {scanFind && (
        <BarcodeScanner
          title="Scan to Find Item"
          onScan={handleScanFind}
          onClose={() => setScanFind(false)}
        />
      )}

      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total SKUs',   val: items.length,                          sub: null,              color: 'var(--blue)' },
            { label: 'Low Stock',    val: lowCount,                              sub: `${outCount} out`, color: 'var(--yellow)' },
            { label: 'Stock (Cost)', val: `Rs. ${costValue.toLocaleString()}`,   sub: null,              color: 'var(--accent)' },
            { label: 'Stock (Sell)', val: `Rs. ${sellValue.toLocaleString()}`,   sub: null,              color: '#a855f7' },
          ].map(({ label, val, sub, color }) => (
            <div key={label} className="stat-card">
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: color }} />
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>{label}</p>
              <p className="text-xl font-extrabold leading-tight" style={{ color: 'var(--text)' }}>{val}</p>
              {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</p>}
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm && !editItem && (
          <div className="card">
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>New Item</h3>
            <ItemForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}


        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
            <input className="flex-1 outline-none text-sm bg-transparent"
              style={{ color: 'var(--text)', fontFamily: 'inherit' }}
              placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: 'var(--text3)' }} /></button>}
          </div>
          <select className="input" style={{ width: 140 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Items</option>
            <option value="low">Low Stock</option>
            <option value="ok">In Stock</option>
          </select>
          <button className="btn-secondary flex items-center gap-1.5"
            onClick={() => setShowHistory(true)}>
            <History size={14} /> Stock History
          </button>
          <button className="btn-secondary flex items-center gap-1.5"
            onClick={() => setShowReceive(true)}>
            <PackageCheck size={14} /> Receive Stock
          </button>
          <button className="btn-secondary flex items-center gap-1.5"
            onClick={() => setShowBulkUpload(true)}>
            <Upload size={14} /> Bulk Upload
          </button>
          <button className="btn-secondary flex items-center gap-1.5"
            onClick={() => setScanFind(true)}>
            <ScanLine size={14} /> Scan to Find
          </button>
          <button className="btn-primary" onClick={() => { setShowForm(f => !f); setEditItem(null) }}>
            <Plus size={15} /> Add Item
          </button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              {search ? 'No items match your search.' : 'No items yet. Add your first item.'}
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Item</th><th>Unit</th><th>Cost</th><th>Sell Price</th>
                    <th>Margin</th><th>Stock</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const margin     = item.sellingPrice > 0
                      ? Math.round(((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100) : 0
                    const isEditing  = editItem?.id === item.id
                    const reorder    = reorders[item.id]

                    if (isEditing) return (
                      <tr key={item.id}>
                        <td colSpan={8} className="p-4" style={{ background: 'var(--surface2)' }}>
                          <p className="text-xs font-bold mb-3" style={{ color: 'var(--text3)' }}>Editing: {item.name}</p>
                          <ItemForm
                            initial={{ name: item.name, unit: item.unit, costPrice: item.costPrice, sellingPrice: item.sellingPrice, quantity: item.quantity, lowStockThreshold: item.lowStockThreshold }}
                            initialBarcode={reverseFind(item.id)}
                            onSave={(form, bc) => handleUpdate(item.id, form, bc)}
                            onCancel={() => setEditItem(null)}
                          />
                        </td>
                      </tr>
                    )

                    const marginColor = margin >= 25 ? 'var(--accent)' : margin >= 12 ? 'var(--yellow)' : 'var(--red)'
                    const stockColor  = item.quantity === 0 ? 'var(--red)' : item.isLowStock ? 'var(--orange)' : 'var(--text)'

                    const isHighlighted = highlightId === item.id
                    return (
                      <tr key={item.id} id={`inv-row-${item.id}`}
                        style={isHighlighted ? { background: 'rgba(0,212,170,0.12)', outline: '2px solid var(--accent)', transition: 'all 0.3s' } : undefined}>
                        <td>
                          <div className="flex items-center gap-2">
                            {item.isLowStock && <AlertTriangle size={13} style={{ color: 'var(--orange)', flexShrink: 0 }} />}
                            <span className="font-semibold" style={{ color: 'var(--text)' }}>{item.name}</span>
                            {reverseFind(item.id) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" title={`Barcode: ${reverseFind(item.id)}`}
                                style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.2)' }}>
                                📷
                              </span>
                            )}
                          </div>
                        </td>
                        <td><span className="badge-gray">{item.unit}</span></td>
                        <td style={{ color: 'var(--text2)' }}>Rs. {item.costPrice}</td>
                        <td className="font-semibold" style={{ color: 'var(--text)' }}>Rs. {item.sellingPrice}</td>
                        <td>
                          <span className="text-xs font-bold" style={{ color: marginColor }}>{margin}%</span>
                        </td>
                        <td>
                          <span className="font-bold" style={{ color: stockColor }}>{item.quantity}</span>
                        </td>
                        <td>
                          {item.quantity === 0
                            ? <span className="badge-red">Out of Stock</span>
                            : reorder
                            ? <span className="badge-blue" style={{ fontSize: 10 }}>Reorder Pending</span>
                            : item.isLowStock
                            ? <span className="badge-yellow">Low Stock</span>
                            : <span className="badge-green">OK</span>
                          }
                        </td>
                        <td>
                          <div className="flex gap-1 justify-end">
                            {(item.isLowStock || item.quantity === 0) && (
                              <button
                                onClick={() => setReorderItem(item)}
                                title="Reorder via WhatsApp"
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: 'var(--orange)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,53,0.1)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                                <RefreshCw size={13} />
                              </button>
                            )}
                            {reorder && (
                              <button
                                onClick={() => { clearReorder(item.id); refreshReorders(); toast.success('Reorder cleared') }}
                                title="Clear pending reorder"
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: 'var(--text3)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = '' }}>
                                <X size={13} />
                              </button>
                            )}
                            <button onClick={() => { setEditItem(item); setShowForm(false) }}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--text3)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text3)' }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--text3)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.1)'; e.currentTarget.style.color = 'var(--red)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text3)' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>{filtered.length} of {items.length} items</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
