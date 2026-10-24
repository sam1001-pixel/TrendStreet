"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { User, Package, MapPin, Ruler, Check, Trash2, Plus, Truck, Heart, ShoppingBag, Sparkles, LogOut, ChevronRight, Award, LogIn } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { formatPrice } from "@/lib/pricing";
import type { UserProfile } from "@/types/store";

type Tab = "orders" | "details" | "addresses" | "fit";
type Address = UserProfile["savedAddresses"][number];

const input =
  "h-12 w-full rounded-xl border border-burgundy/20 bg-white px-3 text-sm text-espresso placeholder:text-espresso/40 focus:border-burgundy focus:outline-none disabled:bg-ivory disabled:text-espresso/60";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-espresso/60";

const STATUS_STYLE: Record<string, string> = {
  Delivered: "bg-green-100 text-green-800",
  Shipped: "bg-burgundy/10 text-burgundy",
  "In Transit": "bg-gold/25 text-gold-dark",
  Cancelled: "bg-red-100 text-red-700",
};

const TIERS = [
  { name: "Street", min: 0 },
  { name: "Indigo Circle", min: 2000 },
  { name: "Mehrangarh", min: 5000 },
];

function ProfileContent() {
  const { user, orders, wishlist, cartItemsCount, setIsCartOpen, updateUserProfile, isDemo, enterDemo, exitDemo } = useStore();
  const { user: authUser, isAuthenticated, logout } = useUserAuth();
  const params = useSearchParams();
  const initialTab = (params.get("tab") as Tab) || "orders";
  const [tab, setTab] = useState<Tab>(["orders", "details", "addresses", "fit"].includes(initialTab) ? initialTab : "orders");
  const [details, setDetails] = useState({ name: user.name, email: user.email, phone: user.phone });
  const [fit, setFit] = useState(user.measurements);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<Address | null>(null);

  // Profile loads from device storage or authenticated user — pick it up.
  useEffect(() => {
    const activeName = authUser?.name || user.name;
    const activeEmail = authUser?.email || user.email;
    const activePhone = authUser?.phone || user.phone;
    setDetails({ name: activeName, email: activeEmail, phone: activePhone });
    setFit(user.measurements);
  }, [user.name, user.email, user.phone, user.measurements, authUser]);

  const flash = (m: string) => {
    setSavedMsg(m);
    setTimeout(() => setSavedMsg(null), 2500);
  };

  const saveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name: details.name.trim(), email: details.email.trim(), phone: details.phone.trim() });
    flash("Details saved — they'll be filled in at checkout.");
  };

  const saveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    let list = user.savedAddresses.filter((a) => a.id !== draft.id);
    if (draft.isDefault || list.length === 0) list = list.map((a) => ({ ...a, isDefault: false }));
    const next = { ...draft, isDefault: draft.isDefault || list.length === 0 };
    updateUserProfile({ savedAddresses: next.isDefault ? [next, ...list] : [...list, next] });
    setDraft(null);
    flash("Address saved.");
  };

  const removeAddress = (id: string) => {
    const rest = user.savedAddresses.filter((a) => a.id !== id);
    if (rest.length && !rest.some((a) => a.isDefault)) rest[0] = { ...rest[0], isDefault: true };
    updateUserProfile({ savedAddresses: rest });
  };

  const points = user.rewardPoints || 0;
  const tierIdx = TIERS.reduce((acc, t, i) => (points >= t.min ? i : acc), 0);
  const nextTier = TIERS[tierIdx + 1];
  const tierPct = nextTier ? Math.min(100, Math.round(((points - TIERS[tierIdx].min) / (nextTier.min - TIERS[tierIdx].min)) * 100)) : 100;
  const spent = orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "orders", label: `Orders (${orders.length})`, icon: Package },
    { id: "details", label: "Details", icon: User },
    { id: "addresses", label: `Addresses (${user.savedAddresses.length})`, icon: MapPin },
    { id: "fit", label: "My sizes", icon: Ruler },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-6 sm:space-y-8 sm:px-6 sm:pt-12 lg:px-8">
      {isDemo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gold/20 p-3 text-xs text-espresso ring-1 ring-gold/40">
          <span className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-gold-dark" /> You&apos;re previewing a sample account. Nothing here is real or editable.
          </span>
          <button onClick={exitDemo} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-espresso px-4 text-[11px] font-bold text-ivory">
            <LogOut className="h-3.5 w-3.5" /> Exit preview
          </button>
        </div>
      )}

      {/* If guest and not in demo mode, show atelier sign-in invitation banner */}
      {!isAuthenticated && !isDemo && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-burgundy/10 border border-burgundy/20 p-5 text-espresso shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-burgundy flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="h-4 w-4 text-gold-dark" /> Trend Street Atelier Privileges
            </p>
            <p className="text-xs text-espresso/80">
              Sign in or create an account to save measurements, unlock express delivery, and sync orders across devices.
            </p>
          </div>
          <Link
            href="/login?callbackUrl=/profile"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-burgundy hover:bg-crimson px-6 text-xs font-bold uppercase tracking-wider text-gold shadow-md transition-all flex-shrink-0"
          >
            <LogIn className="h-4 w-4" /> Sign In / Register
          </Link>
        </div>
      )}

      {/* Member card */}
      <header className="relative overflow-hidden rounded-3xl bg-burgundy p-5 text-ivory sm:p-8">
        <span aria-hidden className="jaali absolute inset-0 text-ivory opacity-[0.07]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gold font-serif text-2xl font-bold text-espresso">
            {user.name ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : <User className="h-7 w-7" />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">{user.name ? `Hi, ${user.name.split(" ")[0]}` : "Your account"}</h1>
            <p className="mt-0.5 truncate text-xs text-ivory/70">{user.email || "Add your details once and checkout fills itself in."}</p>
          </div>
          {isAuthenticated ? (
            <div className="flex flex-col gap-2 sm:items-end">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
                Atelier Member
              </span>
              <button
                onClick={async () => {
                  await logout();
                  flash("Signed out successfully.");
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 text-xs font-bold text-ivory ring-1 ring-white/25 transition-all"
              >
                <LogOut className="h-3.5 w-3.5 text-gold" /> Sign Out
              </button>
            </div>
          ) : !isDemo ? (
            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href="/login?callbackUrl=/profile"
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-5 text-xs font-bold uppercase tracking-wider text-espresso hover:bg-gold-light transition-all shadow-md"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign In / Register
              </Link>
              <button
                onClick={enterDemo}
                className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-ivory/70 hover:text-gold"
              >
                <Sparkles className="h-3.5 w-3.5" /> Preview a demo account
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ivory/60">Tier</p>
            <p className="flex items-center gap-1 truncate text-sm font-bold text-gold"><Award className="h-3.5 w-3.5 flex-shrink-0" /> {user.vipTier || TIERS[tierIdx].name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ivory/60">Points</p>
            <p className="text-sm font-bold">{points.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ivory/60">Spent</p>
            <p className="truncate text-sm font-bold">{formatPrice(spent)}</p>
          </div>
          {nextTier && (
            <div className="col-span-3 mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${tierPct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-ivory/60">{(nextTier.min - points).toLocaleString("en-IN")} points to {nextTier.name}</p>
            </div>
          )}
        </div>
      </header>

      {/* Quick actions */}
      <nav aria-label="Account shortcuts" className="grid grid-cols-4 gap-2">
        {[
          { label: "Track", href: "/track", icon: Truck, n: 0 },
          { label: "Saved", href: "/saved", icon: Heart, n: wishlist.length },
          { label: "Bag", action: () => setIsCartOpen(true), icon: ShoppingBag, n: cartItemsCount },
          { label: "Sizes", action: () => setTab("fit"), icon: Ruler, n: 0 },
        ].map(({ label: l, href, action, icon: Icon, n }) => {
          const inner = (
            <>
              <span className="relative">
                <Icon className="h-5 w-5 text-burgundy" />
                {n > 0 && <span className="absolute -right-2.5 -top-2 rounded-full bg-crimson px-1.5 text-[9px] font-bold text-white">{n}</span>}
              </span>
              <span className="text-[11px] font-semibold text-espresso">{l}</span>
            </>
          );
          const cls = "flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-white ring-1 ring-burgundy/10 transition-colors hover:ring-burgundy/40";
          return href ? (
            <Link key={l} href={href} className={cls}>{inner}</Link>
          ) : (
            <button key={l} onClick={action} className={cls}>{inner}</button>
          );
        })}
      </nav>

      <div role="tablist" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map(({ id, label: l, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex min-h-[40px] flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-bold transition-colors ${
              tab === id ? "bg-espresso text-ivory" : "bg-white text-espresso/70 ring-1 ring-burgundy/15 hover:text-espresso"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {l}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">{savedMsg}</p>
      {savedMsg && (
        <p className="flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-3 text-xs text-green-800">
          <Check className="h-4 w-4" /> {savedMsg}
        </p>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-burgundy/10">
              <Package className="mx-auto h-10 w-10 text-burgundy/30" />
              <p className="mt-3 font-serif text-lg font-bold text-espresso">No orders on this device yet</p>
              <p className="mt-1 text-sm text-espresso/60">Ordered on another phone? Find it with your order number.</p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <Link href="/shop" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-burgundy px-6 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson">Start shopping</Link>
                <Link href="/track" className="inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-xs font-bold uppercase tracking-wider text-burgundy ring-1 ring-burgundy/30">Find an order</Link>
              </div>
            </div>
          ) : (
            orders.map((o) => (
              <article key={o.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-burgundy/10">
                <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
                  <div>
                    <p className="font-mono text-xs font-bold text-burgundy">{o.orderNumber}</p>
                    <p className="text-[11px] text-espresso/60">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {o.items.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[o.status] ?? "bg-ivory-dark text-espresso/70"}`}>{o.status}</span>
                </div>
                <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 sm:px-5">
                  {o.items.map((it, i) => (
                    <span key={i} className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-dark" title={it.productName}>
                      {it.image && <Image src={it.image} alt={it.productName} fill sizes="64px" className="object-cover" />}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-burgundy/10 px-4 py-3 sm:px-5">
                  <span className="text-sm font-bold text-espresso">{formatPrice(o.total)}</span>
                  <Link href={`/track?order=${encodeURIComponent(o.orderNumber)}`} className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-ivory px-4 text-xs font-bold text-burgundy hover:bg-ivory-dark">
                    Track <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {tab === "details" && (
        <form onSubmit={saveDetails} className="rounded-2xl border border-burgundy/15 bg-white p-5 sm:p-6"><fieldset disabled={isDemo} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="d-name" className={label}>Full name</label>
            <input id="d-name" autoComplete="name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} className={input} />
          </div>
          <div>
            <label htmlFor="d-email" className={label}>Email</label>
            <input id="d-email" type="email" autoComplete="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} className={input} />
          </div>
          <div>
            <label htmlFor="d-phone" className={label}>Mobile</label>
            <input id="d-phone" type="tel" inputMode="tel" autoComplete="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} placeholder="10-digit number" className={input} />
          </div>
          <p className="text-xs text-espresso/60 sm:col-span-2">Saved only in this browser to speed up checkout. Clear your browser data to remove them.</p>
          <button className="rounded-lg bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson sm:col-span-2 sm:justify-self-start">
            Save details
          </button>
        </fieldset></form>
      )}

      {tab === "addresses" && (
        <div className="space-y-4">
          {user.savedAddresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 rounded-2xl border border-burgundy/15 bg-white p-5">
              <div className="text-sm">
                <p className="font-semibold text-espresso">
                  {a.label || "Address"} {a.isDefault && <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-dark">Default</span>}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-espresso/70">
                  {a.fullName}, {a.address}, {a.city}{a.state ? `, ${a.state}` : ""} – {a.postalCode}
                </p>
              </div>
              <div className={`flex gap-2 ${isDemo ? "hidden" : ""}`}>
                <button onClick={() => setDraft(a)} className="rounded-lg border border-burgundy/20 px-3 py-2 text-xs font-semibold text-burgundy hover:border-burgundy">Edit</button>
                <button onClick={() => removeAddress(a.id)} aria-label={`Delete ${a.label || "address"}`} className="rounded-lg border border-burgundy/20 p-2 text-espresso/60 hover:border-crimson hover:text-crimson">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {draft ? (
            <form onSubmit={saveAddress} className="grid gap-4 rounded-2xl border border-burgundy/15 bg-white p-5 sm:grid-cols-2 sm:p-6">
              {([
                ["label", "Label (Home, Office…)", "text", false],
                ["fullName", "Full name", "text", true],
                ["address", "House, street, area", "text", true],
                ["city", "City", "text", true],
                ["state", "State", "text", true],
                ["postalCode", "PIN code", "text", true],
              ] as const).map(([key, l, type, required]) => (
                <div key={key} className={key === "address" ? "sm:col-span-2" : ""}>
                  <label htmlFor={`a-${key}`} className={label}>{l}</label>
                  <input
                    id={`a-${key}`}
                    type={type}
                    required={required}
                    inputMode={key === "postalCode" ? "numeric" : undefined}
                    pattern={key === "postalCode" ? "[1-9][0-9]{5}" : undefined}
                    title={key === "postalCode" ? "6-digit PIN code" : undefined}
                    value={(draft[key] as string) ?? ""}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className={input}
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 text-xs text-espresso sm:col-span-2">
                <input type="checkbox" checked={draft.isDefault} onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })} className="h-4 w-4 accent-burgundy" />
                Use as my default delivery address
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button className="rounded-lg bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson">Save address</button>
                <button type="button" onClick={() => setDraft(null)} className="rounded-lg px-4 py-3 text-xs font-semibold text-espresso/70 hover:text-espresso">Cancel</button>
              </div>
            </form>
          ) : !isDemo && (
            <button
              onClick={() => setDraft({ id: `addr-${Date.now()}`, label: "", fullName: user.name, address: "", city: "", state: "", postalCode: "", isDefault: user.savedAddresses.length === 0 })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-burgundy/25 p-5 text-xs font-bold uppercase tracking-wider text-burgundy hover:border-burgundy"
            >
              <Plus className="h-4 w-4" /> Add an address
            </button>
          )}
        </div>
      )}

      {tab === "fit" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateUserProfile({ measurements: fit });
            flash("Sizes saved.");
          }}
          className="rounded-2xl border border-burgundy/15 bg-white p-5 sm:p-6"
        ><fieldset disabled={isDemo} className="grid gap-4 sm:grid-cols-2">
          {([
            ["oversizedFit", "Oversized tee size", "e.g. L"],
            ["boxyFit", "Boxy fit size", "e.g. M"],
            ["jacketSize", "Jacket size", "e.g. L"],
            ["chest", "Chest", "e.g. 40 in"],
            ["denimWaist", "Denim waist", "e.g. 32"],
            ["denimLength", "Denim length", "e.g. 32"],
          ] as const).map(([key, l, ph]) => (
            <div key={key}>
              <label htmlFor={`f-${key}`} className={label}>{l}</label>
              <input id={`f-${key}`} value={fit[key]} placeholder={ph} onChange={(e) => setFit({ ...fit, [key]: e.target.value })} className={input} />
            </div>
          ))}
          <button className="rounded-lg bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson sm:col-span-2 sm:justify-self-start">
            Save sizes
          </button>
        </fieldset></form>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}
