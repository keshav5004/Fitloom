"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch");

        const normalized = data.products.map(p => ({
          ...p,
          displayImg: p.img || (p.variants && p.variants[0]?.img) || "",
          minPrice:
            p.variants?.reduce((min, v) => Math.min(min, v.price), Infinity) || 0
        }));

        setProducts(normalized);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grid = useMemo(() => products, [products]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-linear-to-br from-blue-50 via-white to-green-50"></div>
      <div className="fixed top-0 right-0 w-96 h-96 bg-linear-to-br from-blue-200/20 to-transparent rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-linear-to-tr from-green-200/20 to-transparent rounded-full blur-3xl"></div>

      <section className="relative z-10 text-gray-600 body-font">
        <div className="container px-5 py-16 mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-600 via-teal-500 to-green-600 bg-clip-text text-transparent mb-2">
                All Products
              </h1>
              <div className="h-1 w-24 bg-linear-to-r from-blue-500 to-green-500 rounded-full"></div>
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group relative overflow-hidden px-6 py-3 rounded-xl bg-linear-to-r from-blue-600 to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                ↑ Back to Top
              </span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Products */}
          <div className="flex flex-wrap -m-4">
            {loading && (
              <div className="w-full flex justify-center py-20">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}

            {!loading &&
              grid.map((product, index) => (
                <div key={product.slug} className="lg:w-1/4 md:w-1/2 w-1/2 p-4">
                  <Link href={`/product/${product.slug}`}>
                    <div className="group relative h-full cursor-pointer">
                      {/* Glow */}
                      <div className="absolute inset-0 bg-linear-to-br from-blue-400/20 to-green-400/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>

                      {/* Card */}
                      <div className="relative h-full bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-200/30 transition-all duration-300 transform group-hover:-translate-y-2">
                        {/* Image */}
                        <div className="relative h-64 overflow-hidden bg-linear-to-br from-gray-50 to-gray-100">
                          <img
                            src={product.displayImg || product.img}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null; // Prevents infinite loop
                              e.target.src = "/no-image.png";
                            }}
                          />

                          {/* Badges */}
                          {product.variants &&
                            product.variants.every(v => v.availability === false) && (
                              <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                                Out of Stock
                              </span>
                            )}

                          {index < 3 && (
                            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-linear-to-r from-blue-600 to-green-600 text-white text-xs font-bold">
                              New
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-teal-600 text-xs tracking-widest font-semibold mb-2 uppercase">
                            {product.category}
                          </h3>

                          <h2 className="text-gray-900 text-lg font-bold mb-3 group-hover:text-blue-600 transition-colors">
                            {product.title}
                          </h2>

                          <div className="flex items-center justify-between mb-4">
                            <p className="text-2xl font-bold bg-linear-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                              ₹{product.minPrice}
                            </p>
                          </div>

                          {/* Colors */}
                          <div className="flex gap-1">
                            {[...new Set((product.variants || []).map(v => v.color))]
                              .slice(0, 5)
                              .map(color => (
                                <span
                                  key={color}
                                  className="w-5 h-5 rounded-full border border-gray-300"
                                  style={{ backgroundColor: color?.toLowerCase() }}
                                />
                              ))}
                          </div>
                        </div>

                        {/* Accent */}
                        <div className="h-1 bg-linear-to-r from-blue-500 to-green-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Products;
