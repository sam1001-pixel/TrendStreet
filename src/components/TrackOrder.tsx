"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Search, Package, PackageCheck, Truck, Home, CheckCircle2, MapPin, Phone, MessageCircle, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import { DEMO_ORDERS, TRACK_STEPS, stepIndexFor } from "@/data/demo";

interface TrackedOrder {
  orderNumber: string;
  createdAt: string;
  status: string;
  items: { productName: string; selectedSize: string; selectedColor: string; quantity: number; price: number; image: string }[];
  total: number;
  trackingNumber: string;
  courier: string | null;
  city: string;
  postalCode?: string;
  estimatedDelivery?: string;
  isSample?: boolean;
}

const STEP_ICONS = [CheckCircle2, Package, Truck, Truck, Home];

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

function courierFor(tracking: string) {
  if (tracking.startsWith("BD")) return "Blue Dart";
  if (tracking.startsWith("DLV")) return "Delhivery";
  return null;
}

export function TrackOrder() {
  const { orders, user } = useStore();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setEmail((e) => e || user.email), [user.email]);

  const fromLocal = (q: string): TrackedOrder | null => {
    const key = q.trim().toUpperCase();
    const o = [...orders, ...DEMO_ORDERS].find((x) => x.orderNumber.toUpperCase() === key || x.trackingNumber.toUpperCase() === key);
    if (!o) return null;
    const hasTracking = /\d/.test(o.trackingNumber);
    return {
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      items: o.items,
      total: o.total,
      trackingNumber: hasTracking ? o.trackingNumber : "",
      courier: hasTracking ? courierFor(o.trackingNumber) : null,
      city: o.customer.city,
      postalCode: o.customer.postalCode,
      estimatedDelivery: o.estimatedDelivery,
      isSample: o.orderNumber.startsWith("TS-DEMO"),
    };
  };

  const lookup = async (q = orderNumber) => {
    setError(null);
    setResult(null);
    if (!q.trim()) return;
    // Orders placed on this device (and the sample orders) don't need an email.
    const local = fromLocal(q);
    if (local) {
      setResult(local);
      return;
    }
    if (!email.trim()) {
      setError("Enter the email you used at checkout so we can find this order.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: q, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We couldn't find that order.");
      setResult(data.order);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Deep link: /track?order=TS-...
  useEffect(() => {
    const q = params.get("order");
    if (q) {
      const local = fromLocal(q);
      if (local) setResult(local);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, orders]);

  const step = result ? stepIndexFor(result.status) : -1;
  const cancelled = result?.status === "Cancelled";
  const recent = orders.slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      {/* Search */}
      <div className="space-y-4 lg:col-span-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup();
          }}
          className="space-y-3 rounded-3xl bg-espresso p-5 text-ivory sm:p-6"
        >
          <div>
            <label htmlFor="t-order" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ivory/60">
              Order or tracking number
            </label>
            <input
              id="t-order"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="TS-261022-XXXXX"
              autoCapitalize="characters"
              className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 font-mono text-sm uppercase text-ivory placeholder:text-ivory/30 focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="t-email" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ivory/60">
              Checkout email <span className="font-normal normal-case text-ivory/40">(not needed for orders on this device)</span>
            </label>
            <input
              id="t-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold focus:outline-none"
            />
          </div>
          <button disabled={busy} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gold text-xs font-bold uppercase tracking-[0.18em] text-espresso hover:bg-gold-light disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {busy ? "Searching…" : "Track order"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderNumber(DEMO_ORDERS[0].orderNumber);
              lookup(DEMO_ORDERS[0].orderNumber);
            }}
            className="flex w-full items-center justify-center gap-1.5 text-[11px] font-semibold text-gold/80 hover:text-gold"
          >
            <Sparkles className="h-3.5 w-3.5" /> Try a sample order
          </button>
        </form>

        {recent.length > 0 && (
          <div className="rounded-3xl bg-white p-4 ring-1 ring-burgundy/10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-espresso/50">Recent on this device</p>
            <ul className="space-y-1">
              {recent.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => {
                      setOrderNumber(o.orderNumber);
                      lookup(o.orderNumber);
                    }}
                    className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 text-left hover:bg-ivory"
                  >
                    <span>
                      <span className="block font-mono text-xs font-bold text-burgundy">{o.orderNumber}</span>
                      <span className="text-[11px] text-espresso/60">{fmtDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</span>
                    </span>
                    <span className="rounded-full bg-ivory-dark px-2 py-0.5 text-[10px] font-bold text-espresso/70">{o.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Result */}
      <div className="lg:col-span-7" aria-live="polite">
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">{error}</p>}

        {!result && !error && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-burgundy/15 p-8 text-center">
            <PackageCheck className="h-10 w-10 text-burgundy/30" />
            <p className="mt-3 font-serif text-lg font-bold text-espresso">Where&apos;s my order?</p>
            <p className="mt-1 max-w-xs text-sm text-espresso/60">Your order number is in the confirmation email and SMS. It starts with TS-.</p>
          </div>
        )}

        {result && (
          <motion.article
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl bg-white ring-1 ring-burgundy/10"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 bg-burgundy p-5 text-ivory sm:p-6">
              <div>
                {result.isSample && <span className="mb-1 inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-espresso">Sample order</span>}
                <p className="font-mono text-sm font-bold">{result.orderNumber}</p>
                <p className="text-xs text-ivory/70">Placed {fmtDate(result.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-ivory/60">{cancelled ? "Status" : result.status === "Delivered" ? "Delivered" : "Arriving by"}</p>
                <p className="font-serif text-2xl font-bold text-gold">
                  {cancelled ? "Cancelled" : result.estimatedDelivery ? fmtDate(result.estimatedDelivery) : result.status}
                </p>
              </div>
            </header>

            {/* Stepper */}
            {!cancelled && (
              <ol className="relative grid grid-cols-5 gap-1 px-4 pb-2 pt-6 sm:px-6">
                <div className="absolute left-[10%] right-[10%] top-[42px] h-1 rounded-full bg-ivory-dark" aria-hidden />
                <motion.div
                  aria-hidden
                  className="absolute left-[10%] top-[42px] h-1 rounded-full bg-burgundy"
                  initial={{ width: reduce ? `${(step / 4) * 80}%` : 0 }}
                  animate={{ width: `${(step / 4) * 80}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
                {TRACK_STEPS.map((label, i) => {
                  const Icon = STEP_ICONS[i];
                  const done = i <= step;
                  return (
                    <li key={label} className="relative flex flex-col items-center text-center">
                      <span
                        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                          done ? "bg-burgundy text-gold" : "bg-ivory-dark text-espresso/30"
                        } ${i === step ? "ring-4 ring-burgundy/20" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className={`mt-2 text-[10px] font-semibold leading-tight sm:text-xs ${done ? "text-espresso" : "text-espresso/40"}`}>{label}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-3 py-1.5 text-espresso/80">
                  <Truck className="h-3.5 w-3.5 text-burgundy" />
                  {result.trackingNumber ? `${result.courier ?? "Courier"} · ${result.trackingNumber}` : "AWB added when your order ships"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-3 py-1.5 text-espresso/80">
                  <MapPin className="h-3.5 w-3.5 text-burgundy" /> {result.city}
                  {result.postalCode ? ` ${result.postalCode}` : ""}
                </span>
              </div>

              <ul className="divide-y divide-burgundy/10">
                {result.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3 py-3">
                    {it.image && (
                      <span className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-dark">
                        <Image src={it.image} alt="" fill sizes="48px" className="object-cover" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 text-xs">
                      <span className="block truncate text-sm font-semibold text-espresso">{it.productName}</span>
                      <span className="text-espresso/60">Size {it.selectedSize} · {it.selectedColor} · Qty {it.quantity}</span>
                    </span>
                    <span className="text-sm font-bold text-espresso">{formatPrice(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-burgundy/10 pt-3 text-sm">
                <span className="text-espresso/70">Order total</span>
                <span className="font-bold text-burgundy">{formatPrice(result.total)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <a href="https://wa.me/919820012345" target="_blank" rel="noreferrer" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-ivory text-[11px] font-semibold text-espresso hover:bg-ivory-dark">
                  <MessageCircle className="h-4 w-4 text-green-700" /> WhatsApp
                </a>
                <a href="tel:+919820012345" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-ivory text-[11px] font-semibold text-espresso hover:bg-ivory-dark">
                  <Phone className="h-4 w-4 text-burgundy" /> Call us
                </a>
                <Link href="/returns" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-ivory text-[11px] font-semibold text-espresso hover:bg-ivory-dark">
                  <RotateCcw className="h-4 w-4 text-crimson" /> Exchange
                </Link>
              </div>
            </div>
          </motion.article>
        )}
      </div>
    </div>
  );
}
