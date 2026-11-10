"use client";

import React, { useState } from "react";
import { Loader2, Truck, Wallet, Percent, Share2, ShieldCheck, Tag, AlertTriangle } from "lucide-react";
import { DEFAULT_STORE_CONFIG, fillText, rupees, type StoreConfig } from "@/lib/store-config";

/**
 * Admin panels for the store settings in src/lib/store-config.ts.
 * They only edit the form; the Settings page's Save button publishes everything at once.
 */

type Props = { config: StoreConfig; onChange: (next: StoreConfig) => void };

const box = "bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-5";
const label = "block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1";
const input = "w-full px-3.5 py-2.5 text-sm bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none";
const help = "mt-1 text-[11px] text-espresso/60";

function Header({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-burgundy/10 pb-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-burgundy text-gold">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="font-serif text-lg font-bold text-espresso">{title}</h2>
        <p className="text-xs text-espresso/70">{text}</p>
      </div>
    </div>
  );
}

function Num({ id, value, onChange, min = 0, max = 100000, prefix = "₹" }: { id: string; value: number; onChange: (n: number) => void; min?: number; max?: number; prefix?: string }) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-espresso/60">{prefix}</span>}
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Math.round(Number(e.target.value) || 0))))}
        className={`${input} ${prefix ? "pl-7" : ""}`}
      />
    </div>
  );
}

function Toggle({ checked, onChange, title, text }: { checked: boolean; onChange: (v: boolean) => void; title: string; text?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-burgundy/15 bg-ivory/60 p-4">
      <span>
        <span className="block text-sm font-semibold text-espresso">{title}</span>
        {text && <span className="mt-0.5 block text-xs text-espresso/70">{text}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 flex-shrink-0 accent-burgundy" />
    </label>
  );
}

/* ---------------------------------------------------------------- Delivery & COD */
export function DeliveryPanel({ config, onChange }: Props) {
  const sh = config.shipping;
  const set = (patch: Partial<StoreConfig["shipping"]>) => onChange({ ...config, shipping: { ...sh, ...patch } });
  const setCod = (patch: Partial<StoreConfig["cod"]>) => onChange({ ...config, cod: { ...config.cod, ...patch } });
  return (
    <div className="space-y-6">
      <div className={box}>
        <Header icon={Truck} title="Delivery charges" text="Used by the bag, checkout and the server that charges the customer — they always match." />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="cfg-free" className={label}>Free delivery over</label>
            <Num id="cfg-free" value={sh.freeOver} onChange={(n) => set({ freeOver: n })} />
            <p className={help}>Bag total after discount. 0 = always free.</p>
          </div>
          <div>
            <label htmlFor="cfg-std" className={label}>Standard delivery</label>
            <Num id="cfg-std" value={sh.standard} onChange={(n) => set({ standard: n })} max={5000} />
          </div>
          <div>
            <label htmlFor="cfg-exp" className={label}>Express delivery</label>
            <Num id="cfg-exp" value={sh.express} onChange={(n) => set({ express: n })} max={5000} />
          </div>
          <div>
            <label htmlFor="cfg-std-days" className={label}>Standard takes</label>
            <input id="cfg-std-days" className={input} maxLength={40} value={sh.standardDays} onChange={(e) => set({ standardDays: e.target.value })} />
          </div>
          <div>
            <label htmlFor="cfg-exp-days" className={label}>Express takes</label>
            <input id="cfg-exp-days" className={input} maxLength={40} value={sh.expressDays} onChange={(e) => set({ expressDays: e.target.value })} />
          </div>
        </div>
        <Toggle checked={sh.expressEnabled} onChange={(v) => set({ expressEnabled: v })} title="Offer express delivery" text="Turn off to show only standard delivery at checkout." />
        <p className="rounded-xl bg-ivory p-3 text-xs text-espresso/80">
          Example: a {rupees(499)} tee costs {rupees(499 + (sh.freeOver > 0 && 499 >= sh.freeOver ? 0 : sh.standard))} with standard delivery
          {sh.freeOver > 0 ? `; bags of ${rupees(sh.freeOver)}+ ship free.` : "; every order ships free."}
        </p>
      </div>

      <div className={box}>
        <Header icon={Wallet} title="Cash on delivery" text="COD holds stock without payment, so these limits stop fake orders emptying the shop." />
        <Toggle checked={config.cod.enabled} onChange={(v) => setCod({ enabled: v })} title="Accept cash on delivery" text="Off = checkout only shows online payment (UPI, cards, net banking)." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cfg-cod-pieces" className={label}>Most pieces per COD order</label>
            <Num id="cfg-cod-pieces" value={config.cod.maxPieces} onChange={(n) => setCod({ maxPieces: n })} min={1} max={50} prefix="" />
          </div>
          <div>
            <label htmlFor="cfg-cod-open" className={label}>Unconfirmed COD orders per customer (24 h)</label>
            <Num id="cfg-cod-open" value={config.cod.maxOpenPerCustomer} onChange={(n) => setCod({ maxOpenPerCustomer: n })} min={1} max={20} prefix="" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Price & ₹499 banner */
export function PricingPanel({ config, onChange }: Props) {
  const pb = config.priceBanner;
  const set = (patch: Partial<StoreConfig["priceBanner"]>) => onChange({ ...config, priceBanner: { ...pb, ...patch } });
  const [price, setPrice] = useState(499);
  const [mrp, setMrp] = useState(999);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const applyPrice = async () => {
    if (!window.confirm(`Set EVERY product to ${rupees(price)}${mrp > price ? ` (MRP ${rupees(mrp)})` : " with no MRP"}? This changes live prices straight away.`)) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price, mrp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update prices.");
      setResult({ ok: true, text: `Done — ${data.updated} products are now ${rupees(data.price)}${data.mrp ? ` (MRP ${rupees(data.mrp)})` : ""}.` });
    } catch (err) {
      setResult({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={box}>
        <Header icon={Tag} title="One price for every product" text="Changes the price of all products at once (applies immediately, no Save needed)." />
        <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
          <div>
            <label htmlFor="bulk-price" className={label}>Selling price</label>
            <Num id="bulk-price" value={price} onChange={setPrice} min={1} />
          </div>
          <div>
            <label htmlFor="bulk-mrp" className={label}>MRP (struck through)</label>
            <Num id="bulk-mrp" value={mrp} onChange={setMrp} max={200000} />
            <p className={help}>Must be your real printed MRP. 0 = no MRP.</p>
          </div>
          <button
            type="button"
            onClick={applyPrice}
            disabled={busy}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-espresso px-4 text-xs font-bold uppercase tracking-wider text-ivory disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Apply to all products
          </button>
        </div>
        {result && <p className={`rounded-xl p-3 text-sm font-semibold ${result.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{result.text}</p>}
        <p className="flex items-start gap-2 text-xs text-espresso/70">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" /> To price one product differently, edit it in Products.
        </p>
        <Toggle
          checked={config.pricing.showMrp}
          onChange={(v) => onChange({ ...config, pricing: { showMrp: v } })}
          title="Show MRP and “% off” badges"
          text="Off = only the selling price shows everywhere on the site."
        />
      </div>

      <div className={box}>
        <Header icon={Percent} title="The big price banner" text="The black “Everything ₹499” block on the homepage. Turn it on/off in Storefront Sections." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pb-eyebrow" className={label}>Small line on top</label>
            <input id="pb-eyebrow" className={input} maxLength={60} value={pb.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pb-headline" className={label}>Word above the price</label>
            <input id="pb-headline" className={input} maxLength={30} value={pb.headline} onChange={(e) => set({ headline: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pb-note1" className={label}>Point 1</label>
            <input id="pb-note1" className={input} maxLength={60} value={pb.note1} onChange={(e) => set({ note1: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pb-note2" className={label}>Point 2</label>
            <input id="pb-note2" className={input} maxLength={60} value={pb.note2} onChange={(e) => set({ note2: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pb-cta" className={label}>Button text</label>
            <input id="pb-cta" className={input} maxLength={40} value={pb.cta} onChange={(e) => set({ cta: e.target.value })} />
            <p className={help}>
              <code>{"{count}"}</code> = number of styles, <code>{"{freeOver}"}</code> = free-delivery amount. Preview: &ldquo;{fillText(pb.cta, config, { count: 24 })}&rdquo; ·
              &ldquo;{fillText(pb.note1, config)}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Offers */
export function OffersPanel({ config, onChange }: Props) {
  const of = config.offer;
  const set = (patch: Partial<StoreConfig["offer"]>) => onChange({ ...config, offer: { ...of, ...patch } });
  const cleanCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
  return (
    <div className={box}>
      <Header icon={Percent} title="Offers" text="Which coupon you advertise. Create codes and set their % / minimum / limits in Discounts & Coupons." />
      <Toggle checked={of.enabled} onChange={(v) => set({ enabled: v })} title="Show the offer on product pages" text="Shows “Get it for ₹X with CODE” using the coupon's real % and minimum spend." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="of-code" className={label}>Product page offer code</label>
          <input id="of-code" className={`${input} font-mono uppercase`} value={of.code} onChange={(e) => set({ code: cleanCode(e.target.value) })} />
          <p className={help}>Hidden automatically if the code is paused, expired or used up.</p>
        </div>
        <div>
          <label htmlFor="of-news" className={label}>Code shown after newsletter sign-up</label>
          <input id="of-news" className={`${input} font-mono uppercase`} value={of.newsletterCode} onChange={(e) => set({ newsletterCode: cleanCode(e.target.value) })} />
          <p className={help}>Leave empty to show no code.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="of-bag" className={label}>One-tap codes in the bag (comma separated, up to 4)</label>
          <input
            id="of-bag"
            className={`${input} font-mono uppercase`}
            value={of.bagCodes.join(", ")}
            onChange={(e) => set({ bagCodes: e.target.value.split(",").map((c) => cleanCode(c)).filter(Boolean).slice(0, 4) })}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Social */
export function SocialPanel({ config, onChange }: Props) {
  const so = config.social;
  const set = (patch: Partial<StoreConfig["social"]>) => onChange({ ...config, social: { ...so, ...patch } });
  const fields: [keyof StoreConfig["social"], string, string][] = [
    ["instagram", "Instagram", "https://instagram.com/trendstreet"],
    ["facebook", "Facebook", "https://facebook.com/trendstreet"],
    ["x", "X / Twitter", "https://x.com/trendstreet"],
    ["youtube", "YouTube", "https://youtube.com/@trendstreet"],
  ];
  return (
    <div className={box}>
      <Header icon={Share2} title="Social media & WhatsApp" text="Icons appear in the footer only for the links you fill in. Links must start with https://" />
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([k, name, ph]) => (
          <div key={k}>
            <label htmlFor={`so-${k}`} className={label}>{name}</label>
            <input id={`so-${k}`} type="url" inputMode="url" placeholder={ph} className={input} value={so[k]} onChange={(e) => set({ [k]: e.target.value.trim() } as Partial<StoreConfig["social"]>)} />
          </div>
        ))}
        <div>
          <label htmlFor="so-wa" className={label}>WhatsApp number</label>
          <input id="so-wa" type="tel" inputMode="tel" placeholder="98765 43210" className={input} value={so.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.replace(/[^\d+ ]/g, "").slice(0, 16) })} />
          <p className={help}>10-digit Indian mobile. Used for the footer icon and the track-order chat button.</p>
        </div>
      </div>
      <p className={help}>Invalid links are dropped when you save.</p>
    </div>
  );
}

/* ---------------------------------------------------------------- Trust badges */
export function TrustPanel({ config, onChange }: Props) {
  const setItem = (i: number, patch: Partial<{ title: string; note: string }>) =>
    onChange({ ...config, trust: config.trust.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const icons = ["Truck", "Exchange", "Cash", "Shield"];
  return (
    <div className={box}>
      <Header icon={ShieldCheck} title="Trust badges" text="The four promises on the homepage and in the footer. {freeOver} becomes the free-delivery amount." />
      <div className="space-y-3">
        {config.trust.map((t, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-burgundy/10 p-3 sm:grid-cols-[90px_1fr_1fr] sm:items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-espresso/60">{icons[i]} icon</span>
            <input aria-label={`Badge ${i + 1} title`} className={input} maxLength={40} value={t.title} onChange={(e) => setItem(i, { title: e.target.value })} />
            <input aria-label={`Badge ${i + 1} note`} className={input} maxLength={60} value={t.note} onChange={(e) => setItem(i, { note: e.target.value })} />
          </div>
        ))}
      </div>
      <p className={help}>The cash-on-delivery badge hides itself while COD is switched off.</p>
      <button type="button" onClick={() => onChange({ ...config, trust: DEFAULT_STORE_CONFIG.trust })} className="text-xs font-semibold text-burgundy underline">
        Restore default badges
      </button>
    </div>
  );
}
