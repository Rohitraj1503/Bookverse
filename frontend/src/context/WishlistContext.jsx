import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import wishlistService from '../services/wishlistService';
import bookService from '../services/bookService';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bv_wishlist', JSON.stringify(items));
  }, [items]);

  // Load from backend when user logs in
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      setLoading(true);
      wishlistService
        .getWishlist(user.id)
        .then((data) => {
          if (Array.isArray(data)) {
            // Transform book references
            const books = data.map((item) => bookService.transformBook(item.book)).filter(Boolean);
            setItems(books);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch wishlist from server:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isLoggedIn, user?.id]);

  const isInWishlist = useCallback(
    (bookId) => {
      const id = parseInt(bookId);
      return items.some((b) => b.id === id);
    },
    [items]
  );

  const addToWishlist = useCallback(
    async (book) => {
      if (!book || !book.id) return;
      const transformed = bookService.transformBook(book);
      if (isInWishlist(transformed.id)) return;

      setItems((prev) => [...prev, transformed]);
      toast.success(`"${transformed.title}" added to wishlist!`);

      if (isLoggedIn && user?.id) {
        try {
          await wishlistService.addToWishlist(user.id, transformed.id);
        } catch (e) {
          console.warn('Backend wishlist sync error:', e);
        }
      }
    },
    [isInWishlist, isLoggedIn, user?.id, toast]
  );

  const removeFromWishlist = useCallback(
    async (bookId, showToast = true) => {
      const id = parseInt(bookId);
      const book = items.find((b) => b.id === id);
      setItems((prev) => prev.filter((b) => b.id !== id));
      if (showToast && book) {
        toast.info(`"${book.title}" removed from wishlist`);
      }

      if (isLoggedIn && user?.id) {
        try {
          await wishlistService.removeFromWishlist(user.id, id);
        } catch (e) {
          console.warn('Backend wishlist sync error:', e);
        }
      }
    },
    [items, isLoggedIn, user?.id, toast]
  );

  const toggleWishlist = useCallback(
    async (book) => {
      if (!book) return;
      const id = parseInt(book.id);
      if (isInWishlist(id)) {
        await removeFromWishlist(id);
      } else {
        await addToWishlist(book);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems: items,
        wishlistCount: items.length,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
