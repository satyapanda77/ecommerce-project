import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { ENDPOINTS } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(ENDPOINTS.cart);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    await api.post(ENDPOINTS.cart, { product_id: productId, quantity });
    await fetchCart();
  };

  const removeFromCart = async (productId) => {
    await api.delete(ENDPOINTS.cart, { data: { product_id: productId } });
    await fetchCart();
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  const value = { items, loading, itemCount, total, fetchCart, addToCart, removeFromCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
