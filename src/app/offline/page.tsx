import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "You're offline | Trend Street", robots: { index: false } };

/** Shown by the service worker when there's no connection. */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-burgundy text-gold-light">
        <WifiOff className="h-6 w-6" />
      </span>
      <h1 className="font-display text-4xl font-black uppercase leading-none text-espresso">You&apos;re offline</h1>
      <p className="text-sm text-espresso/70">Check your connection. Your bag is saved on this phone, so nothing is lost.</p>
      <Link href="/" className="inline-flex min-h-[48px] items-center rounded-full bg-espresso px-6 text-xs font-bold uppercase tracking-wider text-ivory">
        Try again
      </Link>
    </div>
  );
}
