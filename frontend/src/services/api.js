import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'k_auth_token'

const PROFILE_KEY = 'k_auth_profile'

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: token => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PROFILE_KEY) },
  setProfile: ({ role, storeName, fullName }) =>
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ role, storeName, fullName })),
  getProfile: () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null } },
  getRole: () => auth.getProfile()?.role || null,
}

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = auth.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      auth.clearToken()
      window.dispatchEvent(new Event('k_auth_expired'))
    }
    const msg = err.response?.data?.error || err.response?.data?.title || err.message || 'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }).then(r => r.data),
  registerStore: data => api.post('/auth/register-store', data).then(r => r.data),
}

export const usersApi = {
  getAll: role => api.get('/users', { params: role ? { role } : {} }).then(r => r.data),
  create: data => api.post('/users', data).then(r => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: id => api.delete(`/users/${id}`),
}

export const customerApi = {
  getAll: () => api.get('/customers').then(r => r.data),
  getById: id => api.get(`/customers/${id}`).then(r => r.data),
  create: data => api.post('/customers', data).then(r => r.data),
  update: (id, data) => api.put(`/customers/${id}`, data).then(r => r.data),
  delete: id => api.delete(`/customers/${id}`),
  getTransactions: id => api.get(`/customers/${id}/transactions`).then(r => r.data),
  addTransaction: data => api.post('/customers/transactions', data).then(r => r.data)
}

export const itemApi = {
  getAll: () => api.get('/items').then(r => r.data),
  getById: id => api.get(`/items/${id}`).then(r => r.data),
  getLowStock: () => api.get('/items/low-stock').then(r => r.data),
  create: data => api.post('/items', data).then(r => r.data),
  update: (id, data) => api.put(`/items/${id}`, data).then(r => r.data),
  delete: id => api.delete(`/items/${id}`)
}

export const supplierApi = {
  getAll: () => api.get('/suppliers').then(r => r.data),
  getById: id => api.get(`/suppliers/${id}`).then(r => r.data),
  create: data => api.post('/suppliers', data).then(r => r.data),
  update: (id, data) => api.put(`/suppliers/${id}`, data).then(r => r.data),
  delete: id => api.delete(`/suppliers/${id}`)
}

export const purchaseApi = {
  getAll: () => api.get('/purchases').then(r => r.data),
  getById: id => api.get(`/purchases/${id}`).then(r => r.data),
  getBySupplier: sid => api.get(`/purchases/supplier/${sid}`).then(r => r.data),
  create: data => api.post('/purchases', data).then(r => r.data)
}

export const saleApi = {
  getAll: () => api.get('/sales').then(r => r.data),
  getById: id => api.get(`/sales/${id}`).then(r => r.data),
  getDashboard: () => api.get('/sales/dashboard').then(r => r.data),
  create: data => api.post('/sales', data).then(r => r.data)
}

export const orderApi = {
  getAll: () => api.get('/orders').then(r => r.data),
  getRiders: () => api.get('/orders/riders').then(r => r.data),
  place: data => api.post('/orders', data).then(r => r.data),
  getMine: customerRef => api.get('/orders/mine', { params: { customerRef } }).then(r => r.data),
  confirm: (id, riderId) => api.put(`/orders/${id}/confirm`, { riderId }).then(r => r.data),
  advance: id => api.put(`/orders/${id}/advance`).then(r => r.data),
}

export const expenseApi = {
  getAll: (from, to) => api.get('/expenses', { params: { from, to } }).then(r => r.data),
  create: data => api.post('/expenses', data).then(r => r.data),
  update: (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data),
  delete: id => api.delete(`/expenses/${id}`)
}

export const storeApi = {
  getNearby: (lat, lng) => api.get('/stores/nearby', { params: { lat, lng } }).then(r => r.data),
  getById: id => api.get(`/stores/${id}`).then(r => r.data),
  getItems: id => api.get(`/stores/${id}/items`).then(r => r.data),
}
