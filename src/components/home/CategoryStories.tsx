"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, LayoutGrid } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { CATEGORY_LINKS } from "@/lib/categories";

/**
 * Thumb-sized category shortcuts straight under the hero (story-style circles on phones).
 * Shoppers on mobile get to a category in one tap instead of opening the menu.
 */
export function CategoryStories() {
  const { products } = useStore();
  const live = products.filter((p) => p.inStock);
  const newCount = live.filter((p) => p.isNew).length;

  const items = [
    ...(newCount
      ? [{ key: "new", label: "New in", href: "/shop?sort=newest", count: newCount, image: live.find((p) => p.isNew)?.images[0], highlight: true }]
      : []),
    ...CATEGORY_LINKS.map(({ category, href }) => {
      const inCat = live.filter((p) => p.category === category);
      return { key: category, label: category, href, count: inCat.length, image: inCat[0]?.images[0], highlight: false };
    }).filter((x) => x.count > 0),
    { key: "all", label: "Shop all", href: "/shop", count: live.length, image: undefined, highlight: false },
  ];

  if (live.length === 0) return null;

  return (
    <nav aria-label="Shop by category" className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
      <ul className="no-scrollbar -mx-3 flex snap-x gap-3 overflow-x-auto scroll-px-3 px-3 pb-1 sm:mx-0 sm:justify-center sm:gap-6 sm:px-0">
        {items.map((it) => (
          <li key={it.key} className="flex-shrink-0 snap-start">
            <Link href={it.href} className="group flex w-[72px] flex-col items-center gap-1.5 sm:w-[96px]">
              <span
                className={`relative block h-[68px] w-[68px] rounded-full p-[2.5px] transition-transform duration-200 group-active:scale-95 sm:h-[88px] sm:w-[88px] ${
                  it.highlight ? "bg-gradient-to-tr from-crimson via-gold to-crimson" : "bg-burgundy/15"
                }`}
              >
                <span className="relative block h-full w-full overflow-hidden rounded-full border-2 border-bone bg-burgundy">
                  {it.image ? (
                    <Image src={it.image} alt="" fill sizes="(max-width: 640px) 68px, 88px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-gold">
                      <LayoutGrid className="h-6 w-6" />
                    </span>
                  )}
                </span>
                {it.highlight && (
                  <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-crimson px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-white ring-2 ring-bone">
                    <Sparkles className="h-2.5 w-2.5" /> New
                  </span>
                )}
              </span>
              <span className="w-full truncate text-center text-[11px] font-bold leading-tight text-espresso sm:text-xs">{it.label}</span>
              <span className="-mt-1 text-[11px] leading-none text-espresso/60">{it.count} styles</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
