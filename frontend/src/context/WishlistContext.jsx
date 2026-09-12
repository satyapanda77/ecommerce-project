import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { ENDPOINTS } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated, isDeliveryPartner } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated || isDeliveryPartner) return;
    setLoading(true);
    try {
      const [idsRes, itemsRes] = await Promise.all([
        api.get(ENDPOINTS.wishlistIds),
        api.get(ENDPOINTS.wishlist),
      ]);
      setWishlistIds(new Set(idsRes.data));
      setWishlistItems(itemsRes.data || []);
    } catch {
      // Silently fail — wishlist is non-critical
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isDeliveryPartner]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId) => {
    await api.post(ENDPOINTS.wishlist, { product_id: productId });
    setWishlistIds((prev) => new Set([...prev, productId]));
    await fetchWishlist();
  };

  const removeFromWishlist = async (productId) => {
    await api.delete(ENDPOINTS.wishlistRemove(productId));
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    setWishlistItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const isWishlisted = (productId) => wishlistIds.has(productId);

  const toggleWishlist = async (productId) => {
    if (isWishlisted(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistItems,
        loading,
        isWishlisted,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
