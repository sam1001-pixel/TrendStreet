"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { clearRecentlyViewed, getRecentlyViewed, RECENTLY_VIEWED_EVENT } from "@/lib/recently-viewed";
import { ProductRail } from "./ProductRail";

/** "Pick up where you left off" — the pieces this shopper opened lately. Hidden until there are some. */
export function RecentlyViewed() {
  const { products } = useStore();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const read = () => setIds(getRecentlyViewed());
    read();
    window.addEventListener(RECENTLY_VIEWED_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const items = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
      <ProductRail
        id="recently-viewed"
        eyebrow="Pick up where you left off"
        title="Recently viewed"
        products={items}
        action={
          <button
            type="button"
            onClick={clearRecentlyViewed}
            className="min-h-[44px] px-2 text-[11px] font-semibold uppercase tracking-wider text-espresso/60 hover:text-crimson"
          >
            Clear
          </button>
        }
      />
    </section>
  );
}
