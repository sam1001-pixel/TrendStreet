"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ShoppingBag, Eye, ArrowRight, X, Star } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { Product } from "@/types/store";
import { formatPrice } from "@/lib/pricing";

interface LookbookItem {
  id: string;
  title: string;
  season: string;
  narrative: string;
  image: string;
  hotspots: {
    productId: string;
    label: string;
    x: number; // percentage
    y: number; // percentage
  }[];
}

const LOOKBOOK_DATA: LookbookItem[] = [
  {
    id: "look-1",
    title: "The Shibuya Heavyweight Streetwear Stance",
    season: "Look 01 — Oversized & Denim",
    narrative: "An unyielding exploration of volume and proportion. The 320gsm Mayfair heavyweight tee paired with relaxed 14oz Japanese redline selvedge carpenter denim.",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1400&auto=format&fit=crop",
    hotspots: [
      {
        productId: "ts-001",
        label: "Mayfair Heavyweight Tee (₹2,499)",
        x: 48,
        y: 45,
      },
      {
        productId: "ts-004",
        label: "Shibuya Carpenter Jeans (₹5,499)",
        x: 52,
        y: 75,
      },
    ],
  },
  {
    id: "look-2",
    title: "Tokyo Brutalism in French Terry & Suede",
    season: "Look 02 — Volume Layering",
    narrative: "Supple Florentine lambskin suede bomber jacket layered effortlessly over our 520gsm double-walled loopback French terry oversized hoodie.",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop",
    hotspots: [
      {
        productId: "ts-010",
        label: "Tuscan Suede Flight Jacket (₹11,999)",
        x: 52,
        y: 42,
      },
      {
        productId: "ts-002",
        label: "Tokyo Oversized Hoodie (₹4,999)",
        x: 48,
        y: 58,
      },
    ],
  },
  {
    id: "look-3",
    title: "The Boxy Cut & Selvedge Denim Narrative",
    season: "Look 03 — Geometric Proportions",
    narrative: "Sharp dropped shoulders and a cropped square hem. High-density mercerized poplin overshirt meeting Kurabo mill rigid raw denim with natural stacked puddles.",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1400&auto=format&fit=crop",
    hotspots: [
      {
        productId: "ts-007",
        label: "Boxy Heavyweight Poplin Shirt (₹3,499)",
        x: 50,
        y: 35,
      },
      {
        productId: "ts-006",
        label: "Raw Indigo Baggy Jeans (₹5,999)",
        x: 52,
        y: 75,
      },
    ],
  },
];

export default function LookbookPage() {
  const { products, addToCart, setQuickViewProduct } = useStore();
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const handleHotspotClick = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setActiveProduct(prod);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-crimson block">
          Autumn / Winter 2026 Editorial
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-espresso">
          The Volume & Structure Dialogue
        </h1>
        <p className="text-xs sm:text-sm text-espresso/70 leading-relaxed font-light">
          Tap the glowing pins on any look to discover the exact Oversized, Jeans, Boxy Fit, and Jacket garments and claim them directly.
        </p>
      </div>

      {/* Lookbook Entries */}
      <div className="space-y-24">
        {LOOKBOOK_DATA.map((look, index) => (
          <div
            key={look.id}
            data-reveal
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
              index % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* Image Column with Hotspots */}
            <div className={`lg:col-span-7 relative ${index % 2 === 1 ? "lg:order-2" : ""}`}>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-ivory-dark shadow-2xl border border-burgundy/15 group">
                <img
                  src={look.image}
                  alt={look.title}
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
                />

                {/* Hotspot Pins */}
                {look.hotspots.map((spot, sIdx) => (
                  <div
                    key={sIdx}
                    className="absolute z-20 group/pin"
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  >
                    <button
                      onClick={() => handleHotspotClick(spot.productId)}
                      className="relative -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-burgundy/90 text-gold flex items-center justify-center border-2 border-white shadow-xl hover:scale-125 transition-transform"
                      aria-label={spot.label}
                    >
                      <Sparkles className="w-4 h-4 text-gold" />
                      <span className="absolute -inset-1 rounded-full bg-burgundy/30 animate-ping pointer-events-none" />
                    </button>

                    {/* Tooltip on hover */}
                    <div className="hidden group-hover/pin:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-espresso/90 text-ivory text-[11px] font-semibold rounded shadow-xl whitespace-nowrap border border-gold/30">
                      {spot.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Narrative Column */}
            <div className={`lg:col-span-5 space-y-5 ${index % 2 === 1 ? "lg:order-1" : ""}`}>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold bg-espresso px-3 py-1 rounded inline-block">
                {look.season}
              </span>
              <h2 className="font-serif text-3xl font-bold text-espresso leading-tight">
                {look.title}
              </h2>
              <p className="text-xs sm:text-sm text-espresso/80 leading-relaxed font-light">
                {look.narrative}
              </p>

              {/* Garment Highlights List */}
              <div className="pt-2 space-y-2 border-t border-burgundy/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy block">
                  Garments in this Look:
                </span>
                {look.hotspots.map((spot, idx) => {
                  const p = products.find((prod) => prod.id === spot.productId);
                  if (!p) return null;
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-burgundy/10 flex items-center justify-between hover:border-burgundy/30 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded bg-ivory-dark"
                        />
                        <div className="text-xs">
                          <h4 className="font-serif font-bold text-espresso">{p.name}</h4>
                          <span className="text-burgundy font-bold">{formatPrice(p.price)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setQuickViewProduct(p)}
                          className="p-2 text-espresso/70 hover:text-burgundy"
                          title="Quick view"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => addToCart(p, p.sizes[0], p.colors[0]?.name, 1)}
                          className="py-1 px-3 bg-burgundy hover:bg-crimson text-gold text-[10px] font-bold uppercase rounded"
                        >
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hotspot Quick Product Overlay Modal */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-ivory rounded-2xl max-w-md w-full p-6 border border-burgundy/20 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy">
                  Shop The Look Item
                </span>
                <h3 className="font-serif text-xl font-bold text-espresso">{activeProduct.name}</h3>
                <span className="text-base font-bold text-burgundy">
                  {formatPrice(activeProduct.price)}
                </span>
              </div>
              <button onClick={() => setActiveProduct(null)} className="p-1 text-espresso/60 hover:text-burgundy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={activeProduct.images[0]}
              alt={activeProduct.name}
              className="w-full aspect-[4/3] object-cover rounded-xl bg-ivory-dark"
            />

            <p className="text-xs text-espresso/70 leading-relaxed">
              {activeProduct.description}
            </p>

            <div className="pt-2 flex space-x-3">
              <button
                onClick={() => {
                  addToCart(activeProduct, activeProduct.sizes[0], activeProduct.colors[0]?.name, 1);
                  setActiveProduct(null);
                }}
                className="flex-1 py-3 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>
              <Link
                href={`/product/${activeProduct.id}`}
                className="py-3 px-4 bg-white border border-burgundy/20 hover:border-burgundy text-burgundy text-xs font-bold uppercase rounded-lg"
              >
                View Dossier
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
