import { useState, useEffect, useMemo, useCallback } from "react";

export type CartLine = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
};

const CART_KEY = "ranya_cart";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function useCart() {
  const [cart, setCart] = useState<CartLine[]>(loadCart);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const addToCart = useCallback((item: Omit<CartLine, "qty">) => {
    setCart((c) => {
      const existing = c.find((x) => x.id === item.id);
      if (existing) {
        return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...c, { ...item, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((c) => c.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setCart((c) => c.filter((i) => i.id !== id));
      return;
    }
    setCart((c) => c.map((i) => (i.id === id ? { ...i, qty } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return { cart, total, count, addToCart, removeItem, updateQty, clearCart };
}
