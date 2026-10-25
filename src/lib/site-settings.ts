/**
 * Maps the database SiteSettings row (the editable CMS fields) to and from the
 * storefront `SiteSettings` shape. Fields without a database column keep their
 * code defaults from StoreContext.
 */
import type { SiteSettings as DbSiteSettings } from "@prisma/client";
import type { SiteSettings } from "@/types/store";

export type EditableSettings = {
  storeName?: string;
  storeTagline?: string;
  topAnnouncement?: Partial<SiteSettings["topAnnouncement"]>;
  hero?: Partial<SiteSettings["hero"]>;
  marqueePhrases?: string[];
  contactInfo?: Partial<SiteSettings["contactInfo"]>;
  storefrontSections?: Partial<NonNullable<SiteSettings["storefrontSections"]>>;
};

export function settingsFromDb(row: DbSiteSettings | null): EditableSettings {
  if (!row) return {};
  return {
    storeName: row.storeName,
    storeTagline: row.storeTagline,
    topAnnouncement: {
      enabled: row.announcementActive,
      ...(row.announcementText ? { text: row.announcementText } : {}),
      ...(row.announcementLink ? { linkUrl: row.announcementLink } : {}),
    },
    hero: {
      badgeText: row.heroBadge,
      titleLine1: row.heroTitle1,
      titleLine2: row.heroTitle2,
      subtitle: row.heroSubtitle,
      primaryBtnLink: row.heroPrimaryCta,
      secondaryBtnLink: row.heroSecondaryCta,
    },
    ...(row.marqueeText.length ? { marqueePhrases: row.marqueeText } : {}),
    contactInfo: { phone: row.conciergePhone, email: row.conciergeEmail },
    ...(row.storefrontSections ? { storefrontSections: row.storefrontSections as any } : {}),
  };
}

/** Only the fields that have a database column; anything else in `s` is ignored. */
export function settingsToDb(s: Partial<SiteSettings>) {
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 2000) : undefined);
  return {
    storeName: str(s.storeName),
    storeTagline: str(s.storeTagline),
    announcementText: str(s.topAnnouncement?.text),
    announcementLink: str(s.topAnnouncement?.linkUrl),
    announcementActive: typeof s.topAnnouncement?.enabled === "boolean" ? s.topAnnouncement.enabled : undefined,
    heroBadge: str(s.hero?.badgeText),
    heroTitle1: str(s.hero?.titleLine1),
    heroTitle2: str(s.hero?.titleLine2),
    heroSubtitle: str(s.hero?.subtitle),
    heroPrimaryCta: str(s.hero?.primaryBtnLink),
    heroSecondaryCta: str(s.hero?.secondaryBtnLink),
    marqueeText: Array.isArray(s.marqueePhrases) ? s.marqueePhrases.filter((p) => typeof p === "string").slice(0, 30) : undefined,
    conciergePhone: str(s.contactInfo?.phone),
    conciergeEmail: str(s.contactInfo?.email),
    storefrontSections: s.storefrontSections ? JSON.parse(JSON.stringify(s.storefrontSections)) : undefined,
  };
}
