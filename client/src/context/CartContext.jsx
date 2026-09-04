import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setCartId } from '../api/client.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ id: null, items: [], subtotal: 0, itemCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getCart();
      if (data.id) setCartId(data.id);
      setCart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (payload) => {
    const data = await api.addToCart(payload);
    if (data.id) setCartId(data.id);
    setCart(data);
    return data;
  };

  const updateQty = async (itemId, qty) => {
    const data = await api.updateCartItem(itemId, qty);
    setCart(data);
    return data;
  };

  const removeItem = async (itemId) => {
    const data = await api.removeCartItem(itemId);
    setCart(data);
    return data;
  };

  const clear = async () => {
    const data = await api.clearCart();
    setCart(data);
    return data;
  };

  const value = useMemo(
    () => ({ cart, loading, error, refresh, addItem, updateQty, removeItem, clear }),
    [cart, loading, error, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
