"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ShoppingBag, Sparkles, Tag, ArrowRight, Ruler } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import { CURATED_LOOKS, BUNDLE_PERCENT, BUNDLE_CODE, type CuratedLook } from "@/data/looks";
import type { Product } from "@/types/store";

type Pick = { include: boolean; size: string; color: string };

const OCCASION_FILTERS = ["All", "Everyday", "Festive", "Summer", "Winter", "Night out"] as const;

/** The user's saved size for a category, if it's one this product offers. */
function preferredSize(p: Product, m: { oversizedFit: string; boxyFit: string; jacketSize: string; denimWaist: string }) {
  const pref =
    p.category === "Oversized" ? m.oversizedFit : p.category === "Boxy Fit" ? m.boxyFit : p.category === "Jackets" ? m.jacketSize : m.denimWaist;
  if (pref && p.sizes.includes(pref)) return pref;
  // Middle of the run is the safest default (M / L, 32).
  return p.sizes[Math.min(p.sizes.length - 1, Math.floor(p.sizes.length / 2))] ?? p.sizes[0] ?? "M";
}

export function CompleteTheFit({ initialLookId }: { initialLookId?: string }) {
  const { products, addToCart, applyPromoCode, user } = useStore();
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<(typeof OCCASION_FILTERS)[number]>("All");
  const [lookId, setLookId] = useState(initialLookId && CURATED_LOOKS.some((l) => l.id === initialLookId) ? initialLookId : CURATED_LOOKS[0].id);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [added, setAdded] = useState(false);

  const visibleLooks = filter === "All" ? CURATED_LOOKS : CURATED_LOOKS.filter((l) => l.occasion === filter);
  const look: CuratedLook = CURATED_LOOKS.find((l) => l.id === lookId) ?? CURATED_LOOKS[0];

  const pieces = useMemo(
    () =>
      look.pieces
        .map((piece) => ({ ...piece, product: products.find((p) => p.id === piece.productId) }))
        .filter((x): x is typeof x & { product: Product } => !!x.product),
    [look, products]
  );

  // Reset selections whenever the look changes, using the shopper's saved sizes.
  useEffect(() => {
    const next: Record<string, Pick> = {};
    for (const { product } of pieces) {
      next[product.id] = {
        include: product.inStock,
        size: preferredSize(product, user.measurements),
        color: product.colors[0]?.name ?? "Default",
      };
    }
    setPicks(next);
    setAdded(false);
  }, [pieces, user.measurements]);

  const chosen = pieces.filter(({ product }) => picks[product.id]?.include);
  const retail = chosen.reduce((s, { product }) => s + product.price, 0);
  const qualifies = chosen.length >= 2;
  const saving = qualifies ? Math.round((retail * BUNDLE_PERCENT) / 100) : 0;
  const total = retail - saving;

  const update = (id: string, patch: Partial<Pick>) => setPicks((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const addAll = () => {
    if (!chosen.length) return;
    chosen.forEach(({ product }) => {
      const p = picks[product.id];
      addToCart(product, p.size, p.color, 1);
    });
    if (qualifies) applyPromoCode(BUNDLE_CODE);
    setAdded(true);
    setTimeout(() => setAdded(false), 2400);
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Occasion filter */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter looks by occasion">
        {OCCASION_FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`min-h-[40px] whitespace-nowrap rounded-full px-4 text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === f ? "bg-espresso text-ivory" : "bg-white text-espresso/70 ring-1 ring-burgundy/15 hover:text-espresso"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Look picker: swipe on mobile */}
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
        {visibleLooks.map((l) => {
          const active = l.id === look.id;
          return (
            <li key={l.id} className="w-[42%] flex-shrink-0 snap-start sm:w-auto">
              <button
                onClick={() => setLookId(l.id)}
                aria-pressed={active}
                className={`group block w-full overflow-hidden rounded-2xl text-left transition-all ${
                  active ? "ring-2 ring-burgundy ring-offset-2 ring-offset-bone" : "ring-1 ring-burgundy/10 hover:ring-burgundy/40"
                }`}
              >
                <span className="relative block aspect-[4/5] bg-ivory-dark">
                  <Image src={l.image} alt="" fill sizes="(max-width:640px) 42vw, 16vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-transparent" />
                  <span className="absolute left-2 top-2 rounded-full bg-ivory/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-espresso">{l.occasion}</span>
                  <span className="absolute inset-x-2 bottom-2 font-serif text-sm font-bold leading-tight text-ivory">{l.name}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Builder */}
      <AnimatePresence mode="wait">
        <motion.div
          key={look.id}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-start gap-6 lg:grid-cols-12 lg:gap-10"
        >
          {/* Editorial image */}
          <div className="relative overflow-hidden rounded-3xl bg-espresso lg:sticky lg:top-24 lg:col-span-5">
            <div className="relative aspect-[4/5] sm:aspect-[3/4]">
              <Image src={look.image} alt={look.name} fill priority sizes="(max-width:1024px) 100vw, 40vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/20 to-transparent" />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-espresso">
              <Sparkles className="h-3 w-3" /> Save {BUNDLE_PERCENT}% on 2+ pieces
            </span>
            <div className="absolute inset-x-0 bottom-0 p-5 text-ivory sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Stylist note</p>
              <h2 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">{look.name}</h2>
              <p className="mt-2 text-xs leading-relaxed text-ivory/80 sm:text-sm">{look.note}</p>
            </div>
          </div>

          {/* Pieces */}
          <div className="space-y-4 lg:col-span-7">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-espresso/60">In this look</p>
                <p className="text-sm text-espresso/80">{look.vibe}</p>
              </div>
              <Link href="/profile?tab=fit" className="hidden items-center gap-1 text-[11px] font-semibold text-burgundy hover:underline sm:inline-flex">
                <Ruler className="h-3.5 w-3.5" /> Save my sizes
              </Link>
            </div>

            <ul className="space-y-3">
              {pieces.map(({ product, role }) => {
                const pick = picks[product.id];
                if (!pick) return null;
                return (
                  <li
                    key={product.id}
                    className={`rounded-2xl bg-white p-3 ring-1 transition-all sm:p-4 ${pick.include ? "ring-burgundy/25" : "opacity-60 ring-burgundy/10"}`}
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <Link href={`/product/${product.id}`} className="relative h-28 w-[5.5rem] flex-shrink-0 overflow-hidden rounded-xl bg-ivory-dark sm:h-32 sm:w-24">
                        <Image src={product.images[0]} alt={product.name} fill sizes="96px" className="object-cover" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-crimson">{role} · {product.category}</span>
                            <Link href={`/product/${product.id}`} className="block truncate font-serif text-sm font-bold text-espresso hover:text-crimson sm:text-base">
                              {product.name}
                            </Link>
                            <span className="text-sm font-bold text-burgundy">{formatPrice(product.price)}</span>
                          </div>
                          <label className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-espresso/70">
                            <input
                              type="checkbox"
                              checked={pick.include}
                              disabled={!product.inStock}
                              onChange={(e) => update(product.id, { include: e.target.checked })}
                              className="h-4 w-4 accent-burgundy"
                            />
                            <span className="hidden sm:inline">Include</span>
                          </label>
                        </div>

                        {/* Colour */}
                        {product.colors.length > 1 && (
                          <div className="mt-2 flex items-center gap-1.5" aria-label="Colour">
                            {product.colors.map((c) => (
                              <button
                                key={c.name}
                                title={c.name}
                                aria-label={c.name}
                                aria-pressed={pick.color === c.name}
                                onClick={() => update(product.id, { color: c.name })}
                                className={`h-6 w-6 rounded-full border border-black/15 transition-transform ${pick.color === c.name ? "scale-110 ring-2 ring-burgundy ring-offset-1" : ""}`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                            <span className="ml-1 truncate text-[11px] text-espresso/60">{pick.color}</span>
                          </div>
                        )}

                        {/* Size */}
                        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto" aria-label="Size">
                          {product.sizes.map((s) => (
                            <button
                              key={s}
                              onClick={() => update(product.id, { size: s, include: true })}
                              aria-pressed={pick.size === s}
                              className={`h-9 min-w-[36px] flex-shrink-0 rounded-lg px-2 font-mono text-[11px] font-bold transition-colors ${
                                pick.size === s ? "bg-burgundy text-gold" : "bg-ivory text-espresso ring-1 ring-burgundy/15 hover:ring-burgundy"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        {!product.inStock && <p className="mt-1 text-[11px] font-semibold text-crimson">Sold out</p>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Summary (desktop) */}
            <div className="hidden rounded-2xl bg-espresso p-6 text-ivory sm:block">
              <Summary retail={retail} saving={saving} total={total} count={chosen.length} qualifies={qualifies} />
              <AddButton onClick={addAll} disabled={!chosen.length} added={added} total={total} count={chosen.length} />
              <p className="mt-3 text-center text-[11px] text-ivory/60">Each piece can still be exchanged on its own within 30 days.</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Sticky summary bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-burgundy/15 bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="text-espresso/70">
            {chosen.length} piece{chosen.length === 1 ? "" : "s"}
            {saving > 0 && <span className="ml-1.5 font-bold text-green-800">Save {formatPrice(saving)}</span>}
          </span>
          <span className="font-serif text-lg font-bold text-burgundy">{formatPrice(total)}</span>
        </div>
        <AddButton onClick={addAll} disabled={!chosen.length} added={added} total={total} count={chosen.length} compact />
      </div>
    </div>
  );
}

function Summary({ retail, saving, total, count, qualifies }: { retail: number; saving: number; total: number; count: number; qualifies: boolean }) {
  return (
    <dl className="mb-4 space-y-1.5 text-sm">
      <div className="flex justify-between text-ivory/70">
        <dt>{count} pieces at retail</dt>
        <dd className={saving ? "line-through" : ""}>{formatPrice(retail)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="flex items-center gap-1.5 text-gold">
          <Tag className="h-3.5 w-3.5" /> Bundle saving
        </dt>
        <dd className="text-gold">{qualifies ? `−${formatPrice(saving)}` : "Add 2+ pieces"}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-white/10 pt-2">
        <dt className="font-semibold">You pay</dt>
        <dd className="font-serif text-3xl font-bold">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}

function AddButton({ onClick, disabled, added, total, count, compact }: { onClick: () => void; disabled: boolean; added: boolean; total: number; count: number; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-[0.16em] transition-colors disabled:opacity-50 ${
        compact ? "min-h-[48px] text-[11px]" : "min-h-[56px] text-xs"
      } ${added ? "bg-green-700 text-white" : "bg-gold text-espresso hover:bg-gold-light"}`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" /> Added to bag
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" />
          {compact ? `Add ${count} to bag` : `Add ${count} piece${count === 1 ? "" : "s"} · ${formatPrice(total)}`}
          {!compact && <ArrowRight className="h-4 w-4" />}
        </>
      )}
    </button>
  );
}
