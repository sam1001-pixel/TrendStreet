"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User, Package, MapPin, Check, Trash2, Plus, Truck, Heart, ShoppingBag, Sparkles, LogOut, LogIn, Cloud, Smartphone } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { useAccount } from "@/context/AccountContext";
import { OrderCard } from "@/components/orders/OrderCard";
import { AccountSecurity } from "@/components/AccountSecurity";
import { INDIAN_STATES_AND_UTS } from "@/lib/indian-states";
import type { UserProfile } from "@/types/store";

type Tab = "orders" | "details" | "addresses";
type Address = UserProfile["savedAddresses"][number];

const input =
  "h-12 w-full rounded-xl border border-burgundy/20 bg-white px-3 text-sm text-espresso placeholder:text-espresso/60 focus:border-burgundy focus:outline-none disabled:bg-ivory disabled:text-espresso/60";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-espresso/60";

function ProfileContent() {
  const { user, orders, wishlist, cartItemsCount, setIsCartOpen, updateUserProfile, upsertOrder, isDemo, exitDemo } = useStore();
  const account = useAccount();
  const { user: authUser, isAuthenticated, logout } = useUserAuth();
  const params = useSearchParams();
  const initialTab = (params.get("tab") as Tab) || "orders";
  const [tab, setTab] = useState<Tab>(["orders", "details", "addresses"].includes(initialTab) ? initialTab : "orders");
  const [details, setDetails] = useState({ name: user.name, email: user.email, phone: user.phone });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const synced = isAuthenticated && account.status === "ready";
  const [draft, setDraft] = useState<Address | null>(null);

  // Profile loads from device storage or authenticated user — pick it up.
  useEffect(() => {
    const activeName = authUser?.name || user.name;
    const activeEmail = authUser?.email || user.email;
    const activePhone = authUser?.phone || user.phone;
    setDetails({ name: activeName, email: activeEmail, phone: activePhone });
  }, [user.name, user.email, user.phone, authUser]);

  const flash = (m: string) => {
    setSavedMsg(m);
    setTimeout(() => setSavedMsg(null), 2500);
  };

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (synced) {
      setBusy(true);
      const res = await account.saveDetails({ name: details.name.trim(), phone: details.phone.trim() });
      setBusy(false);
      if (!res.ok) return setFormError(res.error);
      flash("Details saved to your account.");
      return;
    }
    updateUserProfile({ name: details.name.trim(), email: details.email.trim(), phone: details.phone.trim() });
    flash("Details saved — they'll be filled in at checkout.");
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setFormError(null);
    if (synced) {
      setBusy(true);
      const res = await account.saveAddress(draft);
      setBusy(false);
      if (!res.ok) return setFormError(res.error);
    } else {
      let list = user.savedAddresses.filter((a) => a.id !== draft.id);
      if (draft.isDefault || list.length === 0) list = list.map((a) => ({ ...a, isDefault: false }));
      const next = { ...draft, isDefault: draft.isDefault || list.length === 0 };
      updateUserProfile({ savedAddresses: next.isDefault ? [next, ...list] : [...list, next] });
    }
    setDraft(null);
    flash("Address saved.");
  };

  const removeAddress = async (id: string) => {
    setFormError(null);
    if (synced) {
      const res = await account.deleteAddress(id);
      if (!res.ok) setFormError(res.error);
      return;
    }
    const rest = user.savedAddresses.filter((a) => a.id !== id);
    if (rest.length && !rest.some((a) => a.isDefault)) rest[0] = { ...rest[0], isDefault: true };
    updateUserProfile({ savedAddresses: rest });
  };

  const activeOrders = orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length;
  const memberSince = account.memberSince ? new Date(account.memberSince).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : null;

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "orders", label: `Orders (${orders.length})`, icon: Package },
    { id: "details", label: "Details", icon: User },
    { id: "addresses", label: `Addresses (${user.savedAddresses.length})`, icon: MapPin },
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

      {/* Member card */}
      <header className="relative overflow-hidden rounded-3xl bg-burgundy p-5 text-ivory sm:p-8">
        <span aria-hidden className="jaali absolute inset-0 text-ivory opacity-[0.07]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gold font-serif text-2xl font-bold text-white">
            {user.name ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : <User className="h-7 w-7" />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">{user.name ? `Hi, ${user.name.split(" ")[0]}` : "Your account"}</h1>
            <p className={`mt-0.5 text-xs text-ivory/70 ${user.email ? "truncate" : ""}`}>{user.email || (isAuthenticated || isDemo ? "Add your details once and checkout fills itself in." : "Sign in to track orders and check out faster.")}</p>
          </div>
          {isAuthenticated ? (
            <div className="flex flex-col gap-2 sm:items-end">
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
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gold-light transition-all shadow-md"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign in / Create account
              </Link>
            </div>
          ) : null}
        </div>

        <dl className="relative mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-ivory/60">Orders</dt>
            <dd className="text-sm font-bold">
              {orders.length}
              {activeOrders > 0 && <span className="ml-1 text-[11px] font-semibold text-gold">· {activeOrders} on the way</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-ivory/60">Saved</dt>
            <dd className="text-sm font-bold">{wishlist.length}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-ivory/60">{memberSince ? "Member since" : "Stored"}</dt>
            <dd className="truncate text-sm font-bold">{memberSince ?? "This device"}</dd>
          </div>
        </dl>
      </header>

      {!isDemo && (
        isAuthenticated ? (
          <p className="flex items-center gap-2 text-[11px] font-semibold text-espresso/60">
            <Cloud className="h-3.5 w-3.5 text-burgundy" />
            {account.status === "ready"
              ? "Your orders, addresses and saved items are synced to your account."
              : account.status === "error"
                ? "Couldn't reach your account just now — showing what's on this device."
                : "Syncing your account…"}
            {account.status === "error" && (
              <button onClick={() => account.refresh()} className="font-bold text-burgundy underline">Retry</button>
            )}
          </p>
        ) : (
          <Link href="/login?callbackUrl=/profile" className="flex items-center gap-3 rounded-2xl bg-white p-3 text-xs text-espresso ring-1 ring-burgundy/10 hover:ring-burgundy/40">
            <Smartphone className="h-5 w-5 flex-shrink-0 text-burgundy" />
            <span className="flex-1">
              <span className="block font-bold">Saved on this phone only</span>
              Sign in to see your orders, addresses and saved items on any device.
            </span>
            <LogIn className="h-4 w-4 text-burgundy" />
          </Link>
        )
      )}

      {/* Quick actions */}
      <nav aria-label="Account shortcuts" className="grid grid-cols-3 gap-2">
        {[
          { label: "Track", href: "/track", icon: Truck, n: 0 },
          { label: "Saved", href: "/saved", icon: Heart, n: wishlist.length },
          { label: "Bag", action: () => setIsCartOpen(true), icon: ShoppingBag, n: cartItemsCount },
        ].map(({ label: l, href, action, icon: Icon, n }) => {
          const inner = (
            <>
              <span className="relative">
                <Icon className="h-5 w-5 text-burgundy" />
                {n > 0 && <span className="absolute -right-2.5 -top-2 rounded-full bg-crimson px-1.5 text-[10px] font-bold text-white">{n}</span>}
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
      {formError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{formError}</p>
      )}
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
              <p className="mt-3 font-serif text-lg font-bold text-espresso">{synced ? "No orders yet" : "No orders on this device yet"}</p>
              <p className="mt-1 text-sm text-espresso/60">{synced ? "Orders you place while signed in show up here on every device." : "Ordered as a guest or on another phone? Find it with your order number."}</p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <Link href="/shop" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-burgundy px-6 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson">Start shopping</Link>
                <Link href="/track" className="inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-xs font-bold uppercase tracking-wider text-burgundy ring-1 ring-burgundy/30">Find an order</Link>
              </div>
            </div>
          ) : (
            orders.map((o, i) => <OrderCard key={o.orderNumber} order={o} onUpdated={upsertOrder} defaultOpen={i === 0 && !["Delivered", "Cancelled"].includes(o.status)} />)
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
            <input id="d-email" type="email" autoComplete="email" value={details.email} readOnly={isAuthenticated} onChange={(e) => setDetails({ ...details, email: e.target.value })} className={`${input} ${isAuthenticated ? "bg-ivory text-espresso/70" : ""}`} />
            {isAuthenticated && <p className="mt-1 text-[11px] text-espresso/50">This is your sign-in email.</p>}
          </div>
          <div>
            <label htmlFor="d-phone" className={label}>Mobile</label>
            <input id="d-phone" type="tel" inputMode="tel" autoComplete="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} placeholder="10-digit number" className={input} />
          </div>
          <p className="text-xs text-espresso/60 sm:col-span-2">
            {synced ? "Saved to your account and filled in at checkout on any device." : "Saved only in this browser to speed up checkout. Clear your browser data to remove them."}
          </p>
          <button disabled={busy} className="min-h-[48px] rounded-lg disabled:opacity-60 bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson sm:col-span-2 sm:justify-self-start">
            Save details
          </button>
        </fieldset></form>
      )}

      {tab === "details" && isAuthenticated && !isDemo && (
        <AccountSecurity
          onSignedOutEverywhere={async () => {
            await logout();
            flash("Signed out on every device.");
          }}
        />
      )}

      {tab === "addresses" && (
        <div className="space-y-4">
          {user.savedAddresses.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 rounded-2xl border border-burgundy/15 bg-white p-5">
              <div className="text-sm">
                <p className="font-semibold text-espresso">
                  {a.label || "Address"} {a.isDefault && <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-bold uppercase text-gold-dark">Default</span>}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-espresso/70">
                  {a.fullName}{a.phone ? ` · ${a.phone}` : ""}
                  <br />
                  {[a.address, a.apartment, a.city, a.state].filter(Boolean).join(", ")} – {a.postalCode}
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
              <div className="sm:col-span-2">
                <p className={label}>Label</p>
                <div className="flex flex-wrap gap-2">
                  {["Home", "Work", "Other"].map((l) => (
                    <button key={l} type="button" onClick={() => setDraft({ ...draft, label: l })} aria-pressed={draft.label === l} className={`min-h-[40px] rounded-full px-4 text-xs font-bold ${draft.label === l ? "bg-espresso text-ivory" : "bg-ivory text-espresso ring-1 ring-burgundy/15"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {([
                ["fullName", "Full name", "name", true, ""],
                ["phone", "Mobile (for the courier)", "tel", false, ""],
                ["address", "House no., street, area", "address-line1", true, "sm:col-span-2"],
                ["apartment", "Flat, floor, landmark (optional)", "address-line2", false, "sm:col-span-2"],
                ["city", "City", "address-level2", true, ""],
                ["postalCode", "PIN code", "postal-code", true, ""],
              ] as const).map(([key, l, auto, required, cls]) => (
                <div key={key} className={cls}>
                  <label htmlFor={`a-${key}`} className={label}>{l}</label>
                  <input
                    id={`a-${key}`}
                    type={key === "phone" ? "tel" : "text"}
                    autoComplete={auto}
                    required={required}
                    inputMode={key === "postalCode" || key === "phone" ? "numeric" : undefined}
                    pattern={key === "postalCode" ? "[1-9][0-9]{5}" : key === "phone" ? "[6-9][0-9]{9}" : undefined}
                    maxLength={key === "postalCode" ? 6 : key === "phone" ? 10 : undefined}
                    title={key === "postalCode" ? "6-digit PIN code" : key === "phone" ? "10-digit mobile number" : undefined}
                    value={(draft[key] as string) ?? ""}
                    onChange={(e) => setDraft({ ...draft, [key]: key === "postalCode" || key === "phone" ? e.target.value.replace(/\D/g, "") : e.target.value })}
                    className={input}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label htmlFor="a-state" className={label}>State</label>
                <select id="a-state" required autoComplete="address-level1" value={draft.state ?? ""} onChange={(e) => setDraft({ ...draft, state: e.target.value })} className={input}>
                  <option value="">Choose state</option>
                  {INDIAN_STATES_AND_UTS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-espresso sm:col-span-2">
                <input type="checkbox" checked={draft.isDefault} onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })} className="h-4 w-4 accent-burgundy" />
                Use as my default delivery address
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button disabled={busy} className="min-h-[48px] rounded-lg bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson disabled:opacity-60">{busy ? "Saving…" : "Save address"}</button>
                <button type="button" onClick={() => setDraft(null)} className="rounded-lg px-4 py-3 text-xs font-semibold text-espresso/70 hover:text-espresso">Cancel</button>
              </div>
            </form>
          ) : !isDemo && (
            <button
              onClick={() => setDraft({ id: `addr-${Date.now()}`, label: "Home", fullName: user.name, phone: user.phone, address: "", apartment: "", city: "", state: "", postalCode: "", isDefault: user.savedAddresses.length === 0 })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-burgundy/25 p-5 text-xs font-bold uppercase tracking-wider text-burgundy hover:border-burgundy"
            >
              <Plus className="h-4 w-4" /> Add an address
            </button>
          )}
        </div>
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
