/**
 * The one public URL of the shop. Set NEXT_PUBLIC_SITE_URL in each environment.
 * The default is the domain used by the shop's email and contact details.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://offvybe.in").replace(/\/+$/, "");

export const SITE_NAME = "OFFVYBE";
