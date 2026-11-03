/** Product IDs the shopper opened recently, newest first (this browser only). */
const KEY = "ts_recently_viewed";
const MAX = 12;
const EVENT = "ts:recently-viewed";

export function getRecentlyViewed(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function rememberViewed(id: string) {
  try {
    const next = [id, ...getRecentlyViewed().filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Private mode or storage blocked: the row simply stays hidden.
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export const RECENTLY_VIEWED_EVENT = EVENT;
