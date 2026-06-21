import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { CartItem, MenuItem } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface CartState {
  cafeSlug: string;
  items: CartItem[];
  tableNumber?: string;
}

interface CartContextValue {
  cart: CartState;
  totalItems: number;
  totalAmount: number;
  addItem: (slug: string, item: MenuItem) => void;
  removeItem: (item_id: number) => void;
  clearCart: () => void;
  getQuantity: (item_id: number) => number;
  setTableNumber: (table: string) => void;
  isShared: boolean;
  deviceLabel: string;
  sessionId: number | null;
}

const CartContext = createContext<CartContextValue | null>(null);

// Helper to get/generate random device label
const getDeviceLabel = (): string => {
  let label = localStorage.getItem('device_label');
  if (!label) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    label = `Phone ${randomLetter}`;
    localStorage.setItem('device_label', label);
  }
  return label;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const deviceLabel = useMemo(() => getDeviceLabel(), []);

  // Parse cafeSlug and table number from the URL path/query
  const { urlCafeSlug, urlTableNumber } = useMemo(() => {
    const match = location.pathname.match(/\/(menu|checkout)\/([^/]+)/);
    const slug = match ? match[2] : '';
    const table = new URLSearchParams(location.search).get('table') || '';
    return { urlCafeSlug: slug, urlTableNumber: table };
  }, [location.pathname, location.search]);

  const isShared = !!(urlCafeSlug && urlTableNumber);

  // States
  const [localItems, setLocalItems] = useState<CartItem[]>([]);
  const [sharedItems, setSharedItems] = useState<CartItem[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [tableNumber, setTableNumberState] = useState<string>(urlTableNumber);

  // Sync tableNumber from URL if it changes
  useEffect(() => {
    if (urlTableNumber) {
      setTableNumberState(urlTableNumber);
    }
  }, [urlTableNumber]);

  // Fetch session items from backend
  const fetchSharedCart = useCallback(async (slug: string, tableNum: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/table-session/${slug}/${tableNum}`);
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session?.id ?? null);
        const mappedItems: CartItem[] = data.items.map((item: any) => ({
          item_id: item.item_id,
          name: item.item_name,
          price: item.item_price,
          quantity: item.quantity,
          is_veg: item.is_veg,
          added_by_device: item.added_by_device
        }));
        setSharedItems(mappedItems);
      }
    } catch (err) {
      console.error('Error fetching shared cart:', err);
    }
  }, []);

  // Polling for shared cart
  useEffect(() => {
    if (!isShared) {
      setSharedItems([]);
      setSessionId(null);
      return;
    }

    // Initial fetch
    fetchSharedCart(urlCafeSlug, urlTableNumber);

    // Start 5-second polling
    const interval = setInterval(() => {
      fetchSharedCart(urlCafeSlug, urlTableNumber);
    }, 5000);

    return () => clearInterval(interval);
  }, [isShared, urlCafeSlug, urlTableNumber, fetchSharedCart]);

  // Shared Cart Mutations
  const addSharedItem = useCallback(async (slug: string, tableNum: string, item: MenuItem) => {
    // Optimistic local update
    setSharedItems(prev => {
      const existing = prev.find(i => i.item_id === item.id);
      if (existing) {
        return prev.map(i => i.item_id === item.id ? { ...i, quantity: i.quantity + 1, added_by_device: deviceLabel } : i);
      }
      return [...prev, {
        item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        is_veg: item.is_veg,
        added_by_device: deviceLabel
      }];
    });

    try {
      const response = await fetch(`${BASE_URL}/api/table-session/${slug}/${tableNum}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          quantity: 1,
          device_label: deviceLabel
        })
      });
      if (response.ok) {
        const data = await response.json();
        const mappedItems: CartItem[] = data.items.map((i: any) => ({
          item_id: i.item_id,
          name: i.item_name,
          price: i.item_price,
          quantity: i.quantity,
          is_veg: i.is_veg,
          added_by_device: i.added_by_device
        }));
        setSharedItems(mappedItems);
      }
    } catch (err) {
      console.error('Error adding item to shared cart:', err);
    }
  }, [deviceLabel]);

  const removeSharedItem = useCallback(async (slug: string, tableNum: string, itemId: number) => {
    // Optimistic local update
    setSharedItems(prev => {
      return prev.map(i => i.item_id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
                 .filter(i => i.quantity > 0);
    });

    try {
      const response = await fetch(`${BASE_URL}/api/table-session/${slug}/${tableNum}/items/${itemId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const data = await response.json();
        const mappedItems: CartItem[] = data.items.map((i: any) => ({
          item_id: i.item_id,
          name: i.item_name,
          price: i.item_price,
          quantity: i.quantity,
          is_veg: i.is_veg,
          added_by_device: i.added_by_device
        }));
        setSharedItems(mappedItems);
      }
    } catch (err) {
      console.error('Error removing item from shared cart:', err);
    }
  }, []);

  // Public Actions
  const addItem = useCallback((_slug: string, item: MenuItem) => {
    if (isShared) {
      addSharedItem(urlCafeSlug, urlTableNumber, item);
    } else {
      setLocalItems(prev => {
        const existing = prev.find(i => i.item_id === item.id);
        if (existing) {
          return prev.map(i => i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, {
          item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          is_veg: item.is_veg
        }];
      });
    }
  }, [isShared, urlCafeSlug, urlTableNumber, addSharedItem]);

  const removeItem = useCallback((item_id: number) => {
    if (isShared) {
      removeSharedItem(urlCafeSlug, urlTableNumber, item_id);
    } else {
      setLocalItems(prev => {
        return prev.map(i => i.item_id === item_id ? { ...i, quantity: i.quantity - 1 } : i)
                   .filter(i => i.quantity > 0);
      });
    }
  }, [isShared, urlCafeSlug, urlTableNumber, removeSharedItem]);

  const clearCart = useCallback(() => {
    if (isShared) {
      setSharedItems([]);
    } else {
      setLocalItems([]);
    }
  }, [isShared]);

  const setTableNumber = useCallback((table: string) => {
    setTableNumberState(table);
  }, []);

  const items = isShared ? sharedItems : localItems;
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const getQuantity = useCallback(
    (item_id: number) => items.find(i => i.item_id === item_id)?.quantity ?? 0,
    [items]
  );

  const cart = useMemo(() => ({
    cafeSlug: urlCafeSlug,
    items,
    tableNumber
  }), [urlCafeSlug, items, tableNumber]);

  return (
    <CartContext.Provider value={{
      cart,
      totalItems,
      totalAmount,
      addItem,
      removeItem,
      clearCart,
      getQuantity,
      setTableNumber,
      isShared,
      deviceLabel,
      sessionId
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
