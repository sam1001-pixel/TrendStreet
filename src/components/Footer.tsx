"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Mail, Instagram, Twitter, Facebook, MapPin, Phone, ChevronDown, ArrowRight, Check, Youtube, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore, useStoreConfig } from "@/context/StoreContext";
import { fillText } from "@/lib/store-config";

const GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All drops", href: "/shop" },
      { label: "Oversized", href: "/oversized" },
      { label: "Boxy Fit", href: "/boxy-fit" },
      { label: "Jackets", href: "/jackets" },
    ],
  },
  {
    title: "OFFVYBE",
    links: [
      { label: "Why OFFVYBE", href: "/why-offvybe" },
      { label: "Our story", href: "/about" },
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

export const Footer: React.FC = () => {
  const { siteSettings } = useStore();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const phone = siteSettings.contactInfo?.phone || "+91 90791 99951";
  const mail = siteSettings.contactInfo?.email || "concierge@offvybe.in";
  const pathname = usePathname();
  const config = useStoreConfig();
  const waNumber = (config.social.whatsapp || "9079199951").replace(/\D/g, "");
  // Badges and social links come from Admin → Settings; empty social links are simply not shown.
  const SOCIAL = [
    { href: config.social.instagram, label: "Instagram", icon: Instagram },
    { href: config.social.x, label: "X / Twitter", icon: Twitter },
    { href: config.social.facebook, label: "Facebook", icon: Facebook },
    { href: config.social.youtube, label: "YouTube", icon: Youtube },
    { href: waNumber ? `https://wa.me/91${waNumber}` : "", label: "WhatsApp", icon: MessageCircle },
  ].filter((s) => s.href);

  // Checkout: a slim footer (help + policies) so nothing pulls the shopper away from paying.
  if (pathname.startsWith("/checkout")) {
    return (
      <footer className="border-t border-burgundy/15 bg-bone px-4 py-6 text-center text-xs text-espresso/70">
        <p className="flex items-center justify-center gap-1.5 font-semibold text-espresso">
          <ShieldCheck className="h-4 w-4 text-green-700" /> Secure checkout · GST included
        </p>
        <p className="mt-2">
          Need help?{" "}
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-semibold text-burgundy underline">
            {phone}
          </a>
        </p>
        <nav aria-label="Policies" className="mt-1 flex justify-center gap-4">
          <Link href="/shipping-policy" className="py-3 underline">Shipping</Link>
          <Link href="/returns" className="py-3 underline">Returns</Link>
          <Link href="/terms" className="py-3 underline">Terms</Link>
        </nav>
      </footer>
    );
  }

  return (
    <footer className="border-t border-burgundy/40 bg-espresso pb-24 text-ivory md:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-10 sm:py-14 lg:grid-cols-12">
          {/* Newsletter + brand */}
          <div className="space-y-5 lg:col-span-5">
            <Logo variant="ivory" size="md" href="/" />
            <div>
              <h2 className="font-display text-3xl font-black uppercase leading-none sm:text-4xl">Get the next drop first</h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-ivory/70">{config.offer.newsletterCode ? "Early access to limited runs and a welcome code for your first order." : "Early access to limited runs and new drops."}</p>
            </div>
            {subscribed ? (
              <p className="flex max-w-sm items-center gap-2 rounded-xl bg-white/10 p-3 text-xs text-gold">
                <Check className="h-4 w-4" /> You&apos;re in.
                {config.offer.newsletterCode && (
                  <>
                    {" "}Use <span className="font-bold text-ivory">{config.offer.newsletterCode}</span> at checkout.
                  </>
                )}
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
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/60" />
                  <input
                    id="footer-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-3 text-sm text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none"
                  />
                </div>
                <button type="submit" aria-label="Subscribe" className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gold text-white hover:bg-gold-light">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            )}
            <div className="space-y-1.5 text-xs text-ivory/70">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold" /> {siteSettings.contactInfo?.address || "Pal Road, Jodhpur, Rajasthan 342008"}
              </p>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex min-h-[40px] items-center gap-2 hover:text-gold-light">
                <Phone className="h-3.5 w-3.5 text-gold" /> {phone}
              </a>
              <a href={`mailto:${mail}`} className="flex min-h-[40px] items-center gap-2 hover:text-gold-light">
                <Mail className="h-3.5 w-3.5 text-gold" /> {mail}
              </a>
            </div>
          </div>

          {/* Link groups: accordions on mobile, columns on desktop */}
          <div className="divide-y divide-white/10 border-y border-white/10 sm:grid sm:grid-cols-3 sm:gap-8 sm:divide-y-0 sm:border-0 lg:col-span-7">
            {GROUPS.map((g) => (
              <details key={g.title} className="group sm:hidden">
                <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-gold-light [&::-webkit-details-marker]:hidden">
                  {g.title}
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="space-y-1 pb-4">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="block py-2.5 text-sm text-ivory/80 hover:text-gold-light">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
            {GROUPS.map((g) => (
              <div key={`d-${g.title}`} className="hidden sm:block">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-light">{g.title}</h3>
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
        <div className="flex flex-col-reverse items-center gap-5 border-t border-white/10 pt-6 text-[11px] text-ivory/60 md:flex-row md:justify-between">
          <p className="text-center">© {new Date().getFullYear()} OFFVYBE</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="py-3 hover:text-gold-light">Privacy</Link>
            <Link href="/terms" className="py-3 hover:text-gold-light">Terms</Link>
            <Link href="/shipping-policy" className="py-3 hover:text-gold-light">Shipping</Link>
            <Link href="/returns" className="py-3 hover:text-gold-light">Returns</Link>
          </div>
          <div className={`flex items-center gap-3 ${SOCIAL.length ? "" : "hidden"}`}>
            {SOCIAL.map(({ href, label, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-ivory transition-colors hover:bg-gold hover:text-white">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
