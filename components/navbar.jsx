"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/context/CartContext";
import { RiAccountCircleFill, RiShoppingCart2Line } from "react-icons/ri";
import { usePathname } from "next/navigation";
import { getToken, removeToken } from "@/utils/auth";


export default function Navbar() {
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-4 sm:px-6 lg:px-8 py-3 shadow-md bg-white w-full overflow-hidden z-50">
        <div className="text-2xl font-bold text-violet-600">
          <Link href="/">Fitloom</Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex space-x-6 font-medium">
          <Link href="/tshirt" className="hover:text-violet-600 bg-[#1aabb8]/70 p-2 rounded-3xl backdrop-blur-md border border-[#1aabb8]/90 shadow-lg">Tshirts</Link>
          <Link href="/hoodies" className="hover:text-violet-600 bg-[#1aabb8]/70 p-2 rounded-3xl backdrop-blur-md border border-[#1aabb8]/90 shadow-lg">Hoodies</Link>
          <Link href="/mugs" className="hover:text-violet-600 bg-[#1aabb8]/70 p-2 rounded-3xl backdrop-blur-md border border-[#1aabb8]/90 shadow-lg">Mugs</Link>
          <Link href="/stickers" className="hover:text-violet-600 bg-[#1aabb8]/70 p-2 rounded-3xl backdrop-blur-md border border-[#1aabb8]/90 shadow-lg">Stickers</Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            aria-label="Open menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>

          {/* Text left to account icon */}
          <span className="text-[11px] sm:text-sm text-gray-700 truncate max-w-22.5 sm:max-w-none">
            {userName ? `Welcome, ${userName}` : "Login"}
          </span>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link href="/accounts" prefetch={true}>
                <RiAccountCircleFill className="text-pink-700 text-3xl" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800"
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
            aria-label="Open cart"
            className="
               relative
               w-11 h-11
               md:w-12 md:h-12
               rounded-full
               bg-linear-to-r from-blue-600 to-green-500
               flex items-center justify-center
               text-white
               shadow-lg
               hover:scale-105
               transition
               shrink-0
                "
           >
            {/* Cart Icon */}
            <RiShoppingCart2Line className="text-lg md:text-xl" />

            {/* Item Count Badge */}
            {cartItems.length > 0 && (
              <span
                className="
                  absolute -top-1 -right-1
                  w-5 h-5
                  rounded-full
                  bg-red-500
                  text-white
                  text-xs
                  font-bold
                  flex items-center justify-center
      "
              >
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="md:hidden absolute left-0 right-0 bg-white shadow border-t z-40">
          <div className="px-4 py-3 flex flex-col space-y-2">
            <Link href="/tshirt" onClick={() => setMobileOpen(false)} className="py-2">Tshirts</Link>
            <Link href="/hoodies" onClick={() => setMobileOpen(false)} className="py-2">Hoodies</Link>
            <Link href="/mugs" onClick={() => setMobileOpen(false)} className="py-2">Mugs</Link>
            <Link href="/stickers" onClick={() => setMobileOpen(false)} className="py-2">Stickers</Link>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-90 bg-white z-50 transform transition-transform duration-300
  ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <div>
            <h3 className="text-2xl font-bold text-cyan-600">Your Cart</h3>
            <p className="text-sm text-gray-400">{cartItems.length} item</p>
          </div>

          <button
            onClick={() => setCartOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-red-300 text-red-500"
          >
            ✕
          </button>
        </div>

        {/* Cart Items */}
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-220px)]">
          {cartItems.length === 0 ? (
            <p className="text-center text-gray-400">Cart is empty</p>
          ) : (
            cartItems.map(item => (
              <div
                key={item.id}
                className="border border-blue-200 rounded-xl p-3 bg-blue-50 shadow-sm"
              >
                <div className="flex gap-3">
                  {/* Product Image */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />

                  {/* Product Info */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {item.name}
                    </h4>

                    <p className="text-blue-600 font-bold">
                      ₹{item.price}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => changeQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold"
                      >
                        −
                      </button>

                      <span className="font-semibold">{item.qty}</span>

                      <button
                        onClick={() => changeQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500"
                  >
                    🗑
                  </button>
                </div>

                {/* Item total */}
                <div className="flex justify-between mt-3 text-sm text-gray-600">
                  <span>Item Total:</span>
                  <span className="font-semibold">
                    ₹{item.price * item.qty}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Section */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t space-y-3">
            {/* Total */}
            <div className="border rounded-xl p-3 flex justify-between items-center">
              <span className="font-semibold text-gray-700">
                Total Amount:
              </span>
              <span className="text-xl font-bold text-blue-600">
                ₹{total}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="w-12 flex items-center justify-center rounded-xl border border-red-300 text-red-500"
              >
                🗑
              </button>

              <Link href="/checkout" className="flex-1">
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-full py-3 rounded-xl text-white font-semibold bg-linear-to-r from-blue-600 to-green-500"
                >
                  Checkout →
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Overlay */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
