"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OrderItem } from '@/lib/menuTypes';

interface CartContextType {
  items: OrderItem[];
  addItem: (item: OrderItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    console.log('CartContext - Component mounting, checking localStorage...');
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      console.log('CartContext - Raw localStorage data:', savedCart);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          console.log('CartContext - Parsed cart from localStorage:', parsedCart);
          setItems(parsedCart);
          console.log('CartContext - Set items to:', parsedCart);
        } catch (error) {
          console.error('CartContext - Error loading cart from localStorage:', error);
        }
      } else {
        console.log('CartContext - No saved cart found in localStorage');
      }
      setIsLoaded(true);
      console.log('CartContext - Set isLoaded to true');
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
      console.log('CartContext - Saved cart to localStorage:', items);
    }
  }, [items, isLoaded]);

  const addItem = (newItem: OrderItem) => {
    console.log('CartContext - Adding item:', newItem);
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === newItem.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        updated[existingIndex].total_price = updated[existingIndex].base_price * updated[existingIndex].quantity;
        console.log('CartContext - Updated existing item:', updated[existingIndex]);
        return updated;
      }
      console.log('CartContext - Adding new item to cart');
      return [...prev, newItem];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems(prev =>
      prev.map(item =>
        item.id === itemId 
          ? { ...item, quantity, total_price: item.base_price * quantity }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isLoaded
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
