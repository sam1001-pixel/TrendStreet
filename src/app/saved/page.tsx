"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight, Share2, Sparkles } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";

export default function SavedPage() {
  const { wishlist, products, addToCart, toggleWishlist } = useStore();

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleShareWishlist = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Sartorial wishlist link copied to your clipboard.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-6 sm:space-y-10">
      <div className="pb-4 sm:pb-6 border-b border-burgundy/15 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Your Private Wishlist
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-espresso">
            Saved Pieces ({savedProducts.length})
          </h1>
        </div>

        {savedProducts.length > 0 && (
          <button
            onClick={handleShareWishlist}
            className="flex items-center space-x-2 text-xs font-semibold text-burgundy border border-burgundy/30 hover:border-burgundy px-4 py-2 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Sartorial Wishlist</span>
          </button>
        )}
      </div>

      {savedProducts.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-burgundy/15 max-w-2xl mx-auto p-8 space-y-6">
          <div className="w-20 h-20 rounded-full bg-ivory-dark flex items-center justify-center text-burgundy/40 mx-auto">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-espresso">
            No Pieces Saved Yet
          </h2>
          <p className="text-xs text-espresso/70 max-w-md mx-auto leading-relaxed">
            Curate your seasonal wardrobe by tapping the heart icon on any oversized hoodie, bootcut selvedge denim, boxy knit, or flight jacket.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 py-3.5 px-8 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-colors shadow-lg"
          >
            <span>Discover The Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6">
          {savedProducts.map((product) => (
            <div key={product.id} data-reveal className="relative group">
              <ProductCard product={product} />

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => addToCart(product, product.sizes[0], product.colors[0]?.name, 1)}
                  className="flex-1 py-2.5 px-3 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="p-2.5 bg-white border border-burgundy/20 hover:border-crimson text-espresso/60 hover:text-crimson rounded-lg transition-colors"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
