"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/context/CartContext";
import { RiAccountCircleFill } from "react-icons/ri";
import { usePathname } from "next/navigation";
import { getToken, removeToken } from "@/utils/auth";


export default function Navbar() {
  const [cartOpen, setCartOpen] = useState(false);
  const { cartItems, changeQuantity, removeFromCart, clearCart } = useCart();
  const [userName, setUserName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
    const token = getToken();
    setUserName(stored || "");
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    removeToken();
    setUserName("");
    setIsLoggedIn(false);
  };

  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <div className="relative">
      <nav className="flex justify-between items-center px-8 py-3 shadow-md bg-white">
        <div className="text-2xl font-bold text-violet-600">
          <Link href="/">Codeswear</Link>
        </div>

        <div className="flex space-x-6 font-medium">
          <Link href="/tshirt" className="hover:text-violet-600">Tshirts</Link>
          <Link href="/hoodies" className="hover:text-violet-600">Hoodies</Link>
          <Link href="/mugs" className="hover:text-violet-600">Mugs</Link>
          <Link href="/stickers" className="hover:text-violet-600">Stickers</Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Text left to account icon */}
          <span className="text-sm text-gray-700">
            {userName ? `Welcome, ${userName}` : "Login"}
          </span>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link href="/accounts" prefetch={true}>
                <RiAccountCircleFill className="text-pink-700 text-3xl" />
              </Link>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login">
              <RiAccountCircleFill className="text-pink-700 text-3xl" />
            </Link>
          )}
          <button
            onClick={() => setCartOpen(true)}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-serif"
          >
            Cart ({cartItems.length})
          </button>
        </div>
      </nav>

      {/* Cart Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform ${cartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="font-bold text-2xl font-serif text-cyan-500">Your Cart</h3>
          <button onClick={() => setCartOpen(false)} className="text-red-500 font-bold p-2 bg-amber-100 rounded-2xl">X</button>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto h-[calc(100%-120px)]">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center">Cart is empty</p>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="flex justify-between items-center border p-2 rounded bg-blue-50">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500">₹{item.price}</p>
                  <div className="flex items-center gap-3 mt-1 font-bold">
                    <button onClick={() => changeQuantity(item.id, -1)} className="px-2 py-1 bg-red-200 rounded">-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => changeQuantity(item.id, 1)} className="px-2 py-1 bg-green-200 rounded">+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 font-bold bg-amber-400 px-2 py-1 rounded-2xl">Delete</button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-2 border-t flex justify-between items-center">
            <button onClick={clearCart} className="bg-red-700 text-white px-2 py-2 rounded hover:bg-red-800">Clear Cart</button>
            <Link href="/checkout">
              <button
                onClick={() => setCartOpen(false)} // optional: close sidebar when navigating
                className="w-full bg-blue-700 text-white py-2 px-2 rounded-lg hover:bg-blue-800 transition"
              >
                Go to Checkout
              </button>
            </Link>
            <p className="font-bold">Total: ₹{total}</p>
          </div>
        )}
      </div>

      {/* Overlay */}
      {cartOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setCartOpen(false)}></div>}
    </div>
  );
}
