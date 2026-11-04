"use client";

import { Truck, RefreshCw, Wallet, ShieldCheck } from "lucide-react";
import { useStoreConfig } from "@/context/StoreContext";
import { fillText } from "@/lib/store-config";

// Text is edited in Admin → Settings → Trust badges; {freeOver} becomes the live free-delivery amount.
const ICONS = [Truck, RefreshCw, Wallet, ShieldCheck];

/** Removes the four objections that stop a first-time buyer. */
export function TrustStrip() {
  const config = useStoreConfig();
  const PROMISES = config.trust
    .map((t, i) => ({ icon: ICONS[i], title: fillText(t.title, config), note: fillText(t.note, config) }))
    // Hide the cash-on-delivery promise while COD is switched off.
    .filter((_, i) => i !== 2 || config.cod.enabled);
  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8" aria-label="Our promises">
      <ul className={`grid gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 ${PROMISES.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}>
        {PROMISES.map(({ icon: Icon, title, note }) => (
          <li key={title} data-reveal className="group flex items-start gap-2.5 bg-bone p-3 transition-colors duration-200 hover:bg-white sm:gap-3 sm:p-6">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-burgundy text-gold transition-transform duration-300 group-hover:-rotate-12 sm:h-10 sm:w-10">
              <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-snug text-stone-950 sm:text-sm">{title}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-stone-500 sm:text-xs">{note}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
