import { useEffect, useState } from 'react'
import { Plus, Minus, Trash2, ShoppingCart, CheckCircle, Search, X, ScanLine } from 'lucide-react'
import { itemApi, saleApi } from '../services/api'
import toast from 'react-hot-toast'
import BarcodeScanner from '../components/BarcodeScanner'
import { find as findBarcode } from '../store/barcodeStore'

const fmt = n => `Rs. ${Number(n || 0).toLocaleString()}`

function CartItem({ item, qty, onInc, onDec, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
        <p className="text-xs" style={{ color: 'var(--text3)' }}>Rs. {item.sellingPrice} / {item.unit}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onDec}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface3)', color: 'var(--text2)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--border2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface3)' }}>
          <Minus size={12} />
        </button>
        <span className="w-8 text-center text-sm font-bold" style={{ color: 'var(--text)' }}>{qty}</span>
        <button onClick={onInc} disabled={qty >= item.quantity}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
          style={{ background: 'rgba(0,212,170,0.15)', color: 'var(--accent)' }}
          onMouseEnter={e => { if (qty < item.quantity) e.currentTarget.style.background = 'rgba(0,212,170,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,170,0.15)' }}>
          <Plus size={12} />
        </button>
      </div>
      <div className="w-20 text-right">
        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Rs. {(item.sellingPrice * qty).toLocaleString()}</p>
      </div>
      <button onClick={onRemove} className="transition-colors" style={{ color: 'var(--text3)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)' }}>
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function Billing() {
  const [items, setItems]         = useState([])
  const [cart, setCart]           = useState({})
  const [customerName, setCustomerName] = useState('Walk-in')
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt]     = useState(null)
  const [scanning, setScanning]   = useState(false)

  useEffect(() => {
    itemApi.getAll()
      .then(data => setItems(data.filter(i => i.quantity > 0)))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  function addToCart(item) {
    setCart(c => ({ ...c, [item.id]: Math.min((c[item.id] || 0) + 1, item.quantity) }))
  }
  function incQty(id) {
    const item = items.find(i => i.id === id)
    if (!item) return
    setCart(c => c[id] < item.quantity ? { ...c, [id]: c[id] + 1 } : c)
  }
  function decQty(id) {
    setCart(c => {
      if (c[id] <= 1) { const n = { ...c }; delete n[id]; return n }
      return { ...c, [id]: c[id] - 1 }
    })
  }
  function removeFromCart(id) {
    setCart(c => { const n = { ...c }; delete n[id]; return n })
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    item: items.find(i => i.id === Number(id)), qty
  })).filter(e => e.item)

  const total  = cartItems.reduce((s, { item, qty }) => s + item.sellingPrice * qty, 0)
  const profit = cartItems.reduce((s, { item, qty }) => s + (item.sellingPrice - item.costPrice) * qty, 0)

  async function handleCheckout() {
    if (!cartItems.length) return toast.error('Cart is empty')
    setSubmitting(true)
    try {
      const sale = await saleApi.create({
        customerName: customerName || 'Walk-in',
        items: cartItems.map(({ item, qty }) => ({ itemId: item.id, quantity: qty }))
      })
      setReceipt(sale)
      setCart({})
      const updated = await itemApi.getAll()
      setItems(updated.filter(i => i.quantity > 0))
      toast.success('Sale recorded!')
    } catch (e) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  function handleBarcodeScan(code) {
    const itemId = findBarcode(code)
    if (!itemId) {
      toast.error(`Barcode "${code}" not registered — add it in Inventory first`)
      return
    }
    const item = items.find(i => i.id === itemId)
    if (!item) {
      toast.error('Item not found or out of stock')
      return
    }
    addToCart(item)
    toast.success(`${item.name} added to cart`)
  }

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }} />
    </div>
  )

  if (receipt) return (
    <div className="max-w-sm mx-auto">
      <div className="card text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(0,212,170,0.15)' }}>
          <CheckCircle size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>Sale Complete!</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>Receipt #{receipt.id}</p>
        <div className="mt-4 text-left pt-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          {receipt.items?.map(i => (
            <div key={i.itemId} className="flex justify-between text-sm">
              <span style={{ color: 'var(--text2)' }}>{i.itemName} × {i.quantity}</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>Rs. {(i.unitPrice * i.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex justify-between font-bold text-lg">
            <span style={{ color: 'var(--text)' }}>Total</span>
            <span style={{ color: 'var(--accent)' }}>Rs. {receipt.totalRevenue?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text3)' }}>Profit</span>
            <span style={{ color: 'var(--blue)' }}>Rs. {receipt.profit?.toLocaleString()}</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>
            {receipt.customerName} · {new Date(receipt.saleDate).toLocaleString()}
          </p>
        </div>
        <button className="btn-primary w-full mt-4 justify-center" onClick={() => setReceipt(null)}>
          New Sale
        </button>
      </div>
    </div>
  )

  return (
    <>
      {scanning && (
        <BarcodeScanner
          title="Scan to Add Item"
          onScan={code => { handleBarcodeScan(code); setScanning(false) }}
          onClose={() => setScanning(false)}
        />
      )}
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Products */}
      <div className="lg:col-span-3 space-y-4">
        <div>
          <p className="text-sm mb-2" style={{ color: 'var(--text3)' }}>{items.length} items available</p>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Search size={14} style={{ color: 'var(--text3)' }} />
              <input className="flex-1 outline-none text-sm bg-transparent"
                style={{ color: 'var(--text)', fontFamily: 'inherit' }}
                placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: 'var(--text3)' }} /></button>}
            </div>
            <button
              onClick={() => setScanning(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
              style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.25)' }}
              title="Scan barcode to add item">
              <ScanLine size={15} /> Scan
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(item => {
            const inCart = !!cart[item.id]
            return (
              <button key={item.id} onClick={() => addToCart(item)}
                className="text-left p-3 rounded-xl transition-all"
                style={{
                  background: inCart ? 'rgba(0,212,170,0.06)' : 'var(--surface)',
                  border: `1px solid ${inCart ? 'rgba(0,212,170,0.4)' : 'var(--border)'}`,
                }}
                onMouseEnter={e => { if (!inCart) e.currentTarget.style.borderColor = 'var(--border2)' }}
                onMouseLeave={e => { if (!inCart) e.currentTarget.style.borderColor = 'var(--border)' }}>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{item.quantity} {item.unit} left</p>
                <p className="text-base font-extrabold mt-1.5" style={{ color: 'var(--accent)' }}>Rs. {item.sellingPrice}</p>
                {cart[item.id] && (
                  <span className="badge-green mt-1">{cart[item.id]} in cart</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-2">
        <div className="card sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={18} style={{ color: 'var(--accent)' }} />
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>Cart ({cartItems.length} items)</h3>
          </div>

          <div>
            <label className="label">Customer Name</label>
            <input className="input" value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Walk-in customer" />
          </div>

          <div className="mt-4 min-h-[100px]">
            {cartItems.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text3)' }}>
                Tap items to add to cart
              </p>
            ) : cartItems.map(({ item, qty }) => (
              <CartItem key={item.id} item={item} qty={qty}
                onInc={() => incQty(item.id)}
                onDec={() => decQty(item.id)}
                onRemove={() => removeFromCart(item.id)} />
            ))}
          </div>

          {cartItems.length > 0 && (
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between text-sm" style={{ color: 'var(--text2)' }}>
                <span>Items</span>
                <span>{cartItems.reduce((s, { qty }) => s + qty, 0)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-lg">
                <span style={{ color: 'var(--text)' }}>Total</span>
                <span style={{ color: 'var(--accent)' }}>Rs. {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--text3)' }}>
                <span>Profit</span>
                <span>Rs. {profit.toLocaleString()}</span>
              </div>
              <button className="btn-primary w-full mt-2 justify-center py-3 text-base font-bold"
                onClick={handleCheckout} disabled={submitting}>
                {submitting ? 'Processing...' : `Checkout · ${fmt(total)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
