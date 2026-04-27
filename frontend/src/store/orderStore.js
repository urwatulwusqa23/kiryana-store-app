export const RIDERS = [
  { id: 'asif',   name: 'Asif Khan',   area: 'Model Town'  },
  { id: 'bilal',  name: 'Bilal Ahmed', area: 'Johar Town'  },
  { id: 'kamran', name: 'Kamran Ali',  area: 'DHA Phase 5' },
]

export const STEPS = [
  { key: 'pending',    icon: '📋', label: 'Order Placed',   desc: 'Waiting for store to confirm'      },
  { key: 'confirmed',  icon: '✅', label: 'Confirmed',      desc: 'Store confirmed — rider assigned'   },
  { key: 'picked_up',  icon: '📦', label: 'Picked Up',      desc: 'Rider collected your order'         },
  { key: 'on_the_way', icon: '🛵', label: 'On the Way',     desc: 'Rider is heading to you'            },
  { key: 'delivered',  icon: '🏠', label: 'Delivered',      desc: 'Order delivered successfully!'      },
]

const LS_STATE  = 'k_order_state'
const LS_MINE   = 'k_my_orders'

function loadAll()  { try { return JSON.parse(localStorage.getItem(LS_STATE) || '{}') } catch { return {} } }
function saveAll(d) { localStorage.setItem(LS_STATE, JSON.stringify(d)) }
function emit()     { window.dispatchEvent(new Event('orderStateChanged')) }

export function getOrder(id) {
  return loadAll()[String(id)] || null
}

export function getAllOrders() {
  return loadAll()
}

export function initOrder(saleId, meta = {}) {
  const d = loadAll()
  d[String(saleId)] = {
    status:      'pending',
    riderId:     null,
    riderName:   null,
    address:     meta.address     || '',
    customerName: meta.customerName || '',
    placedAt:    new Date().toISOString(),
    confirmedAt: null,
    pickedAt:    null,
    onWayAt:     null,
    deliveredAt: null,
  }
  saveAll(d); emit()
}

export function confirmOrder(saleId, riderId) {
  const d = loadAll()
  const key = String(saleId)
  if (!d[key]) return
  const rider = RIDERS.find(r => r.id === riderId)
  d[key] = {
    ...d[key],
    status:      'confirmed',
    riderId,
    riderName:   rider?.name || riderId,
    confirmedAt: new Date().toISOString(),
  }
  saveAll(d); emit()
}

export function advanceOrder(saleId) {
  const d = loadAll()
  const key = String(saleId)
  const order = d[key]
  if (!order) return
  const NEXT = { confirmed: 'picked_up', picked_up: 'on_the_way', on_the_way: 'delivered' }
  const TIME = { picked_up: 'pickedAt', on_the_way: 'onWayAt', delivered: 'deliveredAt' }
  const next = NEXT[order.status]
  if (!next) return
  d[key] = { ...order, status: next, [TIME[next]]: new Date().toISOString() }
  saveAll(d); emit()
}

export function getPendingCount() {
  return Object.values(loadAll()).filter(o => o.status === 'pending').length
}

/* ── Customer-side "my orders" list ─────────────────────────── */
export function getMyOrders() {
  try { return JSON.parse(localStorage.getItem(LS_MINE) || '[]') } catch { return [] }
}

export function addMyOrder(sale, address) {
  const arr = getMyOrders()
  // avoid duplicates
  if (arr.some(o => o.sale.id === sale.id)) return
  arr.unshift({ sale, address, placedAt: new Date().toISOString() })
  localStorage.setItem(LS_MINE, JSON.stringify(arr.slice(0, 30)))
}
