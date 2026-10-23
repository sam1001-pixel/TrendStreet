"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Eye, Star } from "lucide-react";
import { Product } from "@/types/store";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useStore();
  const [selectedColor] = useState<string>(product.colors[0]?.name || "Default");
  const [isHovered, setIsHovered] = useState(false);
  const [addedSize, setAddedSize] = useState<string | null>(null);

  const isFavorited = isInWishlist(product.id);

  // Derive genuine heavyweight mill badge
  const getFabricBadge = (prod: Product): string => {
    const text = `${prod.fabric} ${prod.subtitle} ${prod.name}`.toLowerCase();
    if (text.includes("320gsm") || text.includes("320 gsm")) return "320 GSM";
    if (text.includes("520gsm") || text.includes("520 gsm")) return "520 GSM TERRY";
    if (text.includes("15oz") || text.includes("14.5oz") || text.includes("selvedge")) return "15 OZ SELVEDGE";
    if (text.includes("700gsm") || text.includes("700 gsm") || text.includes("melton")) return "700 GSM WOOL";
    if (text.includes("suede")) return "TUSCAN SUEDE";
    if (text.includes("canvas")) return "DUCK CANVAS";
    return "HEAVYWEIGHT";
  };

  const fabricBadge = getFabricBadge(product);

  const handleSizeAdd = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, size, selectedColor, 1);
    setAddedSize(size);
    setTimeout(() => setAddedSize(null), 1800);
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] || product.images[0];

  return (
    <div
      data-reveal
      className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-burgundy/10 shadow-sm hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame (DIV container, NOT <a>) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-ivory-dark block">
        {/* Badges: New / Best Seller / Fabric GSM Spec */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1 pointer-events-none">
          {/* Heavyweight Fabric Pill (Offcult / Off Duty signature) */}
          <span className="bg-espresso/90 backdrop-blur-sm text-gold border border-gold/30 text-[8px] sm:text-[9px] uppercase tracking-widest font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm">
            [ {fabricBadge} ]
          </span>

          {product.isNew && (
            <span className="bg-espresso text-ivory text-[8px] sm:text-[9px] uppercase tracking-widest font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm">
              New Drop
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-burgundy text-gold text-[8px] sm:text-[9px] uppercase tracking-widest font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm">
              Top Rated
            </span>
          )}
          {product.originalPrice && (
            <span className="bg-crimson text-ivory text-[8px] sm:text-[9px] uppercase tracking-widest font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm">
              Save {formatPrice(product.originalPrice - product.price)}
            </span>
          )}
        </div>

        {/* Wishlist Button (Standalone button, valid HTML5 sibling) */}
        <button
          type="button"
          onClick={handleHeartClick}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isFavorited
              ? "bg-crimson text-ivory shadow-md scale-105"
              : "bg-white/85 backdrop-blur-sm text-espresso hover:text-crimson hover:bg-white"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorited ? "fill-current" : ""}`} />
        </button>

        {/* Product Image Link (Wraps only the visual image) */}
        <Link
          href={`/product/${product.id}`}
          className="block w-full h-full cursor-pointer"
          tabIndex={0}
        >
          <Image
            src={isHovered ? secondaryImage : primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105"
            priority={priority}
          />
        </Link>

        {/* Quick View Button (Standalone button, sibling of Link) */}
        <button
          type="button"
          onClick={handleQuickView}
          aria-label="Quick View"
          className="hidden sm:flex absolute right-3 bottom-3 z-20 w-8 h-8 rounded-full bg-espresso/80 hover:bg-espresso text-gold items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 shadow-md"
          title="Quick View Details"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Desktop Quick Size Selector Pill Bar (Hover Overlay, Sibling of Link) */}
        <div className="hidden sm:flex absolute inset-x-2 bottom-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-col items-center gap-1 bg-white/95 backdrop-blur-md p-2 rounded-lg border border-burgundy/15 shadow-lg">
          <span className="text-[9px] font-bold uppercase tracking-wider text-espresso/70">
            {addedSize ? `Added Size ${addedSize} to Bag ✓` : "Quick Add Size to Bag:"}
          </span>
          <div className="flex items-center justify-center gap-1.5 flex-wrap w-full">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => handleSizeAdd(e, s)}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-all ${
                  addedSize === s
                    ? "bg-green-700 text-white scale-105"
                    : "bg-ivory hover:bg-burgundy text-espresso hover:text-gold border border-burgundy/15"
                }`}
              >
                {addedSize === s ? "✓" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-espresso/60 mb-0.5">
            <span className="uppercase tracking-wider font-semibold text-burgundy/90">
              {product.category}
            </span>
            {product.reviewsCount > 0 ? (
              <div className="flex items-center space-x-1">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-gold text-gold" />
                <span className="font-semibold text-espresso">{product.rating}</span>
              </div>
            ) : (
              <span className="font-semibold uppercase tracking-wider text-gold-dark">New drop</span>
            )}
          </div>

          {/* Name & Subtitle */}
          <Link href={`/product/${product.id}`} className="group/title">
            <h3 className="font-serif text-xs sm:text-base font-bold text-espresso group-hover/title:text-crimson transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-[10px] sm:text-xs text-espresso/60 mt-0.5 line-clamp-1 italic">
            {product.subtitle}
          </p>
        </div>

        {/* Pricing, Quick Mobile Size Strip & Color Swatches */}
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-burgundy/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-1.5 sm:space-x-2">
              <span className="text-xs sm:text-base font-bold text-burgundy">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-[10px] sm:text-xs text-espresso/40 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Mini Color Swatches */}
            <div className="flex items-center space-x-1">
              {product.colors.slice(0, 3).map((col) => (
                <span
                  key={col.name}
                  title={col.name}
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-black/20 shadow-sm"
                  style={{ backgroundColor: col.hex }}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-[9px] text-espresso/50 font-medium">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Mobile Quick Size-Pill Strip (1-tap add on mobile) */}
          <div className="sm:hidden flex items-center justify-between gap-1 pt-1 overflow-x-auto no-scrollbar">
            <span className="text-[9px] text-espresso/50 uppercase font-mono font-bold flex-shrink-0">
              {addedSize ? `Added ${addedSize}!` : "Size:"}
            </span>
            <div className="flex items-center gap-1">
              {product.sizes.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => handleSizeAdd(e, s)}
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-all ${
                    addedSize === s
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-ivory border-burgundy/20 text-espresso active:bg-burgundy active:text-gold"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
