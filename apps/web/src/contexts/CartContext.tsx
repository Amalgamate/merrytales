import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface CartItem { productId: string; name: string; price: number; quantity: number; image?: string; }
interface CartValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

function restoreCart(): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('merry_tales_cart') ?? '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item): item is CartItem => Boolean(item && typeof item.productId === 'string' && typeof item.name === 'string' && Number.isFinite(item.price) && Number.isFinite(item.quantity) && item.quantity > 0));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(restoreCart);
  useEffect(() => localStorage.setItem('merry_tales_cart', JSON.stringify(items)), [items]);

  const value = useMemo<CartValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    add(item, quantity = 1) {
      const safeQuantity = Math.max(1, Math.floor(quantity));
      setItems((current) => {
        const found = current.find((entry) => entry.productId === item.productId);
        return found
          ? current.map((entry) => entry.productId === item.productId ? { ...entry, quantity: entry.quantity + safeQuantity } : entry)
          : [...current, { ...item, quantity: safeQuantity }];
      });
    },
    update(id, quantity) {
      const safeQuantity = Math.floor(quantity);
      setItems((current) => safeQuantity < 1 ? current.filter((item) => item.productId !== id) : current.map((item) => item.productId === id ? { ...item, quantity: safeQuantity } : item));
    },
    remove(id) { setItems((current) => current.filter((item) => item.productId !== id)); },
    clear() { setItems([]); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
