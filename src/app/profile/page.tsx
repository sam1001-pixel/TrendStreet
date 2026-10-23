"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, Package, MapPin, Ruler, Search, Check, Trash2, Plus, Truck } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import type { UserProfile } from "@/types/store";

type Tab = "orders" | "details" | "addresses" | "fit";
type Address = UserProfile["savedAddresses"][number];

interface LookedUpOrder {
  orderNumber: string;
  createdAt: string;
  status: string;
  items: { productName: string; selectedSize: string; selectedColor: string; quantity: number; price: number; image: string }[];
  total: number;
  trackingNumber: string;
  courier: string | null;
  paymentMethod: string;
  city: string;
}

const input =
  "w-full rounded-lg border border-burgundy/20 bg-white px-3 py-2.5 text-sm text-espresso placeholder:text-espresso/40 focus:border-burgundy focus:outline-none";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-espresso/60";

const STATUS_STYLE: Record<string, string> = {
  Delivered: "bg-green-100 text-green-800",
  Shipped: "bg-burgundy/10 text-burgundy",
  "In Transit": "bg-burgundy/10 text-burgundy",
  Cancelled: "bg-red-100 text-red-700",
};

/** "Find my order": server lookup by order number + checkout email. */
function OrderLookup({ defaultEmail }: { defaultEmail: string }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [result, setResult] = useState<LookedUpOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setEmail((e) => e || defaultEmail), [defaultEmail]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed.");
      setResult(data.order);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-burgundy/15 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-espresso">
        <Search className="h-4 w-4 text-crimson" /> Find my order
      </h2>
      <p className="mt-1 text-xs text-espresso/60">Ordered on another phone or browser? Enter your order number and the email you used at checkout.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="lk-order" className={label}>Order number</label>
          <input id="lk-order" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="TS-261022-XXXXX" className={`${input} font-mono uppercase`} />
        </div>
        <div>
          <label htmlFor="lk-email" className={label}>Email</label>
          <input id="lk-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={input} />
        </div>
        <button disabled={busy} className="self-end rounded-lg bg-burgundy px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson disabled:opacity-50">
          {busy ? "Searching…" : "Find order"}
        </button>
      </form>

      <div aria-live="polite">
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</p>}
        {result && (
          <div className="mt-4 space-y-3 rounded-xl bg-ivory p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-burgundy">{result.orderNumber}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[result.status] ?? "bg-gold/20 text-gold-dark"}`}>{result.status}</span>
            </div>
            <ul className="space-y-2">
              {result.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 text-xs">
                  {it.image && <img src={it.image} alt="" className="h-12 w-10 rounded object-cover" />}
                  <span className="flex-1">
                    <span className="block font-semibold text-espresso">{it.productName}</span>
                    <span className="text-espresso/60">{it.selectedSize} · {it.selectedColor} · Qty {it.quantity}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-between gap-2 border-t border-burgundy/10 pt-3 text-xs">
              <span className="flex items-center gap-1.5 text-espresso/70">
                <Truck className="h-3.5 w-3.5" />
                {result.trackingNumber ? `${result.courier ?? "Courier"}: ${result.trackingNumber}` : "Tracking number is added when your order ships"}
              </span>
              <span className="font-bold text-espresso">{formatPrice(result.total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, orders, updateUserProfile } = useStore();
  const [tab, setTab] = useState<Tab>("orders");
  const [details, setDetails] = useState({ name: user.name, email: user.email, phone: user.phone });
  const [fit, setFit] = useState(user.measurements);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<Address | null>(null);

  // Profile loads from device storage after first render — pick it up.
  useEffect(() => {
    setDetails({ name: user.name, email: user.email, phone: user.phone });
    setFit(user.measurements);
  }, [user.name, user.email, user.phone, user.measurements]);

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

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "orders", label: `Orders (${orders.length})`, icon: Package },
    { id: "details", label: "My details", icon: User },
    { id: "addresses", label: `Addresses (${user.savedAddresses.length})`, icon: MapPin },
    { id: "fit", label: "My sizes", icon: Ruler },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
      <header className="flex flex-col gap-5 rounded-3xl border border-burgundy/15 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-burgundy font-serif text-2xl font-bold text-gold">
          {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-7 w-7" />}
        </div>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold text-espresso">{user.name ? `Hi, ${user.name.split(" ")[0]}` : "My account"}</h1>
          <p className="mt-0.5 text-xs text-espresso/60">
            {user.email || "Add your details once and checkout fills itself in."} Your details stay on this device.
          </p>
        </div>
        {!user.name && (
          <button onClick={() => setTab("details")} className="rounded-lg bg-burgundy px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson">
            Add my details
          </button>
        )}
      </header>

      <div role="tablist" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-burgundy/15 text-xs font-bold uppercase tracking-wider">
        {tabs.map(({ id, label: l, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex min-h-[44px] items-center gap-2 whitespace-nowrap border-b-2 pb-2 transition-colors ${
              tab === id ? "border-burgundy text-burgundy" : "border-transparent text-espresso/60 hover:text-burgundy"
            }`}
          >
            <Icon className="h-4 w-4" /> {l}
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
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-burgundy/15 bg-white p-8 text-center">
              <p className="font-serif text-lg font-bold text-espresso">No orders on this device yet</p>
              <p className="mt-1 text-xs text-espresso/60">Orders you place here show up automatically. For others, use “Find my order” below.</p>
              <Link href="/shop" className="mt-4 inline-block rounded-lg bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson">
                Start shopping
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <article key={o.id} className="space-y-4 rounded-2xl border border-burgundy/15 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ivory-dark pb-3">
                  <div>
                    <span className="block font-mono text-sm font-bold text-burgundy">{o.orderNumber}</span>
                    <span className="text-[11px] text-espresso/60">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <span className="font-bold text-espresso">{formatPrice(o.total)}</span>
                </div>
                <ul className="space-y-2">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs">
                      {it.image && <img src={it.image} alt="" className="h-14 w-11 rounded object-cover" />}
                      <span>
                        <span className="block font-semibold text-espresso">{it.productName}</span>
                        <span className="text-espresso/60">{it.selectedSize} · {it.selectedColor} · Qty {it.quantity}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-espresso/60">For live status, look this order up below with your email.</p>
              </article>
            ))
          )}
          <OrderLookup defaultEmail={user.email} />
        </div>
      )}

      {tab === "details" && (
        <form onSubmit={saveDetails} className="grid gap-4 rounded-2xl border border-burgundy/15 bg-white p-5 sm:grid-cols-2 sm:p-6">
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
        </form>
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
              <div className="flex gap-2">
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
          ) : (
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
          className="grid gap-4 rounded-2xl border border-burgundy/15 bg-white p-5 sm:grid-cols-2 sm:p-6"
        >
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
        </form>
      )}
    </div>
  );
}
