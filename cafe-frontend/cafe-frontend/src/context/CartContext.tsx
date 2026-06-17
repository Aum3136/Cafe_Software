import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { CartItem, MenuItem } from '../types';

// ── State & Actions ───────────────────────────────────────────────────────────

interface CartState {
  cafeSlug: string;
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM';    payload: { slug: string; item: MenuItem } }
  | { type: 'REMOVE_ITEM'; payload: { item_id: number } }
  | { type: 'CLEAR_CART' };

const initialState: CartState = { cafeSlug: '', items: [] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { slug, item } = action.payload;

      // If switching cafes, wipe the cart first (can't mix two cafes' orders)
      const base = state.cafeSlug && state.cafeSlug !== slug
        ? { cafeSlug: slug, items: [] }
        : state;

      const existing = base.items.find(i => i.item_id === item.id);
      if (existing) {
        return {
          ...base,
          items: base.items.map(i =>
            i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        cafeSlug: slug,
        items: [...base.items, {
          item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          is_veg: item.is_veg,
        }],
      };
    }

    case 'REMOVE_ITEM': {
      const updated = state.items
        .map(i => i.item_id === action.payload.item_id ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0);
      return { ...state, items: updated };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: CartState;
  totalItems: number;
  totalAmount: number;
  addItem: (slug: string, item: MenuItem) => void;
  removeItem: (item_id: number) => void;
  clearCart: () => void;
  getQuantity: (item_id: number) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  const addItem    = useCallback((slug: string, item: MenuItem) =>
    dispatch({ type: 'ADD_ITEM', payload: { slug, item } }), []);
  const removeItem = useCallback((item_id: number) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { item_id } }), []);
  const clearCart  = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const getQuantity = useCallback(
    (item_id: number) => cart.items.find(i => i.item_id === item_id)?.quantity ?? 0,
    [cart.items]
  );

  const totalItems  = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, totalItems, totalAmount, addItem, removeItem, clearCart, getQuantity }}>
      {children}
    </CartContext.Provider>
  );
}

// Typed hook — throws if used outside CartProvider (better than silently returning null)
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
