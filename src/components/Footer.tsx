"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Wallet, Mail, Instagram, Twitter, Facebook, MapPin, Phone, ChevronDown, ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/context/StoreContext";

const GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All drops", href: "/shop" },
      { label: "Oversized", href: "/oversized" },
      { label: "Jeans", href: "/jeans" },
      { label: "Boxy Fit", href: "/boxy-fit" },
      { label: "Jackets", href: "/jackets" },
      { label: "Complete the Fit", href: "/complete-the-fit" },
      { label: "Shop Your Way", href: "/shop-your-way" },
    ],
  },
  {
    title: "Trend Street",
    links: [
      { label: "Why Trend Street", href: "/why-trend-street" },
      { label: "Our story", href: "/about" },
      { label: "Lookbook", href: "/lookbook" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Track my order", href: "/track" },
      { label: "Shipping", href: "/shipping-policy" },
      { label: "Returns & exchanges", href: "/returns" },
      { label: "My account", href: "/profile" },
      { label: "Grievance officer", href: "/contact" },
    ],
  },
];

const PROMISES = [
  { icon: Truck, title: "Free delivery", note: "Over ₹1,999" },
  { icon: RotateCcw, title: "30-day exchange", note: "Doorstep pickup" },
  { icon: Wallet, title: "Cash on delivery", note: "Most PIN codes" },
  { icon: ShieldCheck, title: "Secure checkout", note: "UPI · Cards · Razorpay" },
];

const SOCIAL = [
  { href: "https://instagram.com", label: "Instagram", icon: Instagram },
  { href: "https://twitter.com", label: "X / Twitter", icon: Twitter },
  { href: "https://facebook.com", label: "Facebook", icon: Facebook },
];

export const Footer: React.FC = () => {
  const { siteSettings } = useStore();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const phone = siteSettings.contactInfo?.phone || "+91 98200 12345";
  const mail = siteSettings.contactInfo?.email || "concierge@trendstreet.in";

  return (
    <footer className="border-t border-burgundy/40 bg-espresso pb-24 text-ivory md:pb-10">
      {/* Promise strip */}
      <div className="border-b border-white/10">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, note }) => (
            <li key={title} className="flex items-center gap-3 bg-espresso px-4 py-4 sm:px-6 sm:py-6">
              <Icon className="h-5 w-5 flex-shrink-0 text-gold" />
              <span className="min-w-0">
                <span className="block text-xs font-bold sm:text-sm">{title}</span>
                <span className="block truncate text-[11px] text-ivory/60">{note}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-10 sm:py-14 lg:grid-cols-12">
          {/* Newsletter + brand */}
          <div className="space-y-5 lg:col-span-5">
            <Logo variant="ivory" size="md" href="/" />
            <div>
              <h2 className="font-display text-3xl font-black uppercase leading-none sm:text-4xl">Get the next drop first</h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-ivory/70">Early access to limited runs and 10% off your first order over ₹1,999.</p>
            </div>
            {subscribed ? (
              <p className="flex max-w-sm items-center gap-2 rounded-xl bg-white/10 p-3 text-xs text-gold">
                <Check className="h-4 w-4" /> You&apos;re in. Use <span className="font-bold text-ivory">TREND10</span> at checkout.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) setSubscribed(true);
                }}
                className="flex max-w-sm gap-2"
              >
                <label htmlFor="footer-email" className="sr-only">Email address</label>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                  <input
                    id="footer-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-3 text-sm text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none"
                  />
                </div>
                <button type="submit" aria-label="Subscribe" className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gold text-espresso hover:bg-gold-light">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            )}
            <div className="space-y-1.5 text-xs text-ivory/70">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold" /> Pali Hill, Bandra West, Mumbai 400050
              </p>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-gold">
                <Phone className="h-3.5 w-3.5 text-gold" /> {phone}
              </a>
              <a href={`mailto:${mail}`} className="flex items-center gap-2 hover:text-gold">
                <Mail className="h-3.5 w-3.5 text-gold" /> {mail}
              </a>
            </div>
          </div>

          {/* Link groups: accordions on mobile, columns on desktop */}
          <div className="divide-y divide-white/10 border-y border-white/10 sm:grid sm:grid-cols-3 sm:gap-8 sm:divide-y-0 sm:border-0 lg:col-span-7">
            {GROUPS.map((g) => (
              <details key={g.title} className="group sm:hidden">
                <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-gold [&::-webkit-details-marker]:hidden">
                  {g.title}
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="space-y-1 pb-4">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="block py-1.5 text-sm text-ivory/80 hover:text-gold">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
            {GROUPS.map((g) => (
              <div key={`d-${g.title}`} className="hidden sm:block">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold">{g.title}</h3>
                <ul className="space-y-2.5">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-ivory/75 transition-colors hover:text-gold">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col-reverse items-center gap-5 border-t border-white/10 pt-6 text-[11px] text-ivory/55 md:flex-row md:justify-between">
          <p className="text-center">© {new Date().getFullYear()} Trend Street Luxury Apparels Private Limited</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-gold">Terms</Link>
            <Link href="/shipping-policy" className="hover:text-gold">Shipping</Link>
            <Link href="/returns" className="hover:text-gold">Returns</Link>
          </div>
          <div className="flex items-center gap-3">
            {SOCIAL.map(({ href, label, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-ivory transition-colors hover:bg-gold hover:text-espresso">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
