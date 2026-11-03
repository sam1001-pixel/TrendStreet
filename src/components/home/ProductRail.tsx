"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/store";

/**
 * A swipeable row of product cards. On phones about 2.3 cards show, so the cut-off card
 * tells people there is more to swipe; snap points keep every swipe landing on a card edge.
 */
export function ProductRail({
  id,
  eyebrow,
  title,
  products,
  href,
  hrefLabel = "See all",
  action,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  products: Product[];
  href?: string;
  hrefLabel?: string;
  /** Extra control in the header (e.g. "Clear"). */
  action?: React.ReactNode;
}) {
  const row = useRef<HTMLUListElement>(null);
  if (!products.length) return null;

  const scroll = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div aria-labelledby={`${id}-title`} role="region">
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          {eyebrow && <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-crimson">{eyebrow}</p>}
          <h3 id={`${id}-title`} className="truncate font-display text-[1.75rem] font-black uppercase leading-[0.9] text-espresso sm:text-4xl">
            {title}
          </h3>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {action}
          {products.length > 4 && (
            <>
              <button type="button" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`} className="hidden h-9 w-9 items-center justify-center rounded-full bg-white text-espresso ring-1 ring-burgundy/15 transition-colors hover:bg-burgundy hover:text-white sm:flex">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`} className="hidden h-9 w-9 items-center justify-center rounded-full bg-white text-espresso ring-1 ring-burgundy/15 transition-colors hover:bg-burgundy hover:text-white sm:flex">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          {href && (
            <Link href={href} className="inline-flex min-h-[44px] items-center gap-1 pl-1 text-xs font-bold uppercase tracking-wider text-burgundy hover:text-crimson">
              {hrefLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <ul
        ref={row}
        className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-3 px-3 pb-2 sm:mx-0 sm:gap-5 sm:scroll-px-0 sm:px-0"
      >
        {products.map((p) => (
          <li key={p.id} className="w-[42vw] max-w-[210px] flex-shrink-0 snap-start sm:w-[220px] sm:max-w-none lg:w-[250px]">
            <ProductCard product={p} compact />
          </li>
        ))}
        {href && (
          <li className="w-[34vw] max-w-[170px] flex-shrink-0 snap-start sm:w-[180px]">
            <Link
              href={href}
              className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-burgundy/25 bg-white text-center text-xs font-bold uppercase tracking-wider text-burgundy transition-colors hover:border-crimson hover:text-crimson"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-burgundy text-gold">
                <ArrowRight className="h-5 w-5" />
              </span>
              {hrefLabel}
              <span className="font-normal normal-case tracking-normal text-espresso/60">{title}</span>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
