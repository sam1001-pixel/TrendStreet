"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Heart, Star, ShoppingBag, ArrowRight, Check, Shield, Sparkles } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import { lockScroll } from "@/lib/scroll-lock";

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, toggleWishlist, isInWishlist } = useStore();

  const product = quickViewProduct;

  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes.length === 1 ? product.sizes[0] : "");
  const [sizeError, setSizeError] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(product?.colors[0]?.name || "");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [added, setAdded] = useState(false);

  // Reset state when product changes to prevent stale size/color/image from previous product
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes.length === 1 ? product.sizes[0] : "");
      setSizeError(false);
      setSelectedColor(product.colors[0]?.name || "");
      setActiveImageIndex(0);
      setAdded(false);
    }
  }, [product]);

  // ESC key to close modal & body scroll lock
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setQuickViewProduct(null);
      }
    };
    const unlock = lockScroll();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unlock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [product, setQuickViewProduct]);

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    addToCart(product, selectedSize, selectedColor || product.colors[0]?.name, 1);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setQuickViewProduct(null);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain" role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`}>
      {/* Backdrop */}
      <div
        onClick={() => setQuickViewProduct(null)}
        className="fixed inset-0 bg-espresso/70 backdrop-blur-xs transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative bg-ivory rounded-2xl max-w-4xl w-full max-h-[90dvh] overflow-y-auto shadow-2xl border border-burgundy/20 animate-in zoom-in-95 duration-200">
          {/* Close Button */}
          <button
            onClick={() => setQuickViewProduct(null)}
            className="absolute top-4 right-4 z-30 p-2 text-espresso/70 hover:text-burgundy bg-white/80 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Gallery Column */}
            <div className="p-6 bg-white flex flex-col justify-between border-r border-burgundy/10">
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-ivory-dark">
                <Image
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex items-center space-x-2 mt-4">
                  {product.images.map((img, idx) => (
                    <button
                      key={img}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        activeImageIndex === idx ? "border-burgundy scale-105" : "border-transparent opacity-70"
                      }`}
                    >
                      <Image src={img} alt="thumbnail" width={64} height={80} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-espresso/60 mb-2">
                  <span className="uppercase tracking-widest font-bold text-burgundy">
                    {product.category}
                  </span>
                  {product.reviewsCount > 0 ? (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                      <span className="font-bold text-espresso">{product.rating}</span>
                      <span>({product.reviewsCount} reviews)</span>
                    </div>
                  ) : (
                    <span className="font-bold uppercase tracking-wider text-gold-dark">New drop</span>
                  )}
                </div>

                <h2 className="font-serif text-2xl font-bold text-espresso">{product.name}</h2>
                <p className="text-xs text-espresso/70 italic mt-1">{product.subtitle}</p>

                <div className="mt-4 flex items-baseline space-x-3">
                  <span className="text-2xl font-bold text-burgundy">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-espresso/60 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-espresso/80 mt-4 leading-relaxed line-clamp-3">
                  {product.description}
                </p>

                {/* Fabric highlight */}
                <div className="mt-4 p-3 bg-ivory-dark rounded-lg border border-burgundy/10 text-xs">
                  <span className="font-bold text-burgundy uppercase tracking-wider text-[11px] block">
                    Noble Fabric & Mill
                  </span>
                  <span className="text-espresso/90 font-medium">{product.fabric}</span>
                </div>

                {/* Size Selector */}
                <div className="mt-5">
                  <div className="flex justify-between items-center text-xs font-semibold text-espresso mb-2">
                    <span aria-live="polite" className={sizeError ? "text-crimson" : ""}>
                      {sizeError ? "Choose your size first" : selectedSize ? `Size: ${selectedSize}` : "Select size"}
                    </span>
                    <Link
                      href={`/product/${product.id}`}
                      onClick={() => setQuickViewProduct(null)}
                      className="-my-3 flex min-h-[44px] items-center text-burgundy text-[11px] font-semibold underline"
                    >
                      Size chart &amp; details
                    </Link>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        aria-pressed={selectedSize === size}
                        onClick={() => {
                          setSelectedSize(size);
                          setSizeError(false);
                        }}
                        className={`h-11 text-xs font-bold rounded-lg border transition-all ${sizeError && !selectedSize ? "ring-1 ring-crimson/50 " : ""}${
                          selectedSize === size
                            ? "bg-burgundy text-gold border-burgundy shadow-sm"
                            : "bg-white text-espresso border-burgundy/20 hover:border-burgundy"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div className="mt-5">
                  <span className="text-xs font-semibold text-espresso block mb-2">
                    Color: <span className="font-normal text-burgundy font-medium">{selectedColor}</span>
                  </span>
                  <div className="flex items-center space-x-2.5">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        aria-label={`Colour ${color.name}`}
                        aria-pressed={selectedColor === color.name}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedColor === color.name
                            ? "border-burgundy scale-110 shadow-sm ring-2 ring-burgundy/20"
                            : "border-black/20 opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {selectedColor === color.name && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 pt-4 border-t border-burgundy/15 space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className={`flex-1 min-h-[48px] px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md ${
                      added
                        ? "bg-green-800 text-white"
                        : "bg-burgundy hover:bg-crimson text-gold"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" /> Added to bag
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" /> Add to Bag
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3 rounded border transition-colors ${
                      isFavorited
                        ? "bg-crimson text-ivory border-crimson"
                        : "bg-white text-espresso border-burgundy/20 hover:text-crimson"
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
                  </button>
                </div>

                <Link
                  href={`/product/${product.id}`}
                  onClick={() => setQuickViewProduct(null)}
                  className="w-full py-2 text-center text-xs font-semibold text-burgundy hover:text-crimson flex items-center justify-center gap-1 transition-colors"
                >
                  <span>View Full Product Dossier & 3D Viewer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
