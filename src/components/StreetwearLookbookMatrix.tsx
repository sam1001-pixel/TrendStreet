"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Plus,
  ShoppingBag,
  Check,
  Camera,
  Layers,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";

interface LookbookItem {
  name: string;
  category: "Oversized" | "Jeans" | "Boxy Fit" | "Jackets";
  price: number;
  productId: string;
  size: string;
  spec: string;
}

interface LookbookEntry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
  quote: string;
  tags: string[];
  items: LookbookItem[];
}

const LOOKBOOK_ENTRIES: LookbookEntry[] = [
  {
    id: "look-shibuya",
    title: "The Shibuya Minimalist",
    subtitle: "Architectural Boxy Drapery × Vintage Okayama Shuttle Denim",
    location: "Shibuya Crossing, Tokyo",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
    quote: "A structured boxy tee falling clean off the collarbone, stacked over raw selvedge with zero drag.",
    tags: ["320 GSM COTTON", "14OZ RAW DENIM", "BOX-CUT"],
    items: [
      {
        name: "The Mayfair Heavyweight Tee",
        category: "Oversized",
        price: 2499,
        productId: "ts-001",
        size: "L",
        spec: "320gsm Combed Cotton",
      },
      {
        name: "The Shibuya Carpenter Selvedge",
        category: "Jeans",
        price: 5499,
        productId: "ts-004",
        size: "32",
        spec: "14oz Okayama Redline Denim",
      },
    ],
  },
  {
    id: "look-milan",
    title: "The Milan Flight Set",
    subtitle: "Heavy Suede Outerwear × Double-Walled 520gsm French Terry",
    location: "Navigli Canal District, Milan",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
    quote: "Heavy Italian suede cut high on the waist, framing a standing double-walled hood that never collapses.",
    tags: ["700 GSM SUEDE", "520 GSM TERRY", "CROPPED"],
    items: [
      {
        name: "The Tuscan Suede Flight Bomber",
        category: "Jackets",
        price: 9999,
        productId: "ts-010",
        size: "L",
        spec: "Hand-Buffed Suede",
      },
      {
        name: "The Tokyo Drop-Shoulder Hoodie",
        category: "Oversized",
        price: 4999,
        productId: "ts-002",
        size: "L",
        spec: "520gsm Loopback Terry",
      },
    ],
  },
  {
    id: "look-bandra",
    title: "The Bandra After-Hours",
    subtitle: "Japanese Brushed Flannel × Okayama Bootcut Flare",
    location: "Pali Hill, Bandra West, Mumbai",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
    quote: "Subtle ankle flare resting naturally over low sneakers, with a brushed hamamatsu cotton flannel unbuttoned.",
    tags: ["280 GSM BRUSHED", "14.5OZ BOOTCUT", "LAYERED"],
    items: [
      {
        name: "The Kyoto Relaxed Oversized Flannel",
        category: "Oversized",
        price: 3999,
        productId: "ts-003",
        size: "M",
        spec: "Japanese Brushed Cotton",
      },
      {
        name: "The Okayama Bootcut Flare Denim",
        category: "Jeans",
        price: 5999,
        productId: "ts-005",
        size: "32",
        spec: "14.5oz Okayama Selvedge",
      },
    ],
  },
];

export const StreetwearLookbookMatrix: React.FC = () => {
  const [activeLookIdx, setActiveLookIdx] = useState(0);
  const [addedLooks, setAddedLooks] = useState<Record<string, boolean>>({});
  const { addToCart, products } = useStore();

  const currentLook = LOOKBOOK_ENTRIES[activeLookIdx];

  const handleAddLook = (look: LookbookEntry) => {
    look.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        addToCart(prod, item.size, prod.colors[0]?.name || "Default", 1);
      }
    });
    setAddedLooks((prev) => ({ ...prev, [look.id]: true }));
    setTimeout(() => {
      setAddedLooks((prev) => ({ ...prev, [look.id]: false }));
    }, 2500);
  };

  const totalPrice = currentLook.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-8 pb-3 border-b border-burgundy/15 gap-2">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-burgundy/10 text-burgundy text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5">
            <Camera className="w-3 h-3 text-crimson" />
            <span>Sartorial Streetwear Lookbook</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-espresso">
            Street Architecture: Tokyo to Bandra
          </h2>
          <p className="text-xs sm:text-sm text-espresso/70 mt-1 max-w-xl font-light">
            Editorial styling captures exploring natural drape, volume ratios, and denim puddle breaks in motion.
          </p>
        </div>

        <Link
          href="/lookbook"
          className="text-xs font-bold uppercase tracking-widest text-burgundy hover:text-crimson flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <span>Full Lookbook Archive</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Lookbook Tabs */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto no-scrollbar pb-1">
        {LOOKBOOK_ENTRIES.map((entry, idx) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setActiveLookIdx(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
              activeLookIdx === idx
                ? "bg-espresso text-gold shadow-md scale-102"
                : "bg-white text-espresso/70 border border-burgundy/15 hover:border-burgundy"
            }`}
          >
            <span>0{idx + 1}. {entry.title}</span>
          </button>
        ))}
      </div>

      {/* Interactive Main Look Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch bg-white rounded-2xl sm:rounded-3xl border border-burgundy/15 p-4 sm:p-8 shadow-sm">
        {/* Left Column: Big Editorial Photo with Interactive Look Tags */}
        <div className="lg:col-span-7 relative rounded-xl sm:rounded-2xl overflow-hidden min-h-[380px] sm:min-h-[500px] group">
          <img
            src={currentLook.image}
            alt={currentLook.title}
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
            loading="lazy"
          />

          {/* Dark Vignette Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-transparent to-espresso/30" />

          {/* Top Pill Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-full bg-espresso/80 backdrop-blur-md text-[10px] sm:text-xs font-mono font-bold text-gold border border-gold/20 shadow-sm">
              📍 {currentLook.location}
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {currentLook.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-burgundy/80 backdrop-blur-sm text-[9px] font-mono font-bold text-ivory uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Quote Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1">
            <h4 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight">
              {currentLook.title}
            </h4>
            <p className="text-xs sm:text-sm text-ivory/85 italic font-light max-w-lg">
              &ldquo;{currentLook.quote}&rdquo;
            </p>
          </div>
        </div>

        {/* Right Column: Garment Breakdown & 1-Tap Bundle Add */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-crimson block mb-1">
                Outfit Architecture Breakdown
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-espresso">
                Layered Streetwear Pieces
              </h3>
              <p className="text-xs text-espresso/70 mt-0.5 font-light">
                {currentLook.subtitle}
              </p>
            </div>

            {/* Itemized Garment List */}
            <div className="space-y-3">
              {currentLook.items.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-ivory/60 border border-burgundy/15 flex items-center justify-between hover:bg-ivory transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-burgundy">
                      {item.category} • Size {item.size}
                    </span>
                    <h5 className="font-serif text-sm font-bold text-espresso">
                      {item.name}
                    </h5>
                    <span className="text-[10px] text-espresso/60 block">
                      {item.spec}
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-sm font-serif font-bold text-burgundy">
                      {formatPrice(item.price)}
                    </span>
                    <Link
                      href={`/product/${item.productId}`}
                      className="text-[10px] font-semibold text-espresso/70 hover:text-crimson underline mt-1"
                    >
                      View Piece
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & 1-Tap Bundle Add CTA */}
          <div className="pt-4 border-t border-burgundy/15 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-espresso/60 block">
                  Complete Set Total (2 Garments):
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-burgundy">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-bold uppercase tracking-wider">
                ✓ Free Air Delivery
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleAddLook(currentLook)}
              className={`w-full py-3.5 px-6 rounded-xl font-bold uppercase tracking-[0.16em] text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 ${
                addedLooks[currentLook.id]
                  ? "bg-green-700 text-white"
                  : "bg-burgundy hover:bg-crimson text-ivory"
              }`}
            >
              {addedLooks[currentLook.id] ? (
                <>
                  <Check className="w-4 h-4 text-gold" />
                  <span>Added Complete Fit to Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-gold" />
                  <span>Claim Entire Look to Bag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
