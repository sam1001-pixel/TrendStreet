/**
 * Maps the database SiteSettings row (the editable CMS fields) to and from the
 * storefront `SiteSettings` shape. Fields without a database column keep their
 * code defaults from StoreContext.
 */
import type { SiteSettings as DbSiteSettings } from "@prisma/client";
import type { SiteSettings } from "@/types/store";
import { safeHref } from "@/lib/safe-redirect";
import { sanitizeStoreConfig, type StoreConfig } from "@/lib/store-config";

export type EditableSettings = {
  storeName?: string;
  storeTagline?: string;
  topAnnouncement?: Partial<SiteSettings["topAnnouncement"]>;
  hero?: Partial<SiteSettings["hero"]>;
  marqueePhrases?: string[];
  contactInfo?: Partial<SiteSettings["contactInfo"]>;
  storefrontSections?: Partial<NonNullable<SiteSettings["storefrontSections"]>>;
  nextDrop?: { at: string | null; title: string };
  config?: StoreConfig;
  categoryTaglines?: SiteSettings["categoryTaglines"];
  offerCoupon?: SiteSettings["offerCoupon"];
};

/** Pages that were removed from the site; saved links to them fall back to the shop. */
const REMOVED_PATHS = ["/lookbook", "/shop-your-way", "/complete-the-fit"];
const liveLink = (href: string) => (REMOVED_PATHS.some((p) => href.startsWith(p)) ? "/shop?sort=newest" : safeHref(href, "/shop"));

export function settingsFromDb(row: DbSiteSettings | null): EditableSettings {
  if (!row) return {};
  return {
    storeName: row.storeName,
    storeTagline: row.storeTagline,
    topAnnouncement: {
      enabled: row.announcementActive,
      ...(row.announcementText ? { text: row.announcementText } : {}),
      ...(row.announcementLink ? { linkUrl: safeHref(row.announcementLink, "/shop") } : {}),
    },
    hero: {
      badgeText: row.heroBadge,
      titleLine1: row.heroTitle1,
      titleLine2: row.heroTitle2,
      subtitle: row.heroSubtitle,
      primaryBtnLink: liveLink(row.heroPrimaryCta),
      secondaryBtnLink: liveLink(row.heroSecondaryCta),
    },
    ...(row.marqueeText.length ? { marqueePhrases: row.marqueeText } : {}),
    contactInfo: { phone: row.conciergePhone, email: row.conciergeEmail },
    ...(row.storefrontSections ? { storefrontSections: row.storefrontSections as any } : {}),
    nextDrop: { at: row.nextDropAt ? row.nextDropAt.toISOString() : null, title: row.nextDropTitle ?? "" },
    config: sanitizeStoreConfig(row.config),
    categoryTaglines: sanitizeStoreConfig(row.config).categoryTaglines,
  };
}

/** Only the fields that have a database column; anything else in `s` is ignored. */
export function settingsToDb(s: Partial<SiteSettings>) {
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 2000) : undefined);
  return {
    storeName: str(s.storeName),
    storeTagline: str(s.storeTagline),
    announcementText: str(s.topAnnouncement?.text),
    announcementLink: s.topAnnouncement?.linkUrl === undefined ? undefined : safeHref(s.topAnnouncement.linkUrl, "/shop"),
    announcementActive: typeof s.topAnnouncement?.enabled === "boolean" ? s.topAnnouncement.enabled : undefined,
    heroBadge: str(s.config?.hero?.badgeText || s.hero?.badgeText),
    heroTitle1: str(s.hero?.titleLine1),
    heroTitle2: str(s.hero?.titleLine2),
    heroSubtitle: str(s.hero?.subtitle),
    heroPrimaryCta: s.hero?.primaryBtnLink === undefined ? undefined : safeHref(s.hero.primaryBtnLink, "/shop"),
    heroSecondaryCta: s.hero?.secondaryBtnLink === undefined ? undefined : safeHref(s.hero.secondaryBtnLink, "/shop?sort=newest"),
    marqueeText: Array.isArray(s.marqueePhrases) ? s.marqueePhrases.filter((p) => typeof p === "string").slice(0, 30) : undefined,
    conciergePhone: str(s.contactInfo?.phone),
    conciergeEmail: str(s.contactInfo?.email),
    storefrontSections: s.storefrontSections ? JSON.parse(JSON.stringify(s.storefrontSections)) : undefined,
    ...nextDropToDb(s.nextDrop),
    // Always stored cleaned, so a bad value can never break checkout.
    // Category taglines are edited in their own admin tab but stored inside the config.
    config:
      s.config === undefined
        ? undefined
        : (sanitizeStoreConfig({ ...s.config, categoryTaglines: s.categoryTaglines ?? s.config.categoryTaglines }) as unknown as object),
  };
}

/** Empty date clears the countdown; an unreadable one is ignored. */
function nextDropToDb(d: SiteSettings["nextDrop"]): { nextDropAt?: Date | null; nextDropTitle?: string | null } {
  if (!d) return {};
  const title = typeof d.title === "string" ? d.title.slice(0, 120) : undefined;
  if (!d.at) return { nextDropAt: null, nextDropTitle: title ?? null };
  const at = new Date(d.at);
  return Number.isNaN(at.getTime()) ? { nextDropTitle: title } : { nextDropAt: at, nextDropTitle: title ?? null };
}
