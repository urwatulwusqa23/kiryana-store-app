import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { supplierApi, purchaseApi, itemApi } from '../services/api'
import toast from 'react-hot-toast'

function SupplierForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', phone: '', company: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name required')
    await onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Supplier Name *</label>
        <input className="input" value={form.name} onChange={set('name')} placeholder="Contact person name" />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" value={form.phone} onChange={set('phone')} placeholder="03XX-XXXXXXX" />
      </div>
      <div>
        <label className="label">Company</label>
        <input className="input" value={form.company} onChange={set('company')} placeholder="Company / Business name" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1">Save</button>
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function PurchaseForm({ supplierId, items, onSave, onCancel }) {
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([{ itemId: '', quantity: '', unitCost: '' }])

  function addLine() { setLines(l => [...l, { itemId: '', quantity: '', unitCost: '' }]) }
  function removeLine(i) { setLines(l => l.filter((_, j) => j !== i)) }
  function setLine(i, k) { return e => setLines(l => l.map((ln, j) => j === i ? { ...ln, [k]: e.target.value } : ln)) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validLines = lines.filter(l => l.itemId && l.quantity && l.unitCost)
    if (!validLines.length) return toast.error('Add at least one item')
    await onSave({
      supplierId, notes,
      items: validLines.map(l => ({ itemId: Number(l.itemId), quantity: Number(l.quantity), unitCost: Number(l.unitCost) }))
    })
  }

  const total = lines.reduce((s, l) => s + (Number(l.quantity) * Number(l.unitCost) || 0), 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-lg mt-3"
      style={{ background: 'rgba(91,138,245,0.06)', border: '1px solid rgba(91,138,245,0.2)' }}>
      <p className="text-sm font-bold" style={{ color: 'var(--blue)' }}>Record Purchase</p>
      {lines.map((line, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 items-end">
          <div>
            <label className="label">Item</label>
            <select className="input" value={line.itemId} onChange={setLine(i, 'itemId')}>
              <option value="">Select</option>
              {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Qty</label>
            <input className="input" type="number" min="1" value={line.quantity} onChange={setLine(i, 'quantity')} />
          </div>
          <div className="flex gap-1">
            <div className="flex-1">
              <label className="label">Cost/unit</label>
              <input className="input" type="number" min="0" value={line.unitCost} onChange={setLine(i, 'unitCost')} />
            </div>
            {i > 0 && (
              <button type="button" onClick={() => removeLine(i)}
                className="btn-danger px-2 py-2 self-end text-xs">×</button>
            )}
          </div>
        </div>
      ))}
      <button type="button" onClick={addLine}
        className="text-sm font-semibold transition-colors"
        style={{ color: 'var(--blue)' }}>
        + Add item
      </button>
      <div>
        <label className="label">Notes</label>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
      </div>
      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
        Total: Rs. {total.toLocaleString()}
      </p>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1">Record Purchase</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export default function Suppliers() {
  const [suppliers, setSuppliers]   = useState([])
  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [purchases, setPurchases]   = useState({})
  const [showPurchaseForm, setShowPurchaseForm] = useState(null)

  async function load() {
    try {
      const [s, i] = await Promise.all([supplierApi.getAll(), itemApi.getAll()])
      setSuppliers(s); setItems(i)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function toggleExpand(id) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!purchases[id]) {
      try {
        const data = await purchaseApi.getBySupplier(id)
        setPurchases(p => ({ ...p, [id]: data }))
      } catch (e) { toast.error(e.message) }
    }
  }

  async function handleCreate(form) {
    try { await supplierApi.create(form); toast.success('Supplier added'); setShowForm(false); load() }
    catch (e) { toast.error(e.message) }
  }
  async function handleUpdate(id, form) {
    try { await supplierApi.update(id, form); toast.success('Updated'); setEditSupplier(null); load() }
    catch (e) { toast.error(e.message) }
  }
  async function handleDelete(id) {
    if (!confirm('Delete this supplier?')) return
    try { await supplierApi.delete(id); toast.success('Deleted'); load() }
    catch (e) { toast.error(e.message) }
  }
  async function handlePurchase(form) {
    try {
      const purchase = await purchaseApi.create(form)
      setPurchases(p => ({ ...p, [form.supplierId]: [...(p[form.supplierId] || []), purchase] }))
      toast.success('Purchase recorded')
      setShowPurchaseForm(null)
      load()
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }} />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text3)' }}>{suppliers.length} suppliers</p>
        <button className="btn-primary" onClick={() => { setShowForm(f => !f); setEditSupplier(null) }}>
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      {showForm && !editSupplier && (
        <div className="card">
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text)' }}>New Supplier</h3>
          <SupplierForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="space-y-3">
        {suppliers.length === 0 ? (
          <div className="card text-center py-10" style={{ color: 'var(--text3)' }}>
            No suppliers yet.
          </div>
        ) : suppliers.map(s => (
          <div key={s.id} className="overflow-hidden rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {editSupplier?.id === s.id ? (
              <div className="p-4">
                <p className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Edit Supplier</p>
                <SupplierForm
                  initial={{ name: s.name, phone: s.phone, company: s.company }}
                  onSave={form => handleUpdate(s.id, form)}
                  onCancel={() => setEditSupplier(null)}
                />
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text)' }}>{s.name}</p>
                    {s.company && <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--blue)' }}>{s.company}</p>}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{s.phone}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditSupplier(s)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text3)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text3)' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text3)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.1)'; e.currentTarget.style.color = 'var(--red)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text3)' }}>
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => toggleExpand(s.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text3)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text3)' }}>
                      {expandedId === s.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                <button onClick={() => setShowPurchaseForm(showPurchaseForm === s.id ? null : s.id)}
                  className="btn-primary text-xs py-1.5 px-3 mt-3">
                  + Record Purchase
                </button>

                {showPurchaseForm === s.id && (
                  <PurchaseForm supplierId={s.id} items={items} onSave={handlePurchase}
                    onCancel={() => setShowPurchaseForm(null)} />
                )}
              </div>
            )}

            {expandedId === s.id && (
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
                  Purchase History
                </p>
                {!purchases[s.id] ? (
                  <p className="text-sm" style={{ color: 'var(--text3)' }}>Loading...</p>
                ) : purchases[s.id].length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text3)' }}>No purchases yet.</p>
                ) : purchases[s.id].map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 text-sm"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ color: 'var(--text)' }}>{p.notes || 'Purchase'}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                        {new Date(p.purchaseDate).toLocaleDateString()} · {p.items?.length || 0} items
                      </p>
                    </div>
                    <p className="font-bold" style={{ color: 'var(--text)' }}>Rs. {p.totalCost.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
