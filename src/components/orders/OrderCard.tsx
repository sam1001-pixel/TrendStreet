"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, Copy, MessageCircle, PackageX, RefreshCw, Truck, XCircle } from "lucide-react";
import { useStore, useStoreConfig } from "@/context/StoreContext";
import { formatPrice } from "@/lib/pricing";
import { ORDER_STEPS, RETURN_REASONS, STATUS_COPY, cancelOrder, orderStep, requestReturn } from "@/lib/order-client";
import type { Order } from "@/types/store";
import { Sheet } from "./Sheet";

const STATUS_STYLE: Record<string, string> = {
  Pending: "bg-gold/20 text-gold-dark",
  Confirmed: "bg-burgundy/10 text-burgundy",
  Processing: "bg-burgundy/10 text-burgundy",
  Shipped: "bg-blue-50 text-blue-800",
  "In Transit": "bg-blue-50 text-blue-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-700",
};

const RETURN_STYLE: Record<string, string> = {
  REQUESTED: "bg-gold/20 text-gold-dark",
  APPROVED: "bg-blue-50 text-blue-800",
  PICKED_UP: "bg-blue-50 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
};

const CANCEL_REASONS = ["Ordered by mistake", "Want a different size", "Want to change the address", "Delivery is taking too long", "Found it cheaper elsewhere", "Other"];

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * One order with its live progress, courier tracking and what the shopper can do next
 * (cancel before dispatch, exchange or return after delivery, get help).
 * `email` is passed on the track-order page, where the shopper isn't signed in.
 */
export function OrderCard({ order, email, onUpdated, defaultOpen = false }: { order: Order; email?: string; onUpdated?: (o: Order) => void; defaultOpen?: boolean }) {
  const config = useStoreConfig();
  const { siteSettings } = useStore();
  const [open, setOpen] = useState(defaultOpen);
  const [sheet, setSheet] = useState<"cancel" | "return" | null>(null);
  const [copied, setCopied] = useState(false);

  const step = orderStep(order.status);
  const cancelled = order.status === "Cancelled";
  const units = order.items.reduce((s, i) => s + i.quantity, 0);
  const tracking = order.trackingNumber && !/assigned/i.test(order.trackingNumber) ? order.trackingNumber : "";
  const live = order.fromAccount || order.cancellable !== undefined;

  const waDigits = config.social.whatsapp || siteSettings.contactInfo?.phone?.replace(/\D/g, "").slice(-10) || "9079199951";
  const helpHref = waDigits
    ? `https://wa.me/91${waDigits}?text=${encodeURIComponent(`Hi OFFVYBE, I need help with order ${order.orderNumber}.`)}`
    : "/contact";

  const copyTracking = async () => {
    try {
      await navigator.clipboard.writeText(tracking);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <article className="overflow-hidden rounded-2xl bg-white ring-1 ring-burgundy/10">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-burgundy">{order.orderNumber}</p>
          <p className="text-[11px] text-espresso/60">
            {fmtDate(order.createdAt)} · {units} {units === 1 ? "item" : "items"} · {formatPrice(order.total)}
          </p>
        </div>
        <span className="flex flex-shrink-0 items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${STATUS_STYLE[order.status] ?? "bg-ivory-dark text-espresso/70"}`}>{order.status}</span>
          <ChevronDown className={`h-4 w-4 text-espresso/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {/* Progress */}
      <div className="px-4 sm:px-5">
        {cancelled ? (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
            <XCircle className="h-4 w-4 flex-shrink-0" /> Cancelled{order.cancelledAt ? ` on ${fmtDate(order.cancelledAt)}` : ""}. Nothing is due on this order.
          </p>
        ) : (
          <>
            <ol className="grid grid-cols-4 gap-1" aria-label="Order progress">
              {ORDER_STEPS.map((label, i) => (
                <li key={label} className="min-w-0">
                  <span className={`block h-1.5 rounded-full ${i <= step ? "bg-burgundy" : "bg-burgundy/10"}`} />
                  <span className={`mt-1 block truncate text-[10px] font-semibold uppercase tracking-wide ${i <= step ? "text-burgundy" : "text-espresso/40"}`}>
                    {i === step && <span className="sr-only">Current step: </span>}
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs font-medium text-espresso/80">
              {STATUS_COPY[order.status]}
              {order.status === "Delivered" && order.deliveredAt ? ` on ${fmtDate(order.deliveredAt)}` : ""}
            </p>
          </>
        )}
      </div>

      {/* Thumbnails (collapsed) / item list (open) */}
      {open ? (
        <ul className="mt-3 divide-y divide-burgundy/10 px-4 sm:px-5">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <span className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-dark">
                {it.image && <Image src={it.image} alt="" fill sizes="48px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-espresso">{it.productName}</span>
                <span className="block text-[11px] text-espresso/60">
                  Size {it.selectedSize} · Qty {it.quantity}
                </span>
              </span>
              <span className="text-sm font-semibold text-espresso">{formatPrice(it.price * it.quantity)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 sm:px-5">
          {order.items.map((it, i) => (
            <span key={i} className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-dark" title={it.productName}>
              {it.image && <Image src={it.image} alt={it.productName} fill sizes="48px" className="object-cover" />}
            </span>
          ))}
        </div>
      )}

      {open && (
        <dl className="mx-4 mt-2 space-y-1 rounded-xl bg-ivory p-3 text-xs sm:mx-5">
          <div className="flex justify-between"><dt className="text-espresso/60">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt><dd>−{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-espresso/60">Delivery</dt><dd>{order.shipping ? formatPrice(order.shipping) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-burgundy/10 pt-1 font-bold"><dt>Total · {order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"}</dt><dd>{formatPrice(order.total)}</dd></div>
          {order.customer?.city && (
            <div className="pt-1 text-espresso/60">
              Delivering to {order.customer.fullName}, {order.customer.city} {order.customer.postalCode}
            </div>
          )}
        </dl>
      )}

      {tracking && !cancelled && (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-burgundy/10 px-3 py-2 sm:mx-5">
          <Truck className="h-4 w-4 flex-shrink-0 text-burgundy" />
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate text-espresso/60">{order.courier || "Courier"} · AWB</p>
            <p className="truncate font-mono font-bold text-espresso">{tracking}</p>
          </div>
          <button type="button" onClick={copyTracking} className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-ivory px-3 text-[11px] font-bold text-burgundy">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {order.returns && order.returns.length > 0 && (
        <ul className="mx-4 mt-3 space-y-2 sm:mx-5">
          {order.returns.map((r) => (
            <li key={r.id} className="rounded-xl bg-ivory p-3 text-xs">
              <p className="flex flex-wrap items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-burgundy" />
                <span className="font-bold text-espresso">{r.kind === "EXCHANGE" ? "Exchange" : "Return"} request</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${RETURN_STYLE[r.status] ?? ""}`}>{r.statusLabel}</span>
              </p>
              <p className="mt-1 text-espresso/60">{r.reason} · {fmtDate(r.createdAt)}</p>
              {r.adminNote && <p className="mt-1 rounded-lg bg-white p-2 text-espresso">OFFVYBE: {r.adminNote}</p>}
            </li>
          ))}
        </ul>
      )}

      {order.returnable && order.returnBy && (
        <p className="mx-4 mt-3 text-[11px] text-espresso/60 sm:mx-5">Exchange or return by {fmtDate(order.returnBy)}.</p>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-burgundy/10 px-4 py-3 sm:px-5">
        {order.returnable && (
          <button type="button" onClick={() => setSheet("return")} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-burgundy px-4 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson sm:flex-none">
            <RefreshCw className="h-4 w-4" /> Exchange / return
          </button>
        )}
        {order.cancellable && (
          <button type="button" onClick={() => setSheet("cancel")} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-bold uppercase tracking-wider text-crimson ring-1 ring-crimson/30 hover:bg-crimson/5 sm:flex-none">
            <PackageX className="h-4 w-4" /> Cancel order
          </button>
        )}
        {!live && !cancelled && (
          <Link href={`/track?order=${encodeURIComponent(order.orderNumber)}`} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-ivory px-4 text-xs font-bold uppercase tracking-wider text-burgundy hover:bg-ivory-dark sm:flex-none">
            <Truck className="h-4 w-4" /> Track
          </Link>
        )}
        <a
          href={helpHref}
          target={helpHref.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-bold uppercase tracking-wider text-espresso/70 ring-1 ring-burgundy/15 hover:text-espresso sm:flex-none"
        >
          <MessageCircle className="h-4 w-4" /> {order.cancelViaSupport ? "Cancel / help" : "Help"}
        </a>
      </div>

      {sheet === "cancel" && <CancelSheet order={order} email={email} onClose={() => setSheet(null)} onDone={(o) => { setSheet(null); onUpdated?.(o); }} />}
      {sheet === "return" && <ReturnSheet order={order} email={email} onClose={() => setSheet(null)} onDone={(o) => { setSheet(null); onUpdated?.(o); }} />}
    </article>
  );
}

export function CancelSheet({ order, email, onClose, onDone }: { order: Order; email?: string; onClose: () => void; onDone: (o: Order) => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await cancelOrder(order.orderNumber, reason, email);
    setBusy(false);
    if (res.ok) onDone({ ...res.order, fromAccount: order.fromAccount });
    else setError(res.error);
  };

  return (
    <Sheet
      title="Cancel this order?"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="min-h-[48px] flex-1 rounded-full text-xs font-bold uppercase tracking-wider text-espresso ring-1 ring-burgundy/20">
            Keep order
          </button>
          <button type="button" onClick={submit} disabled={busy} className="min-h-[48px] flex-1 rounded-full bg-crimson text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60">
            {busy ? "Cancelling…" : "Cancel order"}
          </button>
        </div>
      }
    >
      <p className="text-sm text-espresso/75">
        {order.orderNumber} · {formatPrice(order.total)} cash on delivery. Nothing has been charged, so there&apos;s nothing to refund.
      </p>
      <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-espresso/60">Reason (optional)</p>
      <div className="flex flex-wrap gap-2">
        {CANCEL_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(reason === r ? "" : r)}
            aria-pressed={reason === r}
            className={`min-h-[40px] rounded-full px-3.5 text-xs font-semibold ${reason === r ? "bg-espresso text-ivory" : "bg-white text-espresso ring-1 ring-burgundy/15"}`}
          >
            {r}
          </button>
        ))}
      </div>
      {(reason === "Want a different size" || reason === "Want to change the address") && (
        <p className="mt-3 rounded-xl bg-gold/15 p-3 text-xs text-espresso">Tip: message us instead — we can usually change the size or address before dispatch without cancelling.</p>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-800">{error}</p>}
    </Sheet>
  );
}

export function ReturnSheet({ order, email, onClose, onDone }: { order: Order; email?: string; onClose: () => void; onDone: (o: Order) => void }) {
  const { products } = useStore();
  const [kind, setKind] = useState<"EXCHANGE" | "RETURN">("EXCHANGE");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const lines = order.items.filter((i) => i.orderItemId);
  const [picked, setPicked] = useState<Record<string, { qty: number; size: string }>>(() =>
    lines.length === 1 ? { [lines[0].orderItemId!]: { qty: lines[0].quantity, size: "" } } : {}
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizesFor = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const p of products) map[p.id] = p.sizes;
    return map;
  }, [products]);

  const chosen = Object.entries(picked);
  const ready = chosen.length > 0 && reason && (kind === "RETURN" || chosen.every(([, v]) => v.size));

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await requestReturn({
      orderNumber: order.orderNumber,
      email,
      kind,
      reason,
      note,
      items: chosen.map(([orderItemId, v]) => ({ orderItemId, quantity: v.qty, ...(kind === "EXCHANGE" ? { exchangeSize: v.size } : {}) })),
    });
    setBusy(false);
    if (res.ok) onDone({ ...res.order, fromAccount: order.fromAccount });
    else setError(res.error);
  };

  return (
    <Sheet
      title="Exchange or return"
      onClose={onClose}
      footer={
        <button type="button" onClick={submit} disabled={!ready || busy} className="min-h-[48px] w-full rounded-full bg-burgundy text-xs font-bold uppercase tracking-wider text-ivory disabled:opacity-50">
          {busy ? "Sending…" : kind === "EXCHANGE" ? "Request exchange" : "Request return"}
        </button>
      }
    >
      <div role="radiogroup" aria-label="Request type" className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 ring-1 ring-burgundy/15">
        {(["EXCHANGE", "RETURN"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={`min-h-[40px] rounded-full text-xs font-bold uppercase tracking-wider ${kind === k ? "bg-espresso text-ivory" : "text-espresso/70"}`}
          >
            {k === "EXCHANGE" ? "Exchange size" : "Return"}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-espresso/60">
        {kind === "EXCHANGE"
          ? "Free doorstep pickup. Your new size ships as soon as we collect the old one."
          : order.paymentMethod === "cod"
            ? "Free doorstep pickup. We'll call you for your UPI or bank details to send the refund."
            : "Free doorstep pickup. The refund goes back to your original payment method."}
      </p>

      <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-espresso/60">Which items?</p>
      <ul className="space-y-2">
        {lines.map((it) => {
          const id = it.orderItemId!;
          const sel = picked[id];
          const sizes = (sizesFor[it.productId] ?? []).filter((s) => s !== it.selectedSize);
          return (
            <li key={id} className={`rounded-2xl bg-white p-3 ring-1 ${sel ? "ring-burgundy" : "ring-burgundy/10"}`}>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(sel)}
                  onChange={(e) =>
                    setPicked((p) => {
                      const n = { ...p };
                      if (e.target.checked) n[id] = { qty: it.quantity, size: "" };
                      else delete n[id];
                      return n;
                    })
                  }
                  className="h-5 w-5 flex-shrink-0 accent-burgundy"
                />
                <span className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-dark">
                  {it.image && <Image src={it.image} alt="" fill sizes="44px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-espresso">{it.productName}</span>
                  <span className="block text-[11px] text-espresso/60">Size {it.selectedSize} · Qty {it.quantity}</span>
                </span>
              </label>
              {sel && it.quantity > 1 && (
                <div className="mt-2 flex items-center gap-2 pl-8 text-xs">
                  <span className="text-espresso/60">How many?</span>
                  {Array.from({ length: it.quantity }, (_, i) => i + 1).map((q) => (
                    <button key={q} type="button" onClick={() => setPicked((p) => ({ ...p, [id]: { ...p[id], qty: q } }))} aria-pressed={sel.qty === q} className={`h-9 w-9 rounded-full font-bold ${sel.qty === q ? "bg-espresso text-ivory" : "bg-ivory text-espresso"}`}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {sel && kind === "EXCHANGE" && (
                <div className="mt-2 pl-8">
                  <p className="mb-1.5 text-[11px] font-semibold text-espresso/60">New size</p>
                  {sizes.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sizes.map((s) => (
                        <button key={s} type="button" onClick={() => setPicked((p) => ({ ...p, [id]: { ...p[id], size: s } }))} aria-pressed={sel.size === s} className={`min-h-[40px] min-w-[44px] rounded-lg px-2 text-xs font-bold ${sel.size === s ? "bg-burgundy text-ivory" : "bg-ivory text-espresso ring-1 ring-burgundy/15"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-espresso/60">No other sizes available — choose Return instead.</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-espresso/60">Reason</p>
      <div className="flex flex-wrap gap-2">
        {RETURN_REASONS.map((r) => (
          <button key={r} type="button" onClick={() => setReason(r)} aria-pressed={reason === r} className={`min-h-[40px] rounded-full px-3.5 text-xs font-semibold ${reason === r ? "bg-espresso text-ivory" : "bg-white text-espresso ring-1 ring-burgundy/15"}`}>
            {r}
          </button>
        ))}
      </div>
      <label htmlFor={`note-${order.orderNumber}`} className="mb-1 mt-4 block text-[11px] font-bold uppercase tracking-wider text-espresso/60">
        Anything else? (optional)
      </label>
      <textarea id={`note-${order.orderNumber}`} value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={2} placeholder="e.g. best time for pickup" className="w-full rounded-xl border border-burgundy/20 bg-white p-3 text-sm focus:border-burgundy focus:outline-none" />
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-800">{error}</p>}
    </Sheet>
  );
}
