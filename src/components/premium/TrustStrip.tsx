import { Truck, RefreshCw, Wallet, ShieldCheck } from "lucide-react";

// Each line mirrors a published policy page — keep in sync with /shipping-policy and /returns.
const PROMISES = [
  { icon: Truck, title: "Free delivery", note: "On orders over ₹1,999" },
  { icon: RefreshCw, title: "30-day exchange", note: "Doorstep pickup" },
  { icon: Wallet, title: "Cash on delivery", note: "Serviceable PIN codes" },
  { icon: ShieldCheck, title: "Secure checkout", note: "UPI · cards · net banking" },
];

/** Removes the four objections that stop a first-time buyer. */
export function TrustStrip() {
  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8" aria-label="Our promises">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 lg:grid-cols-4">
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
