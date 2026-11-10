/**
 * Only lets redirects go to a page on this site.
 * Blocks `javascript:` / `data:` URLs (which would run code on our domain) and links to other
 * websites (a phishing trick: "sign in" then land on a fake page). Anything else → `fallback`.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/profile"): string {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim();
  // Must be a same-site path: "/something", never "//host", "/\host" or a scheme.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value) || value.length > 512) return fallback;
  try {
    const url = new URL(value, "https://trendstreet.invalid");
    if (url.origin !== "https://trendstreet.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

/** For links an admin types into the CMS (announcement bar, hero buttons): site paths or https only. */
export function safeHref(raw: unknown, fallback = "/shop"): string {
  if (typeof raw !== "string") return fallback;
  const v = raw.trim();
  if (!v) return ""; // an empty field means "no link"
  if (v.startsWith("/")) return safeRedirectPath(v, fallback);
  return /^https:\/\/[^\s]+$/i.test(v) ? v : fallback;
}
