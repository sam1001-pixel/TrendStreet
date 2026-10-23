"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";

/** Best-sellers shown in empty states so an empty bag or wishlist is never a dead end. */
export function BagSuggestions({ onNavigate, limit = 4, title = "Start with a best-seller" }: { onNavigate?: () => void; limit?: number; title?: string }) {
  const { products, wishlist, cart } = useStore();
  const inBag = new Set(cart.map((i) => i.product.id));
  const picks = products
    .filter((p) => p.inStock && !inBag.has(p.id) && !wishlist.includes(p.id))
    .sort((a, b) => Number(!!b.isBestSeller) - Number(!!a.isBestSeller) || Number(!!b.featured) - Number(!!a.featured))
    .slice(0, limit);

  if (!picks.length) return null;

  return (
    <div className="w-full text-left">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-espresso/60">{title}</p>
      <ul className="grid grid-cols-2 gap-3">
        {picks.map((p) => (
          <li key={p.id}>
            <Link href={`/product/${p.id}`} onClick={onNavigate} className="group block">
              <span className="block aspect-[3/4] overflow-hidden rounded-lg bg-ivory-dark">
                <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
              </span>
              <span className="mt-1.5 block truncate text-xs font-semibold text-espresso">{p.name}</span>
              <span className="block font-mono text-xs text-burgundy">{formatPrice(p.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
