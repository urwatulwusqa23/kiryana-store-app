const KEY = 'k_barcodes'

export const getMap    = () => JSON.parse(localStorage.getItem(KEY) || '{}')
const persist = m => localStorage.setItem(KEY, JSON.stringify(m))

export const link = (barcode, itemId) => {
  if (!barcode?.trim()) return
  const m = getMap(); m[barcode.trim()] = Number(itemId); persist(m)
}

export const unlink = barcode => {
  if (!barcode?.trim()) return
  const m = getMap(); delete m[barcode.trim()]; persist(m)
}

export const unlinkItem = itemId => {
  const m = getMap()
  Object.keys(m).forEach(k => { if (m[k] === Number(itemId)) delete m[k] })
  persist(m)
}

export const find = barcode => {
  if (!barcode?.trim()) return null
  return getMap()[barcode.trim()] ?? null
}

export const reverseFind = itemId => {
  const m = getMap()
  return Object.keys(m).find(k => m[k] === Number(itemId)) || ''
}
