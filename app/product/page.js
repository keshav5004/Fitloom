"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
          minPrice: p.variants?.reduce((min, v) => Math.min(min, v.price), Infinity) || 0
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
    <div>
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">All Products</h1>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-sm px-4 py-2 rounded bg-pink-500 text-white hover:bg-pink-600"
            >
              Back to top
            </button>
          </div>
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <div className="flex flex-wrap -m-4">
            {loading && <p className="px-4">Loading...</p>}
            {!loading && grid.map(product => (
              <Link
                key={product.slug}
                href={`/product/${product.slug}`}
                className="lg:w-1/4 md:w-1/2 p-4 w-full cursor-pointer shadow-lg"
              >
                <div>
                  <div className="block relative h-48 rounded overflow-hidden">
                    <Image
                      alt={product.title}
                      src={product.displayImg || "https://m.media-amazon.com/images/I/51F1xobGQNL._SX679_.jpg"}
                      className="object-cover object-center w-full h-full block"
                      width={300}
                      height={192}
                      loading="lazy"
                      onError={(e) => {
                        console.error("Image failed to load:", e.target.src);
                        e.target.src = "https://m.media-amazon.com/images/I/51F1xobGQNL._SX679_.jpg";
                      }}
                      onLoad={() => {
                        console.log("Image loaded successfully:", product.title);
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-gray-500 text-xs tracking-widest title-font mb-1">{product.category}</h3>
                    <h2 className="text-gray-900 title-font text-lg font-medium">{product.title}</h2>
                    {product.variants && product.variants.length > 0 && product.variants.every(v => v.availability === false) && (
                      <span className="text-red-500 font-semibold text-sm">Out of Stock</span>
                    )}
                    <p className="mt-1">₹{product.minPrice || 0}.00</p>
                    <div className="flex mt-2">
                      {[...new Set((product.variants || []).map(v => v.color))].slice(0,5).map(color => (
                        <span key={color} className="border-2 border-gray-200 rounded-full w-4 h-4 mr-1" style={{ backgroundColor: (color || '').toLowerCase() }} />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Products;