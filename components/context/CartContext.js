"use client";
import { createContext, useContext, useState } from "react";
import { toast } from "react-toastify";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Add product to cart
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const updated = prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
        toast.success("Quantity updated in cart", { toastId: `qty-${product.id}` });
        return updated;
      } else {
        toast.success("Added to cart", { toastId: `add-${product.id}` });
        return [...prev, { ...product, qty: 1 }];
      }
    });
  };

  // Remove product completely
  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Change quantity
  const changeQuantity = (id, delta) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  // Clear all
  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, changeQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
