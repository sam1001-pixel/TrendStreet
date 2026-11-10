"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShoppingBag,
  Check,
  Tag,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import { Product } from "@/types/store";

interface OutfitPiece {
  productId: string;
  defaultSize: string;
  defaultColor: string;
}

interface OutfitLook {
  id: string;
  title: string;
  subtitle: string;
  silhouette: string;
  lookDiscountPercent: number;
  editorialImage: string;
  stylistNote: string;
  pieces: OutfitPiece[];
}

const CURATED_LOOKS: OutfitLook[] = [
  {
    id: "look-shibuya",
    title: "The Shibuya Heavyweight Uniform",
    subtitle: "320gsm Boxy Tee + 14.5oz Carpenter Selvedge Denim",
    silhouette: "Oversized & Relaxed Carpenter",
    lookDiscountPercent: 15,
    editorialImage:
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop",
    stylistNote:
      "Engineered for high-volume drape and generous ankle stacking over chunky sneakers. The 320gsm Mayfair Tee maintains shoulder width while the Okayama carpenter denim stacks effortlessly.",
    pieces: [
      { productId: "ts-001", defaultSize: "L", defaultColor: "Deep Burgundy" },
      { productId: "ts-003", defaultSize: "32W", defaultColor: "Raw Indigo Selvedge" },
      { productId: "ts-006", defaultSize: "L", defaultColor: "Vintage Charcoal" },
    ],
  },
  {
    id: "look-milan",
    title: "The Milan Flight Set",
    subtitle: "520gsm Loopback Hoodie + Tuscan Suede Flight Bomber + Barrel Denim",
    silhouette: "Architectural Layered Brutalism",
    lookDiscountPercent: 15,
    editorialImage:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
    stylistNote:
      "A luxury outerwear statement. The heavy 520gsm loopback hood stands independently beneath the cropped collar of the Tuscan Suede Bomber, anchored by barrel-leg skate denim.",
    pieces: [
      { productId: "ts-002", defaultSize: "L", defaultColor: "Vintage Charcoal" },
      { productId: "ts-004", defaultSize: "32W", defaultColor: "Washed Ash" },
      { productId: "ts-007", defaultSize: "L", defaultColor: "Cognac Brown" },
    ],
  },
];

export const ShopTheFitSection: React.FC = () => {
  const { products, addToCart, applyPromoCode, setIsCartOpen } = useStore();
  const [activeLookId, setActiveLookId] = useState<string>(CURATED_LOOKS[0].id);
  const [isAdded, setIsAdded] = useState(false);

  const activeLook =
    CURATED_LOOKS.find((l) => l.id === activeLookId) || CURATED_LOOKS[0];

  // Resolve products in look
  const resolvedPieces = activeLook.pieces
    .map((piece) => {
      const prod = products.find((p) => p.id === piece.productId);
      return prod ? { ...piece, product: prod } : null;
    })
    .filter((item): item is OutfitPiece & { product: Product } => item !== null);

  // State for user's selected sizes per piece
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
    "ts-001": "L",
    "ts-003": "32W",
    "ts-006": "L",
    "ts-002": "L",
    "ts-004": "32W",
    "ts-007": "L",
  });

  const handleSizeChange = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  // Pricing calculations
  const totalRetailPrice = resolvedPieces.reduce(
    (sum, item) => sum + item.product.price,
    0
  );
  const bundleDiscount = Math.round(
    (totalRetailPrice * activeLook.lookDiscountPercent) / 100
  );
  const finalBundlePrice = totalRetailPrice - bundleDiscount;

  // 1-Tap Add All Pieces to Bag and automatically apply the 15% VIP bundle privilege
  const handleAddBundleToBag = () => {
    resolvedPieces.forEach((item) => {
      const size = selectedSizes[item.product.id] || item.product.sizes[0] || "M";
      const color = item.product.colors[0]?.name || "Default";
      addToCart(item.product, size, color, 1);
    });

    // Automatically apply BUNDLE15 so cart reflects the advertised 15% savings
    void applyPromoCode("BUNDLE15");

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setIsCartOpen(true);
    }, 600);
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 pb-4 border-b border-burgundy/15 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-burgundy/10 text-burgundy text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-crimson" />
            <span>Curated Streetwear Outfits</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-espresso tracking-tight">
            Shop The Complete Fit
          </h2>
          <p className="text-xs sm:text-sm text-espresso/70 mt-1 max-w-xl font-light">
            Take the guesswork out of streetwear proportion. Coordinated heavyweight tops, Japanese selvedge denim, and outerwear engineered to drape together.
          </p>
        </div>

        {/* Look Switcher Pills */}
        <div className="flex items-center bg-ivory-dark p-1 rounded-lg border border-burgundy/15 self-start sm:self-auto overflow-x-auto no-scrollbar">
          {CURATED_LOOKS.map((look) => (
            <button
              key={look.id}
              onClick={() => setActiveLookId(look.id)}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${
                activeLookId === look.id
                  ? "bg-burgundy text-gold shadow-sm"
                  : "text-espresso/70 hover:text-espresso"
              }`}
            >
              {look.title.split(" ")[1] || look.title}
            </button>
          ))}
        </div>
      </div>

      {/* Outfit Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Left Column: Styled Editorial Model Image */}
        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-lg border border-burgundy/20 aspect-[3/4] bg-espresso">
          <img
            src={activeLook.editorialImage}
            alt={activeLook.title}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/30 to-transparent" />

          {/* Badge & Floating Tag */}
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded-full bg-espresso/90 backdrop-blur-sm text-gold font-mono text-[10px] uppercase font-bold tracking-widest border border-gold/30">
              Complete Wardrobe Bundle • Save {activeLook.lookDiscountPercent}%
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10 text-ivory space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold block">
              Stylist Directive
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold">
              {activeLook.title}
            </h3>
            <p className="text-xs text-ivory/80 font-light line-clamp-2">
              {activeLook.stylistNote}
            </p>
          </div>
        </div>

        {/* Right Column: Deconstructed Pieces & Bundle Sizer */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-espresso/70 block">
              Included In This Look ({resolvedPieces.length} Coordinated Pieces)
            </span>

            {resolvedPieces.map(({ product }) => {
              const currentSize =
                selectedSizes[product.id] || product.sizes[0] || "M";

              return (
                <div
                  key={product.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-white border border-burgundy/15 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-20 sm:w-18 sm:h-22 object-cover rounded-lg bg-ivory-dark border border-burgundy/10 flex-shrink-0"
                    />
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-burgundy font-bold block">
                        {product.category} • {product.fabric.split(" ")[0]}
                      </span>
                      <Link
                        href={`/product/${product.id}`}
                        className="font-serif text-sm sm:text-base font-bold text-espresso hover:text-crimson transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <span className="font-bold text-sm text-burgundy block mt-0.5">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>

                  {/* Size Pill Selector for this Item */}
                  <div className="flex flex-col sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-burgundy/10">
                    <span className="text-[10px] text-espresso/60 uppercase font-bold tracking-wider">
                      Select Size:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSizeChange(product.id, s)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-[11px] font-bold font-mono transition-all ${
                            currentSize === s
                              ? "bg-burgundy text-gold shadow-sm ring-1 ring-burgundy"
                              : "bg-ivory text-espresso hover:bg-white border border-burgundy/15"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bundle Pricing Card & 1-Tap CTA */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-burgundy/20 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-burgundy/10">
              <div>
                <span className="text-xs text-espresso/60 block">Individual Retail Total:</span>
                <span className="text-sm font-semibold line-through text-espresso/50">
                  {formatPrice(totalRetailPrice)}
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-crimson block flex items-center sm:justify-end gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>VIP Bundle Privilege (Save {formatPrice(bundleDiscount)}):</span>
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-burgundy">
                  {formatPrice(finalBundlePrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddBundleToBag}
              disabled={isAdded}
              className={`w-full py-4 px-6 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-md ${
                isAdded
                  ? "bg-green-700 text-white"
                  : "bg-burgundy hover:bg-crimson text-gold hover:shadow-xl active:scale-[0.99]"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Entire Fit Added to Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-gold" />
                  <span>Add Complete Fit to Bag • {formatPrice(finalBundlePrice)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-espresso/60 pt-1">
              <span>✦ Individual items can still be exchanged or returned</span>
              <span className="text-green-700 font-bold">Complimentary Express Air Included</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
