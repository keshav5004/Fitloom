"use client"
import React from 'react'
import { useState, useEffect } from 'react';
import { useCart } from '@/components/context/CartContext';
import Link from 'next/link'
import { toast } from 'react-toastify'
import { getToken, isAuthenticated } from '@/utils/auth'
import { useRouter } from 'next/navigation'

function Checkout() {
  const { cartItems, clearCart } = useCart();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Razorpay SDK once
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const existing = document.querySelector('script[data-razorpay-checkout]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.setAttribute('data-razorpay-checkout', 'true');
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadAddresses();
  }, [router]);

  const loadAddresses = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/account/addresses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
        
        // Auto-select default address
        const defaultAddress = data.addresses?.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress._id);
          setFormData({
            name: defaultAddress.name,
            email: defaultAddress.email,
            phone: defaultAddress.phone,
            address: defaultAddress.address,
            city: defaultAddress.city,
            state: defaultAddress.state,
            postalCode: defaultAddress.postalCode,
            country: defaultAddress.country,
          });
        }
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const initiateRazorpayPayment = async () => {
    try {
      setLoading(true);

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error('Failed to load Razorpay SDK');
        return;
      }

      const itemsSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
      const shipping = 50;
      const totalAmount = itemsSubtotal + shipping;
      const amountInPaise = Math.round(totalAmount * 100);

      const productName = cartItems.length === 0
        ? 'Order Payment'
        : cartItems.length === 1
          ? cartItems[0].name
          : `${cartItems[0].name} + ${cartItems.length - 1} more`;

      const token = getToken();
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount: amountInPaise, currency: 'INR', productName })
      });

      if (!orderRes.ok) {
        let message = 'Failed to create payment order';
        try { const err = await orderRes.json(); message = err.message || err.error || message; } catch {}
        toast.error(message);
        return;
      }

      const { orderId, amount, currency } = await orderRes.json();
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error('Missing Razorpay key');
        return;
      }

      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency || 'INR',
        name: 'Codeswear',
        description: productName,
        order_id: orderId,
        prefill: {
          name: formData.name || 'Customer',
          email: formData.email || 'user@example.com',
          contact: formData.phone || ''
        },
        notes: { address: formData.address },
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            if (!verifyRes.ok) {
              let msg = 'Payment verification failed';
              try { const err = await verifyRes.json(); msg = err.message || err.error || msg; } catch {}
              toast.error(msg);
              return;
            }

            // Map cart items to product IDs
            const productIds = await Promise.all(
              cartItems.map(async (item) => {
                try {
                  const resp = await fetch(`/api/fetch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug: item.id })
                  });
                  const data = await resp.json();
                  return data.products?.[0]?._id || null;
                } catch {
                  return null;
                }
              })
            );

            const validItems = cartItems.filter((_, index) => productIds[index] !== null);
            const validProductIds = productIds.filter(id => id !== null);
            if (validItems.length === 0) {
              toast.error('No valid products found');
              return;
            }

            const orderData = {
              products: validItems.map((item, index) => ({
                productId: validProductIds[index],
                name: item.name,
                price: item.price,
                quantity: item.qty,
                size: item.size,
                color: item.color,
                image: item.image
              })),
              shippingAddress: formData,
              billingAddress: formData,
              amount: itemsSubtotal,
              shipping,
              total: totalAmount,
              paymentMethod: 'online',
              paymentStatus: 'paid',
              paymentId: response.razorpay_payment_id,
              paymentGateway: 'razorpay'
            };

            const createOrderRes = await fetch('/api/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(orderData)
            });

            if (!createOrderRes.ok) {
              let message = 'Order creation failed after payment';
              try { const err = await createOrderRes.json(); message = err.message || err.error || message; } catch {}
              toast.error(message);
              return;
            }

            const orderResult = await createOrderRes.json();
            toast.success('Payment successful and order placed!');
            localStorage.setItem('lastOrderId', orderResult.order._id);
            clearCart();
            router.push('/order');
          } catch {
            toast.error('Unexpected error after payment');
          }
        },
        theme: { color: '#0ea5e9' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        toast.error(resp?.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch {
      toast.error('Failed to start payment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address._id);
    setFormData({
      name: address.name,
      email: address.email,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      console.log("Placing order with data:", {
        cartItems: cartItems.length,
        formData,
        token: token ? "Present" : "Missing"
      });
      
      // First, get the actual product IDs from the database
      const productIds = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const response = await fetch(`/api/fetch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug: item.id })
            });
            const data = await response.json();
            return data.products?.[0]?._id || null;
          } catch (error) {
            console.error(`Error fetching product ID for ${item.id}:`, error);
            return null;
          }
        })
      );

      // Filter out any items where we couldn't get the product ID
      const validItems = cartItems.filter((item, index) => productIds[index] !== null);
      const validProductIds = productIds.filter(id => id !== null);

      if (validItems.length === 0) {
        toast.error("No valid products found");
        return;
      }

      // Create order
      const orderData = {
        products: validItems.map((item, index) => ({
          productId: validProductIds[index],
          name: item.name,
          price: item.price,
          quantity: item.qty,
          size: item.size,
          color: item.color,
          image: item.image
        })),
        shippingAddress: formData,
        billingAddress: formData,
        amount: validItems.reduce((acc, item) => acc + item.price * item.qty, 0),
        shipping: 50,
        total: validItems.reduce((acc, item) => acc + item.price * item.qty, 0) + 50,
        paymentMethod: 'cod'
      };

      console.log("Order data:", orderData);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      console.log("Order response status:", response.status);

      if (response.ok) {
        const orderResult = await response.json();
        console.log("Order created:", orderResult);
        console.log("Order result structure:", {
          hasOrder: !!orderResult.order,
          orderKeys: orderResult.order ? Object.keys(orderResult.order) : 'no order',
          orderId: orderResult.order?.orderId,
          _id: orderResult.order?._id
        });
        
        // Save address if not using existing one
        if (!selectedAddress) {
          try {
            await fetch("/api/account/addresses", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                ...formData,
                isDefault: addresses.length === 0
              })
            });
          } catch (addressError) {
            console.error("Address save error:", addressError);
            // Don't fail the order for address save issues
          }
        }

        clearCart();
        toast.success("Order placed successfully!");
        
        // Store order ID in localStorage for the order page
        localStorage.setItem('lastOrderId',orderResult.order._id);
        
        router.push("/order");
      } else {
        const error = await response.json();
        console.error("Order placement error:", error);
        console.error("Response status:", response.status);
        console.error("Response headers:", Object.fromEntries(response.headers.entries()));
        toast.error(error.message || error.error || "Failed to place order");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Billing Details */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Billing Details</h2>

          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Saved Addresses</h3>
              <div className="space-y-2">
                {addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedAddress === address._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAddressSelect(address)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{address.name}</p>
                        <p className="text-sm text-gray-600">{address.address}</p>
                        <p className="text-sm text-gray-600">{address.city}, {address.state} {address.postalCode}</p>
                        {address.isDefault && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Default
                          </span>
                        )}
                      </div>
                      <input
                        type="radio"
                        checked={selectedAddress === address._id}
                        onChange={() => handleAddressSelect(address)}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setSelectedAddress(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Use different address
                </button>
              </div>
            </div>
          )}

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Street Name, Area"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="400001"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="India"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>

          <div className="space-y-4 border-b pb-4">
            {cartItems.length === 0 ? (
              <p className="text-gray-500">Your cart is empty.</p>
            ) : (
              cartItems.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <p>{item.name} × {item.qty}</p>
                  <p>₹{item.price * item.qty}</p>
                </div>
              ))
            )}

            {cartItems.length > 0 && (
              <>
                <div className="flex justify-between font-semibold border-t pt-4">
                  <p>Subtotal</p>
                  <p>₹{cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)}</p>
                </div>

                <div className="flex justify-between">
                  <p>Shipping</p>
                  <p>₹50</p>
                </div>

                <div className="flex justify-between font-bold text-lg border-t pt-4">
                  <p>Total</p>
                  <p>
                    ₹
                    {cartItems.reduce((acc, item) => acc + item.price * item.qty, 0) + 50}
                  </p>
                </div>
              </>
            )}
          </div>


          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>

          <button
            onClick={initiateRazorpayPayment}
            disabled={loading || cartItems.length === 0}
            className="w-full mt-3 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? 'Please wait…' : 'Pay with Razorpay'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout