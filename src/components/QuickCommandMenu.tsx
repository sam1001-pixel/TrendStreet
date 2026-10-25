"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ArrowRight,
  Layers,
  Truck,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";

interface QuickCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTracker?: () => void;
}

export const QuickCommandMenu: React.FC<QuickCommandMenuProps> = ({
  isOpen,
  onClose,
  onOpenTracker,
}) => {
  const router = useRouter();
  const { products } = useStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Clean query and matching products (memoized to keep dependency stable)
  const cleanQuery = query.toLowerCase().trim();
  const matchingProducts = useMemo(() => {
    return cleanQuery
      ? products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(cleanQuery) ||
              p.category.toLowerCase().includes(cleanQuery) ||
              p.fabric.toLowerCase().includes(cleanQuery) ||
              p.subtitle.toLowerCase().includes(cleanQuery) ||
              p.tags.some((t) => t.toLowerCase().includes(cleanQuery))
          )
          .slice(0, 5)
      : [];
  }, [cleanQuery, products]);

  const handleNavigate = useCallback(
    (path: string) => {
      onClose();
      router.push(path);
    },
    [onClose, router]
  );

  // Keyboard navigation & dismissal (Escape, ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (matchingProducts.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % matchingProducts.length);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (matchingProducts.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + matchingProducts.length) % matchingProducts.length);
        }
      } else if (e.key === "Enter") {
        if (matchingProducts.length > 0 && matchingProducts[selectedIndex]) {
          e.preventDefault();
          handleNavigate(`/product/${matchingProducts[selectedIndex].id}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, matchingProducts, selectedIndex, handleNavigate]);

  if (!isOpen) return null;

  const handleTrackerClick = () => {
    onClose();
    if (onOpenTracker) {
      onOpenTracker();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Command Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-24 px-3 sm:px-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-espresso/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-burgundy/20 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-burgundy/15 bg-ivory">
          <Search className="w-5 h-5 text-burgundy flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search silhouettes, 320gsm tees, 15oz denim, order tracking..."
            className="w-full bg-transparent px-3 text-sm sm:text-base text-espresso placeholder-espresso/45 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-espresso/40 hover:text-espresso"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-espresso/50 bg-white rounded border border-burgundy/15 shadow-sm">
              ESC
            </kbd>
          )}
        </div>

        {/* Results / Navigation Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* If Query entered and matches found */}
          {cleanQuery && matchingProducts.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy block px-2 mb-2">
                Matching Drops ({matchingProducts.length})
              </span>
              <div className="space-y-1">
                {matchingProducts.map((prod, index) => {
                  const isHighlighted = selectedIndex === index;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => handleNavigate(`/product/${prod.id}`)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between group transition-colors ${
                        isHighlighted
                          ? "bg-ivory ring-1 ring-burgundy/30"
                          : "hover:bg-ivory/60"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Image
                          src={prod.images[0]}
                          alt={prod.name}
                          width={48}
                    height={56}
                    className="w-12 h-14 object-cover rounded bg-ivory-dark flex-shrink-0 border border-burgundy/10"
                  />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-sm font-bold text-espresso group-hover:text-crimson transition-colors">
                              {prod.name}
                            </span>
                            <span className="text-[9px] font-mono uppercase bg-burgundy/10 text-burgundy px-1.5 py-0.5 rounded font-bold">
                              {prod.category}
                            </span>
                          </div>
                          <p className="text-xs text-espresso/60 mt-0.5 line-clamp-1">
                            {prod.fabric}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-burgundy block">
                          {formatPrice(prod.price)}
                        </span>
                        <span className="text-[10px] text-green-700 font-medium">In Stock</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* If Query entered but NO matches */}
          {cleanQuery && matchingProducts.length === 0 && (
            <div className="text-center py-8 text-espresso/60 space-y-2">
              <p className="text-sm font-medium">
                No exact matches for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-espresso/50">
                Try searching &ldquo;Oversized&rdquo;, &ldquo;Selvedge&rdquo;, &ldquo;320gsm&rdquo;, or &ldquo;Flight Bomber&rdquo;
              </p>
            </div>
          )}

          {/* Quick Category / Silhouette Jump (OFFCULT style) */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-espresso/50 block px-2 mb-2">
              Three Core Silhouettes
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Oversized", path: "/oversized", spec: "520gsm Terry" },
                { label: "Boxy Fit", path: "/boxy-fit", spec: "320gsm Cotton" },
                { label: "Jackets", path: "/jackets", spec: "700gsm Wool" },
              ].map((sil) => (
                <button
                  key={sil.label}
                  onClick={() => handleNavigate(sil.path)}
                  className="p-2.5 rounded-xl border border-burgundy/10 bg-ivory/50 hover:bg-white hover:border-burgundy/30 text-left transition-all group"
                >
                  <span className="font-serif text-xs font-bold text-espresso group-hover:text-crimson block">
                    {sil.label}
                  </span>
                  <span className="text-[10px] text-burgundy font-mono block mt-0.5">
                    {sil.spec}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Concierge & Self-Service Shortcuts */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-espresso/50 block px-2 mb-2">
              Concierge & Self-Service
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleTrackerClick}
                className="p-2.5 rounded-xl border border-burgundy/10 bg-white hover:bg-ivory text-left flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-burgundy/10 text-burgundy flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-espresso group-hover:text-crimson block">
                      Track Live Courier
                    </span>
                    <span className="text-[10px] text-espresso/60 block">
                      Blue Dart & Delhivery Express
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-espresso/40 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  const arrivalsEl = document.getElementById("new-arrivals");
                  if (arrivalsEl) {
                    arrivalsEl.scrollIntoView({ behavior: "smooth" });
                  } else {
                    router.push("/shop");
                  }
                }}
                className="p-2.5 rounded-xl border border-burgundy/10 bg-white hover:bg-ivory text-left flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-burgundy/10 text-burgundy flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-espresso group-hover:text-crimson block">
                      New Arrivals Drop Radar
                    </span>
                    <span className="text-[10px] text-espresso/60 block">
                      Explore Latest AW26 Releases
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-espresso/40 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Palette Footer Bar */}
        <div className="px-4 py-2.5 bg-ivory-dark/70 border-t border-burgundy/10 flex items-center justify-between text-[11px] text-espresso/60">
          <div className="flex items-center space-x-3">
            <span>Navigation: <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-burgundy/15 text-[10px]">↑</kbd> <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-burgundy/15 text-[10px]">↓</kbd></span>
            <span>Select: <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-burgundy/15 text-[10px]">↵</kbd></span>
          </div>
          <span className="font-mono text-burgundy font-semibold">Trend Street Atelier</span>
        </div>
      </div>
    </div>
  );
};
