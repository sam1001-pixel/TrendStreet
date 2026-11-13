/**
 * Store settings the owner changes from Admin → Settings (delivery charges, cash on delivery,
 * offers, the ₹499 banner, social links, trust badges, …).
 *
 * Saved as one JSON value in the database. Everything that comes in or goes out passes through
 * `sanitizeStoreConfig`, so a bad or partial value can never break checkout: unknown keys are
 * dropped, numbers are clamped to sensible ranges, links must be https, and anything missing
 * falls back to the defaults below. Pure module — safe on the server and in the browser.
 */

import { safeHref } from "@/lib/safe-redirect";

export interface HeroLook {
  key: string;
  line: string;
  href: string;
  image: string;
}

export interface SilhouettePanel {
  no: string;
  name: string;
  href: string;
  shortTag: string;
  copy: string;
  image: string;
}

export interface StoreConfig {
  shipping: {
    /** Free delivery when the bag (after discount) reaches this many rupees. 0 = always free. */
    freeOver: number;
    standard: number;
    express: number;
    expressEnabled: boolean;
    standardDays: string;
    expressDays: string;
  };
  cod: {
    enabled: boolean;
    /** Most pieces in one cash-on-delivery order. */
    maxPieces: number;
    /** Unconfirmed COD orders one customer (email or phone) may have in 24 hours. */
    maxOpenPerCustomer: number;
  };
  pricing: {
    /** Show the struck-through MRP and "−50%" badges. */
    showMrp: boolean;
  };
  priceBanner: {
    eyebrow: string;
    /** Word above the big price, e.g. "Everything". */
    headline: string;
    cta: string;
    note1: string;
    note2: string;
  };
  offer: {
    /** Show the offer on product pages (uses the coupon's real % and minimum from Admin → Discounts). */
    enabled: boolean;
    code: string;
    /** Codes offered as one-tap chips in the bag. */
    bagCodes: string[];
    /** Code shown after newsletter sign-up ("" hides it). */
    newsletterCode: string;
  };
  social: {
    instagram: string;
    facebook: string;
    x: string;
    youtube: string;
    /** 10-digit WhatsApp number for the chat button, or "". */
    whatsapp: string;
  };
  trust: { title: string; note: string }[];
  /** Line under each category title on its landing page. */
  categoryTaglines: Record<"Oversized" | "Jeans" | "Boxy Fit" | "Jackets", string>;
  /** Hero presentation details including rotating looks, images, copy, and kinetic typography. */
  hero: {
    badgeText: string;
    wordmark: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    looks: HeroLook[];
  };
  /** Architectural Silhouettes / Four Cuts section on the homepage. */
  silhouettes: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    panels: SilhouettePanel[];
  };
}

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  shipping: {
    freeOver: 1999,
    standard: 150,
    express: 250,
    expressEnabled: true,
    standardDays: "4–5 business days",
    expressDays: "2–3 business days",
  },
  cod: { enabled: true, maxPieces: 6, maxOpenPerCustomer: 2 },
  pricing: { showMrp: true },
  priceBanner: {
    eyebrow: "One price. Every fit.",
    headline: "Everything",
    cta: "Shop all {count} styles",
    note1: "Free delivery over {freeOver}",
    note2: "Cash on delivery available",
  },
  offer: { enabled: true, code: "TREND10", bagCodes: ["TREND10", "STREET20"], newsletterCode: "TREND10" },
  social: { instagram: "", facebook: "", x: "", youtube: "", whatsapp: "9079199951" },
  trust: [
    { title: "Free delivery", note: "On orders over {freeOver}" },
    { title: "30-day exchange", note: "Doorstep pickup" },
    { title: "Cash on delivery", note: "Serviceable PIN codes" },
    { title: "Secure checkout", note: "UPI · cards · net banking" },
  ],
  categoryTaglines: {
    Oversized: "Heavyweight tees & hoodies",
    Jeans: "Baggy, carpenter & straight denim",
    "Boxy Fit": "Cropped, wide-body shirts & knits",
    Jackets: "Bombers, chores & shells",
  },
  hero: {
    badgeText: "Drop 04 — live now",
    wordmark: "OFFVYBE",
    secondaryCtaText: "Shop all",
    secondaryCtaLink: "/shop",
    looks: [
      {
        key: "Oversized",
        href: "/oversized",
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2000&auto=format&fit=crop",
        line: "240–350gsm loopback. Built to hang, not cling.",
      },
      {
        key: "Boxy Fit",
        href: "/boxy-fit",
        image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2000&auto=format&fit=crop",
        line: "Cropped hem, wide body, 3cm collar.",
      },
      {
        key: "Jackets",
        href: "/jackets",
        image: "https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=2000&auto=format&fit=crop",
        line: "Suede bombers and duck canvas chore cuts.",
      },
    ],
  },
  silhouettes: {
    eyebrow: "Architectural Foundations",
    titleLine1: "Four cuts.",
    titleLine2: "Nothing else.",
    subtitle: "No suits, no formal shoes. Every piece belongs to one of four silhouettes.",
    panels: [
      {
        name: "Oversized",
        href: "/oversized",
        no: "01",
        shortTag: "240–350gsm Loopback Hoodies & Dropped Tees",
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1400&auto=format&fit=crop",
        copy: "Heavyweight loopback hoodies and 240–350gsm drop-shoulder tees engineered with relaxed architectural drape.",
      },
      {
        name: "Jeans",
        href: "/shop?category=Jeans",
        no: "02",
        shortTag: "Baggy, Carpenter & Selvedge Denim",
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1400&auto=format&fit=crop",
        copy: "Relaxed baggy and carpenter cuts in heavyweight denim, made to stack and wear in over years.",
      },
      {
        name: "Boxy Fit",
        href: "/boxy-fit",
        no: "03",
        shortTag: "Cropped Waist & Wide-Body Knits",
        image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1400&auto=format&fit=crop",
        copy: "Cropped, wide-body knits and structured flannel overshirts that sit precisely at the natural beltline.",
      },
      {
        name: "Jackets",
        href: "/jackets",
        no: "04",
        shortTag: "Handcrafted Flight Bombers & Shells",
        image: "https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1400&auto=format&fit=crop",
        copy: "Suede flight bombers, Melton overcoats, and Japanese duck canvas chores built for generational longevity.",
      },
    ],
  },
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, fallback: string, max = 120) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const int = (v: unknown, fallback: number, min: number, max: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const code = (v: unknown, fallback: string) => {
  if (typeof v !== "string") return fallback;
  const c = v.trim().toUpperCase();
  return c === "" || /^[A-Z0-9_-]{3,32}$/.test(c) ? c : fallback;
};
const https = (v: unknown) => {
  if (typeof v !== "string") return "";
  const u = v.trim();
  return /^https:\/\/[^\s"'<>]{3,300}$/i.test(u) ? u : "";
};
const mediaUrl = (v: unknown, fallback: string) => {
  if (typeof v !== "string") return fallback;
  const u = v.trim();
  if (/^https?:\/\/[^\s"'<>]{3,800}$/i.test(u) || /^\/[^\s"'<>]{1,800}$/.test(u)) return u;
  return fallback;
};
const phone = (v: unknown, fallback = "") => {
  if (v === undefined || v === null) return fallback;
  if (typeof v !== "string") return fallback;
  const d = v.replace(/\D/g, "").replace(/^(91|0)(?=[6-9]\d{9}$)/, "");
  return /^[6-9]\d{9}$/.test(d) ? d : "";
};

/** Cleans any stored or submitted value into a complete, safe StoreConfig. */
export function sanitizeStoreConfig(raw: unknown): StoreConfig {
  const d = DEFAULT_STORE_CONFIG;
  const r = isObj(raw) ? raw : {};
  const sh = isObj(r.shipping) ? r.shipping : {};
  const cod = isObj(r.cod) ? r.cod : {};
  const pr = isObj(r.pricing) ? r.pricing : {};
  const pb = isObj(r.priceBanner) ? r.priceBanner : {};
  const of = isObj(r.offer) ? r.offer : {};
  const so = isObj(r.social) ? r.social : {};
  const trustIn = Array.isArray(r.trust) ? r.trust : d.trust;

  return {
    shipping: {
      freeOver: int(sh.freeOver, d.shipping.freeOver, 0, 100000),
      standard: int(sh.standard, d.shipping.standard, 0, 5000),
      express: int(sh.express, d.shipping.express, 0, 5000),
      expressEnabled: bool(sh.expressEnabled, d.shipping.expressEnabled),
      standardDays: str(sh.standardDays, d.shipping.standardDays, 40) || d.shipping.standardDays,
      expressDays: str(sh.expressDays, d.shipping.expressDays, 40) || d.shipping.expressDays,
    },
    cod: {
      enabled: bool(cod.enabled, d.cod.enabled),
      maxPieces: int(cod.maxPieces, d.cod.maxPieces, 1, 50),
      maxOpenPerCustomer: int(cod.maxOpenPerCustomer, d.cod.maxOpenPerCustomer, 1, 20),
    },
    pricing: { showMrp: bool(pr.showMrp, d.pricing.showMrp) },
    priceBanner: {
      eyebrow: str(pb.eyebrow, d.priceBanner.eyebrow, 60),
      headline: str(pb.headline, d.priceBanner.headline, 30),
      cta: str(pb.cta, d.priceBanner.cta, 40) || d.priceBanner.cta,
      note1: str(pb.note1, d.priceBanner.note1, 60),
      note2: str(pb.note2, d.priceBanner.note2, 60),
    },
    offer: {
      enabled: bool(of.enabled, d.offer.enabled),
      code: code(of.code, d.offer.code),
      bagCodes: (Array.isArray(of.bagCodes) ? of.bagCodes : d.offer.bagCodes)
        .map((c) => code(c, ""))
        .filter(Boolean)
        .slice(0, 4),
      newsletterCode: code(of.newsletterCode, d.offer.newsletterCode),
    },
    social: {
      instagram: https(so.instagram),
      facebook: https(so.facebook),
      x: https(so.x),
      youtube: https(so.youtube),
      whatsapp: phone(so.whatsapp, d.social.whatsapp),
    },
    trust: d.trust.map((def, i) => {
      const t = isObj(trustIn[i]) ? (trustIn[i] as Record<string, unknown>) : {};
      return { title: str(t.title, def.title, 40) || def.title, note: str(t.note, def.note, 60) };
    }),
    categoryTaglines: (() => {
      const ct = isObj(r.categoryTaglines) ? r.categoryTaglines : {};
      const out = { ...d.categoryTaglines };
      for (const k of Object.keys(out) as (keyof typeof out)[]) out[k] = str(ct[k], d.categoryTaglines[k], 80) || d.categoryTaglines[k];
      return out;
    })(),
    hero: (() => {
      const hr = isObj(r.hero) ? (r.hero as Record<string, unknown>) : {};
      const looksIn = Array.isArray(hr.looks) ? hr.looks : d.hero.looks;
      const cleanLooks: HeroLook[] = looksIn
        .filter(isObj)
        .slice(0, 10)
        .map((l: any, i: number) => {
          const def = d.hero.looks[i] || d.hero.looks[0];
          return {
            key: str(l.key, def.key, 40) || def.key,
            line: str(l.line, def.line, 140) || def.line,
            href: safeHref(l.href, def.href),
            image: mediaUrl(l.image, def.image),
          };
        });

      return {
        badgeText: str(hr.badgeText, d.hero.badgeText, 60),
        wordmark: str(hr.wordmark, d.hero.wordmark, 20).toUpperCase() || d.hero.wordmark,
        secondaryCtaText: str(hr.secondaryCtaText, d.hero.secondaryCtaText, 30) || d.hero.secondaryCtaText,
        secondaryCtaLink: safeHref(hr.secondaryCtaLink, d.hero.secondaryCtaLink),
        looks: cleanLooks.length ? cleanLooks : d.hero.looks,
      };
    })(),
    silhouettes: (() => {
      const sil = isObj(r.silhouettes) ? (r.silhouettes as Record<string, unknown>) : {};
      const panelsIn = Array.isArray(sil.panels) ? sil.panels : d.silhouettes.panels;
      const cleanPanels: SilhouettePanel[] = panelsIn
        .filter(isObj)
        .slice(0, 8)
        .map((p: any, i: number) => {
          const def = d.silhouettes.panels[i] || d.silhouettes.panels[0];
          return {
            no: str(p.no, def.no, 6) || def.no,
            name: str(p.name, def.name, 40) || def.name,
            href: safeHref(p.href, def.href),
            shortTag: str(p.shortTag, def.shortTag, 100) || def.shortTag,
            copy: str(p.copy, def.copy, 300) || def.copy,
            image: mediaUrl(p.image, def.image),
          };
        });

      return {
        eyebrow: str(sil.eyebrow, d.silhouettes.eyebrow, 60) || d.silhouettes.eyebrow,
        titleLine1: str(sil.titleLine1, d.silhouettes.titleLine1, 50) || d.silhouettes.titleLine1,
        titleLine2: str(sil.titleLine2, d.silhouettes.titleLine2, 50) || d.silhouettes.titleLine2,
        subtitle: str(sil.subtitle, d.silhouettes.subtitle, 250) || d.silhouettes.subtitle,
        panels: cleanPanels.length ? cleanPanels : d.silhouettes.panels,
      };
    })(),
  };
}

/** Rupees → "₹1,999". */
export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Fills {freeOver} and {count} placeholders in admin-written text. */
export function fillText(template: string, cfg: StoreConfig, extra: Record<string, string | number> = {}) {
  return template
    .replace(/\{freeOver\}/g, rupees(cfg.shipping.freeOver))
    .replace(/\{(\w+)\}/g, (m, k) => (k in extra ? String(extra[k]) : m));
}

/** Shipping rules in paise for the pricing engine. */
export function shippingRulesFromConfig(cfg: StoreConfig) {
  return {
    freeOverMinor: cfg.shipping.freeOver * 100,
    ratesMinor: {
      standard: cfg.shipping.standard * 100,
      express: cfg.shipping.express * 100,
      vip_courier: cfg.shipping.express * 100,
    },
  };
}
