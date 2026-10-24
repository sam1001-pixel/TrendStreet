"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Menu, X, ArrowRight, Truck, Sparkles, Wallet, BookOpen, HelpCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/context/StoreContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { QuickCommandMenu } from "@/components/QuickCommandMenu";
import { LiveCourierTrackerModal } from "@/components/LiveCourierTrackerModal";

const CATEGORIES = [
  { label: "Oversized", href: "/oversized", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop" },
  { label: "Jeans", href: "/jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop" },
  { label: "Boxy Fit", href: "/boxy-fit", image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600&auto=format&fit=crop" },
  { label: "Jackets", href: "/jackets", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop" },
];

const MORE_LINKS = [
  { label: "Complete the Fit", href: "/complete-the-fit", icon: Sparkles },
  { label: "Shop Your Way", href: "/shop-your-way", icon: Wallet },
  { label: "Lookbook", href: "/lookbook", icon: BookOpen },
  { label: "Why Trend Street", href: "/why-trend-street", icon: HelpCircle },
  { label: "Track my order", href: "/track", icon: Truck },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { cartItemsCount, wishlist, setIsCartOpen, siteSettings } = useStore();
  const { user: authCustomer, isAuthenticated } = useUserAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsCommandMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ⌘K / Ctrl+K search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandMenuOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Menu drawer: lock scroll + close on Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMenuOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  const Badge = ({ n, tone }: { n: number; tone: string }) =>
    n > 0 ? (
      <span className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${tone}`}>
        {n > 9 ? "9+" : n}
      </span>
    ) : null;

  const iconBtn = "relative flex h-10 w-10 items-center justify-center rounded-full text-espresso transition-colors hover:bg-burgundy/5 hover:text-burgundy";

  return (
    <>
      {/* Announcement */}
      {siteSettings?.topAnnouncement?.enabled && !isAnnouncementDismissed && (
        <div className="relative bg-espresso px-10 py-2 text-center text-[11px] font-semibold tracking-wide text-gold sm:text-xs">
          <span className="line-clamp-1">{siteSettings.topAnnouncement.text}</span>
          {siteSettings.topAnnouncement.linkUrl && (
            <Link href={siteSettings.topAnnouncement.linkUrl} className="ml-2 hidden font-bold text-ivory underline hover:text-gold sm:inline">
              {siteSettings.topAnnouncement.linkText || "Explore"}
            </Link>
          )}
          <button
            onClick={() => setIsAnnouncementDismissed(true)}
            className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-gold/70 hover:text-gold"
            aria-label="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <header
        className={`sticky top-0 z-40 w-full border-b transition-all duration-300 ${
          isScrolled ? "border-burgundy/15 bg-ivory/90 shadow-sm backdrop-blur-md" : "border-transparent bg-ivory"
        }`}
      >
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-2 sm:h-[76px] sm:px-6 lg:px-8">
          {/* Left */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMenuOpen(true)}
              className={`${iconBtn} lg:hidden`}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              aria-controls="site-menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button onClick={() => setIsCommandMenuOpen(true)} className={`${iconBtn} lg:hidden`} aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
              {CATEGORIES.map((c) => {
                const active = pathname === c.href;
                return (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={`relative py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
                      active ? "text-crimson" : "text-espresso/85 hover:text-crimson"
                    } after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-left after:bg-crimson after:transition-transform ${
                      active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
                    }`}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logo */}
          <div className="flex justify-center px-2">
            <Logo variant="burgundy" size={isScrolled ? "sm" : "md"} href="/" />
          </div>

          {/* Right */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button
              onClick={() => setIsCommandMenuOpen(true)}
              className="mr-1 hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-espresso/70 ring-1 ring-burgundy/15 transition-all hover:text-espresso hover:ring-burgundy/40 lg:flex"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5 text-burgundy" />
              <span className="font-medium">Search</span>
              <kbd className="rounded bg-ivory px-1.5 py-0.5 font-mono text-[9px] font-bold text-burgundy">⌘K</kbd>
            </button>
            <Link href="/track" className={`${iconBtn} hidden lg:flex`} aria-label="Track order" title="Track order">
              <Truck className="h-5 w-5" />
            </Link>
            <Link href="/saved" className={`${iconBtn} hidden sm:flex`} aria-label={`Saved items (${wishlist.length})`}>
              <Heart className="h-5 w-5" />
              <Badge n={wishlist.length} tone="bg-crimson text-white" />
            </Link>
            <Link
              href={isAuthenticated ? "/profile" : "/login"}
              className={`${iconBtn} hidden sm:flex relative`}
              aria-label={isAuthenticated ? `Atelier Account (${authCustomer?.name || "Member"})` : "Sign In to Atelier"}
              title={isAuthenticated ? `Atelier Account (${authCustomer?.name || "Member"})` : "Sign In to Atelier"}
            >
              <User className={`h-5 w-5 ${isAuthenticated ? "text-burgundy" : ""}`} />
              {isAuthenticated && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold ring-1 ring-white" />
              )}
            </Link>
            <button onClick={() => setIsCartOpen(true)} className={iconBtn} aria-label={`Bag (${cartItemsCount} items)`}>
              <ShoppingBag className="h-5 w-5" />
              <Badge n={cartItemsCount} tone="bg-burgundy text-gold" />
            </button>
          </div>
        </div>
      </header>

      {/* Menu drawer — rendered outside <header> so the header's backdrop blur can't trap it */}
      {isMenuOpen && (
        <div id="site-menu" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-espresso/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-ivory shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex h-16 items-center justify-between border-b border-burgundy/10 px-4">
              <Logo variant="burgundy" size="sm" href="/" />
              <button onClick={() => setIsMenuOpen(false)} className={iconBtn} aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-6 p-4">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-espresso/50">Shop by silhouette</p>
                <ul className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-espresso">
                        <Image src={c.image} alt="" fill sizes="45vw" className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105" />
                        <span className="absolute inset-0 bg-gradient-to-t from-espresso/90 to-transparent" />
                        <span className="absolute bottom-2 left-3 font-display text-xl font-black uppercase text-ivory">{c.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/shop" className="mt-2 flex min-h-[48px] items-center justify-between rounded-2xl bg-burgundy px-4 text-sm font-bold text-ivory">
                  All drops <ArrowRight className="h-4 w-4 text-gold" />
                </Link>
              </div>

              <ul className="divide-y divide-burgundy/10 rounded-2xl bg-white ring-1 ring-burgundy/10">
                {MORE_LINKS.map(({ label, href, icon: Icon }) => (
                  <li key={href}>
                    <Link href={href} className="flex min-h-[52px] items-center gap-3 px-4 text-sm font-semibold text-espresso hover:text-crimson">
                      <Icon className="h-4 w-4 text-burgundy" />
                      <span className="flex-1">{label}</span>
                      <ArrowRight className="h-4 w-4 text-espresso/30" />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/saved" className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-espresso ring-1 ring-burgundy/10">
                  <Heart className="h-4 w-4 text-crimson" /> Saved ({wishlist.length})
                </Link>
                <Link
                  href={isAuthenticated ? "/profile" : "/login"}
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-espresso ring-1 ring-burgundy/10 hover:ring-burgundy/30 transition-all"
                >
                  <User className={`h-4 w-4 ${isAuthenticated ? "text-burgundy" : "text-espresso/60"}`} />
                  <span className="truncate max-w-[100px]">
                    {isAuthenticated ? (authCustomer?.name?.split(" ")[0] || "Account") : "Sign In"}
                  </span>
                </Link>
              </div>
            </div>

            <div className="border-t border-burgundy/10 p-4 text-xs text-espresso/60">
              <p>Need help? <a href="mailto:concierge@trendstreet.in" className="font-semibold text-burgundy">concierge@trendstreet.in</a></p>
            </div>
          </div>
        </div>
      )}

      <QuickCommandMenu isOpen={isCommandMenuOpen} onClose={() => setIsCommandMenuOpen(false)} onOpenTracker={() => setIsTrackerOpen(true)} />
      <LiveCourierTrackerModal isOpen={isTrackerOpen} onClose={() => setIsTrackerOpen(false)} />
    </>
  );
};
