import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.response?.data?.title || err.message || 'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

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
