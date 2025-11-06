// app/product/[slug]/page.js
"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/context/CartContext";
import { toast } from "react-toastify";
import Image from "next/image";

export default function ProductPage() {
  const { addToCart, clearCart } = useCart();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = params;
  const [product, setProduct] = useState(null);
  const [selectedColorKey, setSelectedColorKey] = useState(""); // lowercase color key
  const [pincode, setPin] = useState("");
  const [service, setservice] = useState("")

  const checkpincode = async () => {
    let pins = await fetch('http://localhost:3000/api/pincode')
    let pinjson = await pins.json();
    if (pinjson.includes(parseInt(pincode))) {
      setservice(true)
      toast.success("Service available at your pincode");
    }
    else {
      setservice(false)
      toast.error("Service not available at your pincode");
    }
  }

  const onchangepin = (e) => {
    setPin(e.target.value)
  }

  // Load product by slug
  useEffect(() => {
    const colorFromUrl = searchParams.get("color") || "";
    const load = async () => {
      const res = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug })
      });
      const data = await res.json();
      if (data?.products?.length) {
        const prod = data.products[0];
        setProduct(prod);
        const colorKeys = [...new Set((prod.variants || []).map(v => (v.color || "").toString().toLowerCase()))];
        const initial = (colorFromUrl || "").toString().toLowerCase();
        setSelectedColorKey(initial && colorKeys.includes(initial) ? initial : (colorKeys[0] || ""));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Build color -> representative variant map (case-insensitive)
  const colorKeyToVariant = useMemo(() => {
    if (!product?.variants) return {};
    return product.variants.reduce((acc, v) => {
      const key = (v.color || "").toString().toLowerCase();
      if (key && !acc[key]) acc[key] = v; // pick the first variant per color
      return acc;
    }, {});
  }, [product]);

  const currentVariant = useMemo(() => {
    if (!product) return null;
    return colorKeyToVariant[selectedColorKey] || product.variants?.[0] || null;
  }, [product, colorKeyToVariant, selectedColorKey]);

  const uniqueColors = useMemo(() => {
    if (!product?.variants) return [];
    // Return array of display labels preserving original casing from first occurrence
    const seen = new Set();
    const list = [];
    for (const v of product.variants) {
      const key = (v.color || "").toString().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({ key, label: v.color });
      }
    }
    return list;
  }, [product]);

  const handleColorClick = (colorKey) => {
    setSelectedColorKey(colorKey);
    const params = new URLSearchParams(window.location.search);
    params.set("color", colorKey);
    router.replace(`/product/${slug}?${params.toString()}`);
  };

  const handleBuyNow = () => {
    if (!product || !currentVariant) return;
    clearCart();
    addToCart({
      id: slug,
      name: product?.title || "Product",
      price: currentVariant?.price ?? 0,
      size: "M",
      color: currentVariant?.color || selectedColorKey
    });
    toast.info("Proceeding to checkout with this item");
    router.push("/checkout");
  };

  return (
    <>
      <section className="text-gray-600 body-font overflow-hidden">
        <div className="container px-4 md:px-10 py-10 mx-auto">
          <div className="lg:w-4/5 mx-auto flex flex-wrap">
            <div className="lg:w-1/2 w-full flex items-center justify-center">
              <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                <Image
                  alt="ecommerce"
                  src={
                    currentVariant?.img ||
                    product?.img ||
                    "https://m.media-amazon.com/images/I/51F1xobGQNL._SX679_.jpg"
                  }
                  fill
                  className="object-cover object-center rounded-md"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  onError={(e) => {
                    e.target.src =
                      "https://m.media-amazon.com/images/I/51F1xobGQNL._SX679_.jpg";
                  }}
                />
              </div>
            </div>

            <div className="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0">
              <h2 className="text-sm title-font text-gray-500 tracking-widest">Fitloom</h2>
              <h1 className="text-gray-900 text-3xl title-font font-medium mb-1">{product?.title || "Product"}</h1>
              <div className="flex mb-4">
                <span className="flex items-center">
                  <svg fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4 text-pink-500" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  <svg fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4 text-pink-500" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  <svg fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4 text-pink-500" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  <svg fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4 text-pink-500" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4 text-pink-500" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  <span className="text-gray-600 ml-3">4 Reviews</span>
                </span>
                <span className="flex ml-3 pl-3 py-2 border-l-2 border-gray-200 space-x-2s">
                  <a className="text-gray-500">
                    <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                    </svg>
                  </a>
                  <a className="text-gray-500">
                    <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                    </svg>
                  </a>
                  <a className="text-gray-500">
                    <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
                    </svg>
                  </a>
                </span>
              </div>
              <p className="leading-relaxed">{product?.description || ""}</p>
              <div className="flex mt-6 items-center pb-5 border-b-2 border-gray-100 mb-5">
                <div className="flex">
                  <span className="mr-3">Color</span>
                  {uniqueColors.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleColorClick(key)}
                      title={label}
                      className={`border-2 ml-1 rounded-full w-6 h-6 focus:outline-none ${selectedColorKey === key ? "border-pink-500" : "border-gray-300"}`}
                      style={{ backgroundColor: key }}
                    ></button>
                  ))}
                </div>
                <div className="flex ml-6 items-center">
                  <span className="mr-3">Size</span>
                  <div className="relative">
                    <select className="rounded border appearance-none border-gray-300 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 text-base pl-3 pr-10">
                      <option>M</option>
                      <option>L</option>
                      <option>XL</option>
                    </select>
                    <span className="absolute right-0 top-0 h-full w-10 text-center text-gray-600 pointer-events-none flex items-center justify-center">
                      <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6"></path>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex">
                <span className="title-font font-medium text-2xl text-gray-900">₹{currentVariant?.price ?? 0}.00</span>
                {!currentVariant?.availability && (
                  <span className="ml-4 text-red-500 font-semibold">Out of Stock</span>
                )}
                <button
                  onClick={handleBuyNow}
                  className="ml-auto mr-2 text-white bg-blue-600 border-0 py-2 px-4 text-sm md:px-6 md:text-base focus:outline-none hover:bg-blue-700 rounded"
                  disabled={!currentVariant?.availability}
                  style={!currentVariant?.availability ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                >
                  Buy Now
                </button>
                <button
                  onClick={() => addToCart({
                    id: slug,
                    name: product?.title || "Product",
                    price: currentVariant?.price ?? 0,
                    size: "M",
                    color: currentVariant?.color || selectedColorKey
                  })}
                  className="flex ml-auto text-white bg-pink-500 border-0 py-2 px-4 text-sm md:px-6 md:text-base focus:outline-none hover:bg-pink-600 rounded"
                  disabled={!currentVariant?.availability}
                  style={!currentVariant?.availability ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                >
                  Add to Cart
                </button>

                <button className="rounded-full w-10 h-10 bg-gray-200 p-0 border-0 inline-flex items-center justify-center text-gray-500 ml-4">
                  <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
                  </svg>
                </button>
              </div>

            </div>
            <div className=" flex items-center bg-gray-50">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg ml-auto">
                <div className="flex items-center gap-3">
                  <input onChange={onchangepin}
                    type="text"
                    placeholder="Enter Pincode"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  />
                  <button onClick={checkpincode}
                    type="button"
                    className="px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    Check
                  </button>
                </div>
                <div>
                  {(!service && service != null) && <p className="text-red-700 text-sm">service not available</p>}
                  {(service && service != null) && <p className="text-green-700 text-sm">service available</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
    </>
  );
}
