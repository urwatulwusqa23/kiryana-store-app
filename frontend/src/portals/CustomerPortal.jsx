import { useEffect, useState } from 'react'
import {
  ShoppingBag, ShoppingCart, Plus, Minus,
  ArrowLeft, Search, Package, MapPin, MessageCircle, X, ChevronRight,
  Navigation, Store as StoreIcon, LocateFixed,
} from 'lucide-react'
import { storeApi } from '../services/api'
import {
  placeOrder, getMyOrders, STEPS,
} from '../store/orderStore'
import toast from 'react-hot-toast'
import GroceryBackdrop from '../components/GroceryBackdrop'
import { categorize } from '../utils/productCategory'

const SELECTED_STORE_KEY = 'k_selected_store'

const STATUS_KEY = { Pending: 'pending', Confirmed: 'confirmed', PickedUp: 'picked_up', OnTheWay: 'on_the_way', Delivered: 'delivered' }
function toOrderState(sale) {
  return {
    status: STATUS_KEY[sale.orderStatus] || 'pending',
    riderName: sale.riderName,
    confirmedAt: sale.confirmedAt, pickedAt: sale.pickedUpAt, onWayAt: sale.onTheWayAt, deliveredAt: sale.deliveredAt,
  }
}

const ORANGE = 'var(--accent)'

const STATUS_META = {
  pending:    { bg: 'rgba(201,154,63,0.12)',  color: 'var(--gold)', label: '⏳ Waiting'     },
  confirmed:  { bg: 'rgba(92,122,138,0.12)', color: 'var(--blue)', label: '✅ Confirmed'   },
  picked_up:  { bg: 'rgba(179,69,46,0.12)', color: 'var(--accent)', label: '📦 Picked Up'  },
  on_the_way: { bg: 'rgba(201,154,63,0.12)', color: 'var(--gold)', label: '🛵 On the Way' },
  delivered:  { bg: 'rgba(179,69,46,0.12)',  color: 'var(--accent)', label: '✓ Delivered'   },
}

/* ─── Shell ──────────────────────────────────────────────────── */
export default function CustomerPortal({ onSwitch }) {
  const [tab, setTab]           = useState('browse')
  const [trackId, setTrackId]   = useState(null) // sale id to track
  const [store, setStore]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(SELECTED_STORE_KEY) || 'null') } catch { return null }
  })

  function goTrack(saleId) { setTrackId(saleId); setTab('track') }

  function selectStore(s) {
    localStorage.setItem(SELECTED_STORE_KEY, JSON.stringify(s))
    setStore(s)
  }

  function changeStore() {
    localStorage.removeItem(SELECTED_STORE_KEY)
    setStore(null)
  }

  if (!store) return <StorePicker onSelect={selectStore} onSwitch={onSwitch} />

  const TABS = [
    { key: 'browse', label: '🛒 Browse Store' },
    { key: 'orders', label: '📦 My Orders'    },
    { key: 'track',  label: '🗺️ Track Order'  },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <GroceryBackdrop variant="subtle" fixed />
      {/* Sticky header */}
      <div className="sticky top-0 z-20"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={changeStore} className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
              style={{ background: `${ORANGE}1a`, border: `1px solid ${ORANGE}30` }}>
              🛒
            </div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>
                {store.name}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--accent)' }} />
                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                  {store.address}{store.distanceKm != null ? ` · ${store.distanceKm.toFixed(1)} km away` : ''} · Change store
                </p>
              </div>
            </div>
          </button>
          <button onClick={onSwitch}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            Switch Portal
          </button>
        </div>
        <div className="max-w-lg mx-auto flex" style={{ borderTop: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 text-xs font-semibold transition-all"
              style={{
                color:        tab === t.key ? ORANGE : 'var(--text3)',
                borderBottom: tab === t.key ? `2px solid ${ORANGE}` : '2px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-28">
        {tab === 'browse' && <BrowseStore store={store} onOrderPlaced={goTrack} />}
        {tab === 'orders' && <MyOrders   onTrack={goTrack} />}
        {tab === 'track'  && <TrackOrder saleId={trackId} />}
      </div>
    </div>
  )
}

/* ─── Store Picker (location → nearby stores) ───────────────────── */
function StorePicker({ onSelect, onSwitch }) {
  const [status, setStatus]   = useState('idle') // idle | locating | done | denied
  const [stores, setStores]   = useState([])
  const [loading, setLoading] = useState(false)

  async function loadStores(lat, lng) {
    setLoading(true)
    try {
      setStores(await storeApi.getNearby(lat, lng))
      setStatus('done')
    } catch (e) {
      toast.error(e.message || 'Could not load stores')
      setStatus('denied')
    } finally {
      setLoading(false)
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { loadStores(); return }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      pos => loadStores(pos.coords.latitude, pos.coords.longitude),
      () => { toast.error('Location permission denied — showing all stores'); loadStores() },
      { timeout: 8000 }
    )
  }

  function browseAll() { loadStores() }

  return (
    <div className="min-h-screen relative flex flex-col items-center p-6" style={{ background: 'var(--bg)' }}>
      <GroceryBackdrop />
      <div className="w-full max-w-sm relative z-10 pt-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `${ORANGE}1a`, border: `1px solid ${ORANGE}30` }}>
            <StoreIcon size={24} style={{ color: ORANGE }} />
          </div>
          <h1 className="serif" style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>Find your kiryana</h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text3)' }}>
            Share your location to see nearby stores and their stock
          </p>
        </div>

        {status === 'idle' && (
          <div className="space-y-3">
            <button onClick={useMyLocation}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: ORANGE, color: '#faf4e6' }}>
              <LocateFixed size={16} /> Use My Location
            </button>
            <button onClick={browseAll}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ color: 'var(--text2)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              Browse All Stores
            </button>
          </div>
        )}

        {status === 'locating' && (
          <div className="flex flex-col items-center py-10 gap-3">
            <Navigation size={22} className="animate-pulse" style={{ color: ORANGE }} />
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Finding stores near you…</p>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border2)', borderTopColor: ORANGE }} />
              </div>
            ) : stores.length === 0 ? (
              <p className="text-center text-sm py-10" style={{ color: 'var(--text3)' }}>No stores found</p>
            ) : stores.map(s => (
              <button key={s.id} onClick={() => onSelect(s)}
                className="w-full card flex items-center gap-3 text-left"
                onMouseEnter={e => e.currentTarget.style.borderColor = `${ORANGE}60`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${ORANGE}1a` }}>
                  <StoreIcon size={18} style={{ color: ORANGE }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{s.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{s.address}</p>
                </div>
                {s.distanceKm != null && (
                  <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ color: ORANGE, background: `${ORANGE}18` }}>
                    {s.distanceKm.toFixed(1)} km
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <button onClick={onSwitch}
          className="w-full text-center text-xs font-semibold mt-6"
          style={{ color: 'var(--text3)' }}>
          Switch Portal
        </button>
      </div>
    </div>
  )
}

/* ─── Browse Store ───────────────────────────────────────────── */
function BrowseStore({ store, onOrderPlaced }) {
  const [items,        setItems]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [cart,         setCart]         = useState({})
  const [customerName, setCustomerName] = useState('')
  const [address,      setAddress]      = useState('')
  const [view,         setView]         = useState('shop')
  const [submitting,   setSubmitting]   = useState(false)

  useEffect(() => {
    storeApi.getItems(store.id)
      .then(d => setItems(d.filter(i => i.quantity > 0)))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [store.id])

  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState(null)

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ item: items.find(i => i.id === Number(id)), qty }))
    .filter(e => e.item)
  const cartCount = cartItems.reduce((s, { qty }) => s + qty, 0)
  const total     = cartItems.reduce((s, { item, qty }) => s + item.sellingPrice * qty, 0)

  function add(item) {
    setCart(c => ({ ...c, [item.id]: Math.min((c[item.id] || 0) + 1, item.quantity) }))
  }
  function dec(id) {
    setCart(c => {
      const n = { ...c }
      if ((n[id] || 0) <= 1) delete n[id]; else n[id]--
      return n
    })
  }

  async function checkout() {
    if (!cartItems.length)   return toast.error('Cart is empty')
    if (!address.trim())     return toast.error('Enter a delivery address')
    setSubmitting(true)
    try {
      const name = customerName.trim() || 'Online Customer'
      const sale = await placeOrder({
        storeId: store.id,
        customerName: name,
        address: address.trim(),
        items: cartItems.map(({ item, qty }) => ({ itemId: item.id, quantity: qty })),
      })
      setCart({}); setView('shop')
      toast.success('Order placed! Waiting for store confirmation.')
      onOrderPlaced?.(sale.id)
    } catch (e) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: ORANGE }} />
    </div>
  )

  /* ── Cart view ── */
  if (view === 'cart') return (
    <div className="p-4 space-y-4">
      <button onClick={() => setView('shop')}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: 'var(--text3)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
        <ArrowLeft size={16} /> Back to Store
      </button>

      <h2 className="font-extrabold text-lg" style={{ color: 'var(--text)' }}>Your Cart</h2>

      {/* Customer info */}
      <div className="card space-y-3">
        <div>
          <label className="label">Your Name</label>
          <input className="input" value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="e.g. Ali Hassan" />
        </div>
        <div>
          <label className="label">Delivery Address *</label>
          <input className="input" value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Street, area — e.g. House 12, Model Town"
            style={{ borderColor: address ? ORANGE + '60' : undefined }} />
          <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
            Required so the rider knows where to deliver
          </p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart size={36} className="mx-auto mb-3 opacity-20"
            style={{ color: 'var(--text3)' }} />
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Cart is empty</p>
        </div>
      ) : (
        <>
          <div className="card divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {cartItems.map(({ item, qty }) => {
              const { icon: Icon, color, bg } = categorize(item.name)
              return (
                <div key={item.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  style={{ borderColor: 'var(--border)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {item.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>
                      Rs. {item.sellingPrice} / {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => dec(item.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90"
                      style={{ background: `${color}1a`, color }}>
                      <Minus size={11} />
                    </button>
                    <span className="w-6 text-center font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {qty}
                    </span>
                    <button onClick={() => add(item)} disabled={qty >= item.quantity}
                      className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40 transition-transform active:scale-90"
                      style={{ background: `${color}1a`, color }}>
                      <Plus size={11} />
                    </button>
                  </div>
                  <p className="text-sm font-bold w-20 text-right" style={{ color: 'var(--text)' }}>
                    Rs. {(item.sellingPrice * qty).toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm" style={{ color: 'var(--text2)' }}>{cartCount} items</span>
              <span className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>
                Rs. {total.toLocaleString()}
              </span>
            </div>
            <button onClick={checkout} disabled={submitting}
              className="w-full py-3.5 rounded-lg font-bold text-sm text-black disabled:opacity-50"
              style={{ background: ORANGE }}>
              {submitting
                ? 'Placing Order...'
                : `Place Order · Rs. ${total.toLocaleString()}`}
            </button>
          </div>
        </>
      )}
    </div>
  )

  /* ── Shop grid ── */
  const categorized = items.map(i => ({ ...i, cat: categorize(i.name) }))
  const presentCats = [...new Map(categorized.map(i => [i.cat.key, i.cat])).values()]

  const filtered = categorized.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) &&
    (!activeCat || i.cat.key === activeCat)
  )

  return (
    <div className="p-4 space-y-4">
      {/* WhatsApp banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(179,69,46,0.06)', border: '1px solid rgba(179,69,46,0.2)' }}>
        <MessageCircle size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            Need help? WhatsApp us!
          </p>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>{store.phone}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <Search size={15} style={{ color: 'var(--text3)', flexShrink: 0 }} />
        <input className="flex-1 outline-none text-sm bg-transparent"
          style={{ color: 'var(--text)', fontFamily: 'inherit' }}
          placeholder="Search products..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch('')}>
            <X size={13} style={{ color: 'var(--text3)' }} />
          </button>
        )}
      </div>

      {/* Category chips */}
      {presentCats.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveCat(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: !activeCat ? ORANGE : 'var(--surface)',
              color: !activeCat ? '#faf4e6' : 'var(--text2)',
              border: `1px solid ${!activeCat ? ORANGE : 'var(--border)'}`,
            }}>
            🧺 All
          </button>
          {presentCats.map(c => {
            const Icon = c.icon
            const active = activeCat === c.key
            return (
              <button key={c.key} onClick={() => setActiveCat(active ? null : c.key)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
                style={{
                  background: active ? c.color : 'var(--surface)',
                  color: active ? '#fff' : c.color,
                  border: `1px solid ${active ? c.color : c.color + '40'}`,
                }}>
                <Icon size={12} /> {c.key.charAt(0).toUpperCase() + c.key.slice(1)}
              </button>
            )
          })}
        </div>
      )}

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text3)' }}>
          <Package size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(item => {
            const qty = cart[item.id] || 0
            const { icon: Icon, color, bg } = item.cat
            return (
              <div key={item.id} className="rounded-xl p-3 transition-all duration-200"
                style={{
                  background: 'var(--surface)',
                  border: `1.5px solid ${qty > 0 ? color + '70' : 'var(--border)'}`,
                  boxShadow: qty > 0 ? `0 6px 16px ${color}25` : 'var(--shadow)',
                  transform: qty > 0 ? 'translateY(-2px)' : 'none',
                }}>
                <div className="aspect-square rounded-lg mb-2.5 flex items-center justify-center"
                  style={{ background: `linear-gradient(155deg, ${bg}, ${bg}aa)` }}>
                  <Icon size={30} style={{ color }} strokeWidth={1.75} />
                </div>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {item.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                  {item.unit} · {item.quantity} left
                </p>
                <p className="text-base font-extrabold mt-1.5" style={{ color }}>
                  Rs. {item.sellingPrice.toLocaleString()}
                </p>
                <div className="mt-2">
                  {qty === 0 ? (
                    <button onClick={() => add(item)}
                      className="w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-transform active:scale-95"
                      style={{ background: color, color: '#fff' }}>
                      <Plus size={12} /> Add
                    </button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button onClick={() => dec(item.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90"
                        style={{ background: `${color}1a`, color }}>
                        <Minus size={11} />
                      </button>
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{qty}</span>
                      <button onClick={() => add(item)} disabled={qty >= item.quantity}
                        className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40 transition-transform active:scale-90"
                        style={{ background: `${color}1a`, color }}>
                        <Plus size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-30">
          <button onClick={() => setView('cart')}
            className="w-full py-4 rounded-2xl font-bold text-sm text-black shadow-2xl flex items-center justify-between px-5"
            style={{ background: ORANGE, boxShadow: `0 8px 32px ${ORANGE}50` }}>
            <span className="w-6 h-6 rounded-full bg-black text-xs font-bold flex items-center justify-center"
              style={{ color: ORANGE }}>
              {cartCount}
            </span>
            <span>View Cart</span>
            <span>Rs. {total.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── My Orders ──────────────────────────────────────────────── */
function MyOrders({ onTrack }) {
  const [orders,  setOrders]  = useState([])

  async function refresh() {
    try { setOrders(await getMyOrders()) } catch { /* ignore */ }
  }

  useEffect(() => {
    refresh()
    const h = () => refresh()
    window.addEventListener('orderStateChanged', h)
    const iv = setInterval(refresh, 3000)
    return () => { window.removeEventListener('orderStateChanged', h); clearInterval(iv) }
  }, [])

  if (orders.length === 0) return (
    <div className="text-center py-16 px-4">
      <Package size={40} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text3)' }} />
      <p className="font-bold" style={{ color: 'var(--text2)' }}>No orders yet</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
        Browse the store and place your first order!
      </p>
    </div>
  )

  return (
    <div className="p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
        {orders.length} order{orders.length !== 1 ? 's' : ''}
      </p>

      {orders.map(sale => {
        const st     = toOrderState(sale)
        const status = st.status
        const address = sale.deliveryAddress
        const sm     = STATUS_META[status] || STATUS_META.pending

        return (
          <div key={sale.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    Order #{sale.id}
                  </p>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                    style={{ background: sm.bg, color: sm.color }}>
                    {sm.label}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                  {new Date(sale.saleDate).toLocaleDateString('en-PK', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
                {address && (
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text3)' }}>
                    <MapPin size={10} /> {address}
                  </p>
                )}
                {st?.riderName && status !== 'pending' && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>
                    🛵 {st.riderName}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs px-3 py-2 rounded-lg mb-3"
              style={{ color: 'var(--text3)', background: 'var(--surface2)' }}>
              {sale.items?.slice(0, 3).map(i => `${i.itemName} ×${i.quantity}`).join(' · ')}
              {(sale.items?.length || 0) > 3 && ` +${sale.items.length - 3} more`}
            </p>

            <div className="flex items-center justify-between">
              <p className="font-bold text-base" style={{ color: ORANGE }}>
                Rs. {sale.totalRevenue?.toLocaleString()}
              </p>
              <button onClick={() => onTrack(sale.id)}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: ORANGE }}>
                Track Order <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Track Order ────────────────────────────────────────────── */
function TrackOrder({ saleId }) {
  const [sale, setSale] = useState(null)

  useEffect(() => {
    if (!saleId) return

    async function refresh() {
      try {
        const mine = await getMyOrders()
        setSale(mine.find(o => o.id === saleId) || null)
      } catch { /* ignore */ }
    }
    refresh()
    const iv = setInterval(refresh, 3000)
    const h  = () => refresh()
    window.addEventListener('orderStateChanged', h)
    return () => { clearInterval(iv); window.removeEventListener('orderStateChanged', h) }
  }, [saleId])

  if (!saleId || !sale) return (
    <div className="text-center py-16 px-4">
      <MapPin size={40} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text3)' }} />
      <p className="font-bold" style={{ color: 'var(--text2)' }}>No order selected</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
        Go to My Orders and tap "Track Order"
      </p>
    </div>
  )

  const address = sale.deliveryAddress
  const orderState = toOrderState(sale)
  const status = orderState.status
  const currentIdx = STEPS.findIndex(s => s.key === status)
  const sm = STATUS_META[status] || STATUS_META.pending

  return (
    <div className="p-4 space-y-4">

      {/* Order header card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-extrabold text-base" style={{ color: 'var(--text)' }}>
              Order #{sale.id}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
              {sale.customerName}
            </p>
            {address && (
              <p className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text3)' }}>
                <MapPin size={10} /> {address}
              </p>
            )}
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
            style={{ background: sm.bg, color: sm.color }}>
            {sm.label}
          </span>
        </div>

        {/* Rider assigned banner */}
        {orderState?.riderName && status !== 'pending' && (
          <div className="mb-5 px-3 py-2.5 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(179,69,46,0.07)', border: '1px solid rgba(179,69,46,0.2)' }}>
            <span className="text-lg">🛵</span>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                {orderState.riderName} is handling your delivery
              </p>
              {orderState.confirmedAt && (
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
                  Confirmed at{' '}
                  {new Date(orderState.confirmedAt).toLocaleTimeString('en-PK', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 5-step timeline */}
        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const isDone   = i < currentIdx
            const isActive = i === currentIdx
            const isFuture = i > currentIdx

            return (
              <div key={step.key} className="flex gap-4 pb-5 last:pb-0 relative">
                {/* Vertical connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-5 top-10 w-0.5 h-full"
                    style={{
                      background: isDone ? ORANGE + '55' : 'var(--border)',
                      zIndex: 0,
                    }} />
                )}

                {/* Step icon */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 relative"
                  style={{
                    background: isDone
                      ? ORANGE + '18'
                      : isActive
                        ? ORANGE + '22'
                        : 'var(--surface2)',
                    border: isDone
                      ? `2px solid ${ORANGE}55`
                      : isActive
                        ? `2px solid ${ORANGE}`
                        : '2px solid var(--border)',
                    opacity: isFuture ? 0.35 : 1,
                    fontSize: isDone ? 14 : 18,
                  }}>
                  {isDone ? '✓' : step.icon}
                </div>

                {/* Step text */}
                <div className="pt-1.5" style={{ opacity: isFuture ? 0.35 : 1 }}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold"
                      style={{ color: isActive ? ORANGE : 'var(--text)' }}>
                      {step.label}
                    </p>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                        style={{ background: ORANGE }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                    {step.desc}
                  </p>
                  {/* Timestamps */}
                  {isDone && i === 1 && orderState?.confirmedAt && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
                      {new Date(orderState.confirmedAt).toLocaleTimeString('en-PK', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                  {isDone && i === 2 && orderState?.pickedAt && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
                      {new Date(orderState.pickedAt).toLocaleTimeString('en-PK', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                  {isDone && i === 4 && orderState?.deliveredAt && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--accent)' }}>
                      {new Date(orderState.deliveredAt).toLocaleTimeString('en-PK', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Order summary */}
      <div className="card">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--text3)' }}>
          Order Summary
        </p>
        <div className="space-y-2">
          {sale.items?.map(i => (
            <div key={i.itemId} className="flex justify-between text-sm">
              <span style={{ color: 'var(--text2)' }}>{i.itemName} × {i.quantity}</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                Rs. {(i.unitPrice * i.quantity).toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base pt-2"
            style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text)' }}>Total</span>
            <span style={{ color: ORANGE }}>Rs. {sale.totalRevenue?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
