import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Navigation
  screen: 'benta',
  setScreen: (screen) => set({ screen }),

  // Item catalog
  items: [],
  setItems: (items) => set({ items }),

  // Categories
  categories: [],
  setCategories: (categories) => set({ categories }),

  // Cart: { [cartKey]: qty }
  // cartKey = itemId (no variants) or "itemId_variantIdx" (with variants)
  cart: {},
  addToCart: (cartKey) => {
    const cart = { ...get().cart }
    cart[cartKey] = (cart[cartKey] || 0) + 1
    set({ cart })
  },
  removeFromCart: (cartKey) => {
    const cart = { ...get().cart }
    if (!cart[cartKey]) return
    if (cart[cartKey] <= 1) {
      delete cart[cartKey]
    } else {
      cart[cartKey] -= 1
    }
    set({ cart })
  },
  clearCart: () => set({ cart: {} }),

  // Modals
  checkoutOpen: false,
  setCheckoutOpen: (v) => set({ checkoutOpen: v }),
  gcashOpen: false,
  setGcashOpen: (v) => set({ gcashOpen: v }),
  variantPickerItem: null,
  setVariantPickerItem: (item) => set({ variantPickerItem: item }),

  // GCash QR
  gcashQR: null,
  setGcashQR: (v) => set({ gcashQR: v }),

  // Settings
  lang: localStorage.getItem('lang') || 'fil',
  setLang: (lang) => {
    localStorage.setItem('lang', lang)
    set({ lang })
  },
  businessName: localStorage.getItem('businessName') || '',
  setBusinessName: (name) => {
    localStorage.setItem('businessName', name)
    set({ businessName: name })
  },
}))

// Parse cart key into itemId + optional variantIdx
export function parseCartKey(key) {
  const str = String(key)
  const parts = str.split('_')
  return {
    itemId: Number(parts[0]),
    variantIdx: parts.length > 1 ? Number(parts[1]) : null,
  }
}

// Get price for a cart key
function resolvePrice(item, variantIdx) {
  if (variantIdx !== null && item.variants?.length) {
    return item.variants[variantIdx]?.price ?? 0
  }
  return item.price ?? 0
}

// Total qty for an item across all its variants
export function itemTotalQty(cart, itemId) {
  return Object.entries(cart)
    .filter(([key]) => parseCartKey(key).itemId === itemId)
    .reduce((sum, [, qty]) => sum + qty, 0)
}

export function cartTotal(items, cart) {
  return Object.entries(cart).reduce((sum, [key, qty]) => {
    const { itemId, variantIdx } = parseCartKey(key)
    const item = items.find(i => i.id === itemId)
    if (!item) return sum
    return sum + resolvePrice(item, variantIdx) * qty
  }, 0)
}

export function cartLines(items, cart) {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const { itemId, variantIdx } = parseCartKey(key)
      const item = items.find(i => i.id === itemId)
      if (!item) return null
      const price = resolvePrice(item, variantIdx)
      const variantName = variantIdx !== null ? item.variants?.[variantIdx]?.name ?? null : null
      return {
        ...item,
        cartKey: key,
        qty,
        price,
        subtotal: price * qty,
        variantName,
        displayName: variantName ? `${item.name} (${variantName})` : item.name,
      }
    })
    .filter(Boolean)
}
