import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import bookService from '../services/bookService';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [allBooks, setAllBooks] = useState([]);
  const toast = useToast();

  useEffect(() => {
    localStorage.setItem('bv_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    bookService.getAll().then((data) => setAllBooks(data)).catch(() => {});
  }, []);

  const addToCart = useCallback((bookId, qty = 1, showToastNotification = true) => {
    const id = parseInt(bookId);
    setItems((prev) => {
      const existing = prev.find((item) => item.bookId === id);
      if (existing) {
        return prev.map((item) =>
          item.bookId === id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { bookId: id, qty }];
    });
    if (showToastNotification) {
      toast.success('Added to cart!');
    }
  }, [toast]);

  const updateQty = useCallback((bookId, qty) => {
    const id = parseInt(bookId);
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.bookId === id ? { ...item, qty: Math.max(1, qty) } : item))
    );
  }, []);

  const removeFromCart = useCallback((bookId, showToastNotification = true) => {
    const id = parseInt(bookId);
    setItems((prev) => prev.filter((item) => item.bookId !== id));
    if (showToastNotification) {
      toast.info('Item removed from cart');
    }
  }, [toast]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getDetailedItems = useCallback(() => {
    return items
      .map((item) => {
        const book = allBooks.find((b) => b.id === item.bookId);
        if (!book) return null;
        return {
          ...book,
          qty: item.qty,
          subtotal: book.price * item.qty,
        };
      })
      .filter(Boolean);
  }, [items, allBooks]);

  const getCount = useCallback(() => {
    return items.reduce((sum, item) => sum + (item.qty || 1), 0);
  }, [items]);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => {
      const book = allBooks.find((b) => b.id === item.bookId);
      return sum + (book ? book.price * item.qty : 0);
    }, 0);
  }, [items, allBooks]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        getCount,
        getTotal,
        getDetailedItems,
        allBooks,
        setAllBooks,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
