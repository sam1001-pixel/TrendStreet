import { Truck, RefreshCw, Wallet, ShieldCheck } from "lucide-react";

// Each line mirrors a published policy page — keep in sync with /shipping-policy and /returns.
const PROMISES = [
  { icon: Truck, title: "Free shipping over ₹1,999", note: "Blue Dart & Delhivery air" },
  { icon: RefreshCw, title: "30-day doorstep exchange", note: "Wrong size? We pick it up" },
  { icon: Wallet, title: "Cash on delivery", note: "On serviceable PIN codes" },
  { icon: ShieldCheck, title: "Secure Razorpay checkout", note: "UPI, cards, net banking" },
];

/** Removes the four objections that stop a first-time buyer. */
export function TrustStrip() {
  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8" aria-label="Our promises">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 lg:grid-cols-4">
        {PROMISES.map(({ icon: Icon, title, note }) => (
          <li key={title} data-reveal className="group flex items-start gap-3 bg-bone p-4 transition-colors duration-200 hover:bg-white sm:p-6">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-burgundy text-gold transition-transform duration-300 group-hover:-rotate-12">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-stone-950">{title}</span>
              <span className="mt-0.5 block text-xs text-stone-500">{note}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
