import { useEffect, useMemo, useReducer } from 'react'
import { CART_KEY, CartContext } from './cart'

const initialState = {
  table: null,
  items: [],
  taxPercent: 10,
  servicePercent: 5,
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)

    if (!raw) return initialState

    const parsed = JSON.parse(raw)

    if (!parsed || !Array.isArray(parsed.items)) return initialState

    return {
      ...initialState,
      ...parsed,
      items: parsed.items.filter((item) => item?.menu?.id && item.quantity > 0),
    }
  } catch {
    return initialState
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TABLE': {
      if (state.table?.id && state.table.id !== action.table.id) {
        return { ...state, table: action.table, items: [] }
      }

      return { ...state, table: action.table }
    }
    case 'SET_RATES':
      return {
        ...state,
        taxPercent: action.taxPercent ?? state.taxPercent,
        servicePercent: action.servicePercent ?? state.servicePercent,
      }
    case 'ADD': {
      const existing = state.items.find((item) => item.menu.id === action.menu.id)

      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.menu.id === action.menu.id
              ? { ...item, quantity: Math.min(item.quantity + (action.quantity || 1), 20) }
              : item,
          ),
        }
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            menu: action.menu,
            quantity: Math.min(action.quantity || 1, 20),
            notes: action.notes || '',
          },
        ],
      }
    }
    case 'SET_QUANTITY': {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((item) => item.menu.id !== action.menuId) }
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.menu.id === action.menuId
            ? { ...item, quantity: Math.min(action.quantity, 20) }
            : item,
        ),
      }
    }
    case 'SET_NOTES':
      return {
        ...state,
        items: state.items.map((item) =>
          item.menu.id === action.menuId ? { ...item, notes: action.notes } : item,
        ),
      }
    case 'REMOVE':
      return { ...state, items: state.items.filter((item) => item.menu.id !== action.menuId) }
    case 'CLEAR_ITEMS':
      return { ...state, items: [] }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state))
    } catch {
      // localStorage bisa penuh / diblokir; keranjang tetap berjalan di memori.
    }
  }, [state])

  const totals = useMemo(() => {
    const subtotal = state.items.reduce(
      (sum, item) => sum + item.menu.price * item.quantity,
      0,
    )
    const tax = Math.round((subtotal * state.taxPercent) / 100)
    const service = Math.round((subtotal * state.servicePercent) / 100)

    return {
      subtotal,
      tax,
      service,
      total: subtotal + tax + service,
      itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
    }
  }, [state.items, state.taxPercent, state.servicePercent])

  const value = useMemo(
    () => ({
      ...state,
      ...totals,
      setTable: (table) => dispatch({ type: 'SET_TABLE', table }),
      setRates: (taxPercent, servicePercent) =>
        dispatch({ type: 'SET_RATES', taxPercent, servicePercent }),
      addItem: (menu, quantity = 1, notes = '') =>
        dispatch({ type: 'ADD', menu, quantity, notes }),
      setQuantity: (menuId, quantity) =>
        dispatch({ type: 'SET_QUANTITY', menuId, quantity }),
      setNotes: (menuId, notes) => dispatch({ type: 'SET_NOTES', menuId, notes }),
      removeItem: (menuId) => dispatch({ type: 'REMOVE', menuId }),
      clearItems: () => dispatch({ type: 'CLEAR_ITEMS' }),
      resetCart: () => dispatch({ type: 'RESET' }),
    }),
    [state, totals],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
