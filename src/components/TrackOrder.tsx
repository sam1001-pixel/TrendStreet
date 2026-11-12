"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Search, Package, PackageCheck, Truck, Home, CheckCircle2, MapPin, Phone, MessageCircle, RotateCcw, Loader2 } from "lucide-react";
import { useStore, useStoreConfig } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import { TRACK_STEPS, stepIndexFor } from "@/data/demo";
import { CancelSheet, ReturnSheet } from "@/components/orders/OrderCard";
import type { Order, OrderReturn } from "@/types/store";

interface TrackedOrder {
  orderNumber: string;
  createdAt: string;
  status: string;
  items: { productName: string; selectedSize: string; selectedColor: string; quantity: number; price: number; image: string; productId?: string; orderItemId?: string }[];
  total: number;
  trackingNumber: string;
  courier: string | null;
  city: string;
  postalCode?: string;
  estimatedDelivery?: string;
  isSample?: boolean;
  /** Live from the server: what the shopper can do now. */
  paymentMethod?: Order["paymentMethod"];
  cancellable?: boolean;
  cancelViaSupport?: boolean;
  returnable?: boolean;
  returnBy?: string | null;
  returns?: OrderReturn[];
}

/** Server order (after cancel / return request) → the shape this page shows. */
function fromServer(o: Order): TrackedOrder {
  return {
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    status: o.status,
    items: o.items,
    total: o.total,
    trackingNumber: o.trackingNumber,
    courier: o.courier ?? null,
    city: o.customer.city,
    postalCode: o.customer.postalCode,
    paymentMethod: o.paymentMethod,
    cancellable: o.cancellable,
    cancelViaSupport: o.cancelViaSupport,
    returnable: o.returnable,
    returnBy: o.returnBy,
    returns: o.returns,
  };
}

/** Minimal Order for the cancel / exchange sheets. */
function asOrder(t: TrackedOrder): Order {
  return {
    id: t.orderNumber,
    orderNumber: t.orderNumber,
    createdAt: t.createdAt,
    status: t.status as Order["status"],
    items: t.items.map((i) => ({ ...i, productId: i.productId ?? "" })),
    subtotal: t.total,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: t.total,
    customer: { fullName: "", email: "", phone: "", address: "", city: t.city, postalCode: t.postalCode ?? "", country: "India" },
    deliveryMethod: "standard",
    paymentMethod: t.paymentMethod ?? "cod",
    trackingNumber: t.trackingNumber,
    estimatedDelivery: t.estimatedDelivery ?? "",
  };
}

const STEP_ICONS = [CheckCircle2, Package, Truck, Truck, Home];

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

function courierFor(tracking: string) {
  if (tracking.startsWith("BD") || tracking.startsWith("TS-BLU")) return "Blue Dart";
  if (tracking.startsWith("DLV") || tracking.startsWith("TS-DEL")) return "Delhivery";
  return null;
}

export function TrackOrder() {
  const { orders, user, siteSettings } = useStore();
  const config = useStoreConfig();
  const callDigits = (siteSettings.contactInfo?.phone || "+91 90791 99951").replace(/\D/g, "");
  const waDigits = config.social.whatsapp || (callDigits.length >= 10 ? callDigits.slice(-10) : "9079199951");
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Email that proved ownership of the shown order (needed to cancel / request an exchange as a guest).
  const [ownerEmail, setOwnerEmail] = useState("");
  const [sheet, setSheet] = useState<"cancel" | "return" | null>(null);

  /** Fetches the live status for an order; quietly keeps the current view if it can't. */
  const fetchLive = async (q: string, mail: string, quiet: boolean) => {
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: q, email: mail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We couldn't find that order.");
      setResult(data.order);
      setOwnerEmail(mail);
    } catch (err) {
      if (!quiet) setError((err as Error).message);
    }
  };

  useEffect(() => setEmail((e) => e || user.email), [user.email]);

  const fromLocal = (q: string): TrackedOrder | null => {
    const key = q.trim().toUpperCase();
    const o = orders.find((x) => x.orderNumber.toUpperCase() === key || x.trackingNumber.toUpperCase() === key);
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
      // This device's copy may be out of date: refresh it from the server in the background.
      const mail = localEmail(q) || email.trim();
      if (!local.isSample && mail) void fetchLive(local.orderNumber, mail, true);
      return;
    }
    if (!email.trim()) {
      setError("Enter the email you used at checkout so we can find this order.");
      return;
    }
    setBusy(true);
    await fetchLive(q, email.trim(), false);
    setBusy(false);
  };

  const localEmail = (q: string) => orders.find((x) => x.orderNumber.toUpperCase() === q.trim().toUpperCase())?.customer.email ?? "";

  // Deep link: /track?order=TS-...
  useEffect(() => {
    const q = params.get("order");
    if (q) {
      const local = fromLocal(q);
      if (local) {
        setResult(local);
        const mail = localEmail(q) || user.email;
        if (!local.isSample && mail) void fetchLive(local.orderNumber, mail, true);
      }
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
              autoCapitalize="characters"
              className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 font-mono text-sm uppercase text-ivory placeholder:text-ivory/30 focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="t-email" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ivory/60">
              Checkout email <span className="font-normal normal-case text-ivory/60">(not needed for orders on this device)</span>
            </label>
            <input
              id="t-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold focus:outline-none"
            />
          </div>
          <button disabled={busy} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gold text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-gold-light disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {busy ? "Searching…" : "Track order"}
          </button>
        </form>

        {recent.length > 0 && (
          <div className="rounded-3xl bg-white p-4 ring-1 ring-burgundy/10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-espresso/60">Recent on this device</p>
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
                    <span className="rounded-full bg-ivory-dark px-2 py-0.5 text-[11px] font-bold text-espresso/70">{o.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Result */}
      <div className="lg:col-span-7 min-w-0 max-w-full" aria-live="polite">
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">{error}</p>}

        {!result && !error && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-burgundy/15 p-8 text-center">
            <PackageCheck className="h-10 w-10 text-burgundy/30" />
            <p className="mt-3 font-serif text-lg font-bold text-espresso">Where&apos;s my order?</p>
            <p className="mt-1 max-w-xs text-sm text-espresso/60">Your order number is in your confirmation email and SMS.</p>
          </div>
        )}

        {result && (
          <motion.article
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-white ring-1 ring-burgundy/10 shadow-xs"
          >
            {/* Header with order number and status pill */}
            <header className="flex items-center justify-between gap-3 bg-espresso p-4 sm:p-6 text-ivory border-b border-white/10">
              <div className="min-w-0">
                <p className="font-mono text-xs sm:text-sm font-bold truncate text-ivory">{result.orderNumber}</p>
                <p className="text-[11px] sm:text-xs text-ivory/60 truncate mt-0.5">Placed {fmtDate(result.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                    cancelled
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : result.status === "Delivered"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : result.status === "In Transit" || result.status === "Shipped"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {cancelled ? "Cancelled" : result.status}
                </span>
                {result.estimatedDelivery && !cancelled && (
                  <p className="text-[10px] sm:text-[11px] text-ivory/60 mt-1">
                    Arriving {fmtDate(result.estimatedDelivery)}
                  </p>
                )}
              </div>
            </header>

            {/* Stepper - fully responsive 5-step progress track */}
            {!cancelled && (
              <div className="w-full max-w-full px-2 sm:px-6 pt-5 pb-3">
                <ol className="relative grid grid-cols-5 gap-0.5 sm:gap-1 w-full max-w-full min-w-0">
                  <div className="absolute left-[10%] right-[10%] top-3.5 sm:top-4 h-0.5 sm:h-1 rounded-full bg-ivory-dark" aria-hidden />
                  <motion.div
                    aria-hidden
                    className="absolute left-[10%] top-3.5 sm:top-4 h-0.5 sm:h-1 rounded-full bg-espresso"
                    initial={{ width: reduce ? `${(step / 4) * 80}%` : 0 }}
                    animate={{ width: `${(step / 4) * 80}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {TRACK_STEPS.map((label, i) => {
                    const Icon = STEP_ICONS[i];
                    const done = i <= step;
                    const isCurrent = i === step;
                    return (
                      <li key={label} className="relative flex flex-col items-center text-center min-w-0 px-0.5">
                        <span
                          className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-colors ${
                            done ? "bg-espresso text-ivory" : "bg-ivory-dark text-espresso/40"
                          } ${isCurrent ? "ring-2 sm:ring-4 ring-crimson/30 text-crimson" : ""}`}
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                        <span
                          className={`mt-1.5 text-[9px] sm:text-xs font-semibold leading-tight text-center break-words w-full truncate sm:whitespace-normal ${
                            done ? "text-espresso font-bold" : "text-espresso/50"
                          }`}
                          title={label}
                        >
                          {label === "Out for delivery" ? (
                            <>
                              <span className="sm:hidden">Out</span>
                              <span className="hidden sm:inline">Out for delivery</span>
                            </>
                          ) : (
                            label
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            <div className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-2.5 py-1 text-[11px] sm:text-xs text-espresso/80 border border-burgundy/10 truncate max-w-full">
                  <Truck className="h-3.5 w-3.5 text-crimson shrink-0" />
                  <span className="truncate">{result.trackingNumber ? `${result.courier ?? "Courier"} · ${result.trackingNumber}` : "AWB added when your order ships"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory px-2.5 py-1 text-[11px] sm:text-xs text-espresso/80 border border-burgundy/10 truncate max-w-full">
                  <MapPin className="h-3.5 w-3.5 text-crimson shrink-0" />
                  <span className="truncate">{result.city}{result.postalCode ? ` ${result.postalCode}` : ""}</span>
                </span>
              </div>

              <ul className="divide-y divide-burgundy/10">
                {result.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3 py-3">
                    {it.image && (
                      <span className="relative h-14 w-11 sm:h-16 sm:w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-dark border border-burgundy/10">
                        <Image src={it.image} alt={it.productName} fill sizes="48px" className="object-cover" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs sm:text-sm font-semibold text-espresso">{it.productName}</span>
                      <span className="text-[11px] sm:text-xs text-espresso/60 block truncate">Size {it.selectedSize} · {it.selectedColor} · Qty {it.quantity}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-espresso shrink-0 text-right">{formatPrice(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center border-t border-burgundy/10 pt-3 text-xs sm:text-sm">
                <span className="text-espresso/70 font-medium">Order total</span>
                <span className="font-bold text-sm sm:text-base text-espresso">{formatPrice(result.total)}</span>
              </div>

              {result.returns && result.returns.length > 0 && (
                <ul className="space-y-2">
                  {result.returns.map((r) => (
                    <li key={r.id} className="rounded-xl bg-ivory p-3 text-xs">
                      <p className="font-bold text-espresso">
                        {r.kind === "EXCHANGE" ? "Exchange" : "Return"} request · <span className="text-burgundy">{r.statusLabel}</span>
                      </p>
                      <p className="mt-0.5 text-espresso/60">{r.reason}</p>
                      {r.adminNote && <p className="mt-1 rounded-lg bg-white p-2 text-espresso">OFFVYBE: {r.adminNote}</p>}
                    </li>
                  ))}
                </ul>
              )}

              {(result.cancellable || result.returnable) && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  {result.returnable && (
                    <button type="button" onClick={() => setSheet("return")} className="inline-flex min-h-[44px] sm:min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-full bg-espresso px-5 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson transition-colors">
                      <RotateCcw className="h-4 w-4" /> Exchange / return
                    </button>
                  )}
                  {result.cancellable && (
                    <button type="button" onClick={() => setSheet("cancel")} className="inline-flex min-h-[44px] sm:min-h-[48px] flex-1 items-center justify-center rounded-full px-5 text-xs font-bold uppercase tracking-wider text-crimson ring-1 ring-crimson/30 hover:bg-crimson/5 transition-colors">
                      Cancel order
                    </button>
                  )}
                </div>
              )}
              {result.returnable && result.returnBy && (
                <p className="text-center text-[11px] text-espresso/60">Free exchange or return until {fmtDate(result.returnBy)}.</p>
              )}

              <div className="grid grid-cols-3 gap-2 pt-1">
                {waDigits && (
                  <a href={`https://wa.me/91${waDigits}?text=${encodeURIComponent(`Hi, about my order ${result.orderNumber}`)}`} target="_blank" rel="noreferrer" className="flex min-h-[56px] sm:min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-ivory text-[10px] sm:text-[11px] font-semibold text-espresso hover:bg-ivory-dark border border-burgundy/10 transition-colors">
                    <MessageCircle className="h-4 w-4 text-green-700 shrink-0" /> <span>WhatsApp</span>
                  </a>
                )}
                {callDigits.length >= 10 && (
                  <a href={`tel:+91${callDigits.slice(-10)}`} className="flex min-h-[56px] sm:min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-ivory text-[10px] sm:text-[11px] font-semibold text-espresso hover:bg-ivory-dark border border-burgundy/10 transition-colors">
                    <Phone className="h-4 w-4 text-espresso shrink-0" /> <span>Call us</span>
                  </a>
                )}
                <Link href="/returns" className="flex min-h-[56px] sm:min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-ivory text-[10px] sm:text-[11px] font-semibold text-espresso hover:bg-ivory-dark border border-burgundy/10 transition-colors">
                  <RotateCcw className="h-4 w-4 text-crimson shrink-0" /> <span>Exchange</span>
                </Link>
              </div>
            </div>
          </motion.article>
        )}
        {result && sheet === "cancel" && (
          <CancelSheet order={asOrder(result)} email={ownerEmail || undefined} onClose={() => setSheet(null)} onDone={(o) => { setSheet(null); setResult(fromServer(o)); }} />
        )}
        {result && sheet === "return" && (
          <ReturnSheet order={asOrder(result)} email={ownerEmail || undefined} onClose={() => setSheet(null)} onDone={(o) => { setSheet(null); setResult(fromServer(o)); }} />
        )}
      </div>
    </div>
  );
}
