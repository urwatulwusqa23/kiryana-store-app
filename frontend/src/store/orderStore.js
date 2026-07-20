import { orderApi } from '../services/api'

export const STEPS = [
  { key: 'pending',    icon: '📋', label: 'Order Placed',   desc: 'Waiting for store to confirm'      },
  { key: 'confirmed',  icon: '✅', label: 'Confirmed',      desc: 'Store confirmed — rider assigned'   },
  { key: 'picked_up',  icon: '📦', label: 'Picked Up',      desc: 'Rider collected your order'         },
  { key: 'on_the_way', icon: '🛵', label: 'On the Way',     desc: 'Rider is heading to you'            },
  { key: 'delivered',  icon: '🏠', label: 'Delivered',      desc: 'Order delivered successfully!'      },
]

const STATUS_MAP = { Pending: 'pending', Confirmed: 'confirmed', PickedUp: 'picked_up', OnTheWay: 'on_the_way', Delivered: 'delivered' }
const CUSTOMER_REF_KEY = 'k_customer_ref'

function emit() { window.dispatchEvent(new Event('orderStateChanged')) }

function toOrderState(sale) {
  return {
    status:       STATUS_MAP[sale.orderStatus] || 'pending',
    riderId:      sale.riderId,
    riderName:    sale.riderName,
    address:      sale.deliveryAddress || '',
    customerName: sale.customerName || '',
    placedAt:     sale.saleDate,
    confirmedAt:  sale.confirmedAt,
    pickedAt:     sale.pickedUpAt,
    onWayAt:      sale.onTheWayAt,
    deliveredAt:  sale.deliveredAt,
  }
}

// In-memory cache of the last fetched order list, so sync-style getOrder/getAllOrders
// keep working for components that read them outside an async flow.
let cache = []

export async function fetchOrders() {
  cache = await orderApi.getAll()
  return cache
}

export function getOrder(id) {
  const sale = cache.find(s => s.id === Number(id))
  return sale ? toOrderState(sale) : null
}

export function getAllOrders() {
  const map = {}
  cache.forEach(s => { map[String(s.id)] = toOrderState(s) })
  return map
}

export function getPendingCount() {
  return cache.filter(s => s.orderStatus === 'Pending').length
}

export function getSales() {
  return cache
}

export async function confirmOrder(saleId, riderId) {
  await orderApi.confirm(saleId, riderId)
  await fetchOrders()
  emit()
}

export async function advanceOrder(saleId) {
  await orderApi.advance(saleId)
  await fetchOrders()
  emit()
}

export async function getRiders() {
  return orderApi.getRiders()
}

/* ── Customer-side ("my orders") ──────────────────────────────── */
export function getCustomerRef() {
  let ref = localStorage.getItem(CUSTOMER_REF_KEY)
  if (!ref) {
    ref = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2)
    localStorage.setItem(CUSTOMER_REF_KEY, ref)
  }
  return ref
}

export async function placeOrder({ customerName, address, items }) {
  const sale = await orderApi.place({
    customerName,
    deliveryAddress: address,
    customerRef: getCustomerRef(),
    items,
  })
  emit()
  return sale
}

export async function getMyOrders() {
  return orderApi.getMine(getCustomerRef())
}
