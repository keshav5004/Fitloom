"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated } from "@/utils/auth";
import { toast } from "react-toastify";
import Image from "next/image";

export default function AccountsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
    addressType: "home"
  });

  // Prevent overlapping fetches and avoid setState on unmounted component
  const isFetching = useRef(false);
  const isMounted = useRef(true);
  const loadingWatchdogId = useRef(null);

  useEffect(() => {
    // Initial load: allow hydration first, let loader handle token/401
    loadUserData();

    // Refetch on window focus and when token changes in another tab
    const handleFocus = () => {
      if (isAuthenticated()) loadUserData();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isAuthenticated()) {
        loadUserData();
      }
    };
    const handleStorage = (e) => {
      if (e.key === "token") {
        if (e.newValue) {
          loadUserData();
        } else {
          // Token removed → redirect to login
          router.push("/login");
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("storage", handleStorage);

    return () => {
      isMounted.current = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
    };
  }, [router]);

  const loadUserData = async () => {
    if (isFetching.current) return;
    const token = getToken();
    if (!token) {
      // No token → send to login but don't hang the loader
      setLoading(false);
      router.push("/login");
      return;
    }
    isFetching.current = true;
    setLoading(true);

    // Start a watchdog to ensure loading can't get stuck due to unforeseen hangs
    if (loadingWatchdogId.current) clearTimeout(loadingWatchdogId.current);
    loadingWatchdogId.current = setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
        toast.error("Request timed out. Please try again.");
        isFetching.current = false;
      }
    }, 12000);
    try {
      const tryFetch = async (url) => {
        // small retry to dodge occasional network/hydration timing hiccups
        for (let attempt = 0; attempt < 2; attempt++) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          let res;
          try {
            res = await fetch(url, {
              cache: "no-store",
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal
            });
          } finally {
            clearTimeout(timeoutId);
          }
          if (res.ok || res.status === 401) return res;
          await new Promise(r => setTimeout(r, 200));
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
          return await fetch(url, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }
      };

      const [ordersRes, addressesRes] = await Promise.all([
        tryFetch("/api/account/orders"),
        tryFetch("/api/account/addresses")
      ]);

      if (ordersRes.status === 401 || addressesRes.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        router.push("/login");
        return;
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      } else {
        let message = "Failed to load orders";
        try {
          const errorData = await ordersRes.json();
          console.error("Orders API error:", errorData);
          message = errorData.message || errorData.error || message;
        } catch {}
        toast.error(message);
      }

      if (addressesRes.ok) {
        const addressesData = await addressesRes.json();
        setAddresses(addressesData.addresses || []);
      } else {
        try {
          const errorData = await addressesRes.json();
          console.error("Addresses API error:", errorData);
        } catch {}
        toast.error("Failed to load addresses");
      }

      // Get user info from localStorage
      const userName = localStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
      setUser({ 
        name: userName,
        email: userEmail,
        id: localStorage.getItem('userId')
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load account data");
    } finally {
      if (loadingWatchdogId.current) {
        clearTimeout(loadingWatchdogId.current);
        loadingWatchdogId.current = null;
      }
      isFetching.current = false;
      if (isMounted.current) setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const token = getToken();
      const response = await fetch(`/api/account/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "cancel" })
      });

      if (response.ok) {
        toast.success("Order cancelled successfully");
        loadUserData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to cancel order");
      }
    } catch (error) {
      toast.error("Failed to cancel order");
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const url = editingAddress 
        ? `/api/account/addresses/${editingAddress._id}`
        : "/api/account/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });

      if (response.ok) {
        toast.success(editingAddress ? "Address updated successfully" : "Address added successfully");
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({
          name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          isDefault: false,
          addressType: "home"
        });
        loadUserData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save address");
      }
    } catch (error) {
      toast.error("Failed to save address");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      email: address.email,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      addressType: address.addressType
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const token = getToken();
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success("Address deleted successfully");
        loadUserData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete address");
      }
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.name}!</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "orders", label: "Orders" },
              { id: "addresses", label: "Addresses" },
              { id: "profile", label: "Profile" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === "overview" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Account Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Delivered</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {orders.filter(order => order.status === 'delivered').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Addresses</p>
                      <p className="text-2xl font-bold text-gray-900">{addresses.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Order History</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div>
                          <p className="font-medium text-base md:text-lg">Order #{order.orderId}</p>
                          <p className="text-xs md:text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-xs md:text-sm text-gray-600">
                            {order.products.length} item(s) - ₹{order.total}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        <div className="mt-2 text-[10px] md:text-xs text-gray-700">
                          <span className="mr-2">Payment:</span>
                          <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-700' : 'text-yellow-700'}`}>
                            {order.paymentStatus?.toUpperCase() || 'PENDING'}
                          </span>
                          {order.paymentId && (
                            <span className="ml-2">
                              • ID: <span className="font-mono break-all">{order.paymentId}</span>
                            </span>
                          )}
                        </div>
                          {['pending', 'confirmed'].includes(order.status) && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="ml-2 text-red-600 hover:text-red-800 text-xs md:text-sm font-medium"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Order Items:</h4>
                        <div className="space-y-2">
                          {order.products.map((product, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center space-x-3">
                                {product.image && (
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-10 h-10 md:w-12 md:h-12 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-xs md:text-sm">{product.name}</p>
                                  <p className="text-[10px] md:text-xs text-gray-600">
                                    {product.size && `Size: ${product.size}`} 
                                    {product.color && ` | Color: ${product.color}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm md:text-base">₹{product.price}</p>
                                <p className="text-[10px] md:text-xs text-gray-600">Qty: {product.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Shipping Address:</h4>
                          <p className="text-sm text-gray-600">
                            {order.shippingAddress.name}<br/>
                            {order.shippingAddress.address}<br/>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br/>
                            {order.shippingAddress.country}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Addresses</h2>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressForm({
                      name: "",
                      email: "",
                      phone: "",
                      address: "",
                      city: "",
                      state: "",
                      postalCode: "",
                      country: "India",
                      isDefault: false,
                      addressType: "home"
                    });
                    setShowAddressForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses saved</h3>
                  <p className="mt-1 text-sm text-gray-500">Add an address to make checkout faster.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div key={address._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {address.isDefault && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mb-2">
                              Default
                            </span>
                          )}
                          <p className="font-medium">{address.name}</p>
                          <p className="text-sm text-gray-600">{address.address}</p>
                          <p className="text-sm text-gray-600">{address.city}, {address.state} {address.postalCode}</p>
                          <p className="text-sm text-gray-600">{address.country}</p>
                          <p className="text-sm text-gray-600">{address.phone}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address._id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
              <div className="max-w-md">
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user?.name || 'User'}</h3>
                      <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={user?.name || ""}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || "user@example.com"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                    <input
                      type="text"
                      value={user?.id || "N/A"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Account Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Total Orders:</span>
                      <span className="ml-2 font-semibold">{orders.length}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Saved Addresses:</span>
                      <span className="ml-2 font-semibold">{addresses.length}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      router.push('/login');
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Address Form Modal */}
        {showAddressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </h3>
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={addressForm.email}
                      onChange={(e) => setAddressForm({...addressForm, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      required
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        required
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        required
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                      Set as default address
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingAddress ? "Update Address" : "Add Address"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}