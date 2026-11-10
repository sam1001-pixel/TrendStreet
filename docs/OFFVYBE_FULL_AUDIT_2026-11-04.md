# OFFVYBE — Full Site Audit (4 Nov 2026)

> **For ChatGPT (or any reviewer):** This is an independent audit of the OFFVYBE storefront codebase. Every finding has an ID, a severity, the file and line, what's wrong, and a suggested fix. Section 9 has instructions for working through it. Section 7 lists things that are **already done well**. Leave those alone.

---

## 1. Project snapshot

| Item | Value |
|---|---|
| Brand / domain | OFFVYBE (`offvybe.in`), Indian streetwear. Formerly "Trend Street" (old name still in some code) |
| Catalogue | 24 products in 4 categories: Oversized, Boxy Fit, Jackets, Jeans. All priced at a flat ₹499 (MRP ₹999) |
| Stack | Next.js **14.2.35** App Router, React 18.3, TypeScript, Tailwind 3.4, Prisma 6.19 + PostgreSQL, framer-motion, Lenis |
| Payments | Razorpay (UPI / card / net banking) and Cash on Delivery |
| Hosting | Vercel (one daily cron in `vercel.json`) and Vercel Blob for admin uploads |
| Key folders | `src/app` (pages + `api/`), `src/components`, `src/context/StoreContext.tsx` (global client state), `src/lib` (orders, pricing, auth, catalog) |

## 2. How this audit was done (and its limits)

**Done:**
- Read all API routes, middleware, auth, the order, payment and coupon logic, the storefront components and the main pages.
- Ran the site locally and swept 20 pages at phone sizes (320 px iPhone SE and 390 px iPhone 12) with an automated browser. The sweep checked:
  - horizontal overflow and overlapping layers
  - tap-target size and text under 11 px
  - h1 headings, input labels, duplicate ids, titles and canonicals
  - console errors
- Ran `npm audit --omit=dev`, ESLint (`next lint`), and colour-contrast maths on the brand palette.

**Not done:**
- No real database (the code's built-in catalogue fallback was used).
- No real product photos, since the sandbox couldn't reach Unsplash.
- No production build, Lighthouse run or real-device test.
- The admin panel UI was code-reviewed only, not clicked through.
- The 51 unit tests were not re-run here.

Treat performance notes as code-based, not measured.

## 3. Scorecard

| Area | Grade | One-line verdict |
|---|---|---|
| Security (app code) | **A-** | Server-side pricing, signed sessions, CSRF guard, atomic stock. Solid |
| Security (dependencies) | **D** | Next.js 14.2.35 has critical/high advisories. Upgrade needed |
| Payments & orders | **B+** | Correct and idempotent. Background jobs and stock release need hardening |
| Mobile UI/UX | **B** | No overflow at 320 px. Home page is very long and repetitive, and Jeans is a second-class category |
| Accessibility | **C+** | Unlinked form labels, the red accent fails contrast for small text, some h1s have glued words |
| SEO | **B-** | Good titles and product schema. Jeans has no landing page, several pages lack canonicals, product URLs are IDs |
| Trust / legal content | **C** | Placeholder-looking phone hard-coded in 6+ places, and no legal entity or GSTIN shown |
| Code health | **C+** | ~12 unused components, 4 dead pages, an unused 3D library, 1,100-line files, confusing colour token names |

---

## 4. Already fixed today (4 Nov 2026), for context

| Fix | Files |
|---|---|
| Product cards' heart and "+" buttons drew on top of the sticky filter bar on Oversized / Boxy Fit / Jackets. Cards now keep their own layer (`isolate`) and the filter bar sits above them (`z-30`) | `src/components/ProductCard.tsx`, `src/components/CategoryLanding.tsx` |
| Product images showed through the see-through header and filter bars on phones. These are now solid on mobile and translucent from `sm` up | `src/components/Header.tsx`, `src/components/CategoryLanding.tsx`, `src/app/shop/page.tsx` |
| The ₹499 home banner was cramped on phones. Added spacing between the headline, price, notes and button, and widened the side gutter to 16 px | `src/components/home/FlatPriceBanner.tsx` |

---

## 5. Findings

Severity: **P0** = fix before/at next deploy · **P1** = fix this sprint · **P2** = should fix · **P3** = polish.

### 5.1 Security & dependencies

**SEC-1 · P0 · Next.js 14.2.35 has unpatched critical/high advisories**
- *Where:* `package.json` (`"next": "^14.2.35"`)
- *Evidence:* `npm audit --omit=dev` reports 9 vulnerabilities (1 critical, 8 high). The Next.js advisories include:
  - Remote-code-execution advisories in the Image Optimization API (GHSA-2xp9-vwfh-vxw4 for AVIF, GHSA-2464-fhr4-w9xw for SVG)
  - Several Server Components / Server Actions denial-of-service issues (e.g. GHSA-h25m-26qc-wcjf, GHSA-m99w-x7hq-7vfj)
  - SSRF in rewrites
  - RSC cache poisoning

  The newest of these affect versions up to 15.5.27, so the fix is a 15.5.x release newer than that, or 16.x. `npm audit` suggests `next@16.4.5`. `next.config.js` already turns off AVIF as a stop-gap, which is good but not enough.
- *Fix:* Upgrade to the latest patched Next.js (15.5.x patch release or 16.x) together with `eslint-config-next`. Expect App Router breaking changes: async `params`/`searchParams`/`cookies()` in 15, React 19 peer. Then re-run tests and a full click-through.

**SEC-2 · P1 · Other vulnerable dependencies**
- *Where:* `prisma` / `@prisma/config` via `deepmerge-ts` (high), `@vercel/blob` → `@vercel/oidc` → `zod` (high), `postcss` (bundled in next, high).
- *Fix:* Upgrade `prisma` + `@prisma/client` together (audit suggests 7.10.1+; check the Prisma 7 migration notes). Update `@vercel/blob` to a version whose dependency chain has a patched `zod`. postcss is fixed with the Next upgrade.

**SEC-3 · P1 · Rate limiting is per-server-instance unless Upstash is configured**
- *Where:* `src/lib/rate-limit.ts:16` (in-memory `Map`), fallback at `:153`. `.env.example:69-70` leaves `UPSTASH_REDIS_REST_URL/TOKEN` empty.
- *Why it matters:* On Vercel each serverless instance has its own memory. The limits on admin login, customer login, COD orders, promo guessing and order lookup are much weaker than they look.
- *Fix:* Set the Upstash variables in production (free tier is fine) and log a warning at boot when they're missing in production.

**SEC-4 · P2 · Global admin-login limit lets anyone lock the owner out**
- *Where:* `src/app/api/auth/login/route.ts:11` (`login:all`, 30 attempts/hour across all IPs).
- *Why it matters:* 30 junk requests an hour from anywhere block the real admin from logging in.
- *Fix:* Keep the per-IP limit. Replace the global one with per-account backoff that only starts after failed attempts, or exempt requests that pass the TOTP check. Since 2-step (TOTP) is supported, enabling it in production removes most of the risk the global limit guards against.

**SEC-5 · P3 · CSP allows inline scripts**
- *Where:* `next.config.js:51` (`script-src 'self' 'unsafe-inline' …`).
- *Fix:* Move to a nonce-based CSP via middleware once on Next 15+. Low priority because there's no user-generated HTML.

### 5.2 Payments, orders & business logic

**ORD-1 · P1 · Order emails are fire-and-forget on serverless**
- *Where:* `src/app/api/payment/razorpay/verify/route.ts:68`, `src/app/api/webhooks/payment/route.ts:62`, `src/app/api/orders/cod/route.ts:81` (`void sendOrderEmailFromDb(...)`). Also `create-order/route.ts:53` (`void releaseStaleRazorpayOrders(10)`).
- *Why it matters:* On Vercel, work still running after the response is sent can be frozen or killed. Customers may silently not get their confirmation email.
- *Fix:* Wrap these in `waitUntil()` from `@vercel/functions` (or `after()` in Next 15). Alternatively, record "email pending" in the DB and send from a queue or cron.

**ORD-2 · P1 · Abandoned online payments can hold stock for up to ~24 h**
- *Where:* `vercel.json` (cron `30 21 * * *`, once a day). `src/lib/orders.ts:59` (30-min TTL). The release also runs opportunistically only when someone *starts* a new online payment.
- *Why it matters:* At checkout start, stock is reserved for each pending Razorpay order. If buyers abandon payment during a quiet period or a limited drop, items show as sold out for hours.
- *Fix:* Run the release every 10–15 min with an external scheduler (cron-job.org, GitHub Actions or Upstash QStash) calling `/api/cron/release-stale-orders` with the `CRON_SECRET` bearer. Also trigger it from the COD route and the storefront fetch.

**ORD-3 · P1 · "Welcome code for your first order" isn't limited to first orders or one use per person**
- *Where:* `src/lib/coupons.ts:24-45` checks only active / expiry / `maxUses` overall. The footer promises "a welcome code for your first order" (`src/components/Footer.tsx:109`).
- *Why it matters:* Anyone can reuse the newsletter code on every order until the global cap runs out.
- *Fix:* Add a `perCustomerLimit` / `firstOrderOnly` rule. Check it inside `placeOrder`'s transaction against previous orders for the same email or phone with that `promoCode`.

**ORD-4 · P2 · Webhook de-duplication isn't atomic**
- *Where:* `src/app/api/webhooks/payment/route.ts:44-67` (`findFirst`, then process, then `create`).
- *Why it matters:* Two concurrent deliveries can both pass the check. `confirmRazorpayPayment` looks idempotent, so the impact is a possible duplicate email.
- *Fix:* Add a unique index on `(action, entityId)` for webhook audit rows, or a dedicated `ProcessedWebhook` table, and insert first.

**ORD-5 · P2 · Same product and size can be added as several lines to get past the 10-per-line cap**
- *Where:* `src/lib/orders.ts:94-120` (cap is per line; lines aren't merged).
- *Fix:* Merge lines by `productId+size+color` before validating quantities.

**ORD-6 · P2 · COD has no phone verification**
- *Context:* The COD route has good guards (per-IP rate limit, open-COD cap per email/phone, piece cap, PIN serviceability). Fake or impulse COD orders are still the biggest return-to-origin (RTO) cost for Indian D2C stores.
- *Fix:* Business decision. Add OTP or WhatsApp confirmation for COD, or auto-cancel unconfirmed COD orders after X hours.

**ORD-7 · P3 · Shipping fee is a big share of a ₹499 order**
- *Evidence:* Checkout shows ₹499 + ₹150 delivery = ₹649. Free delivery starts at ₹1,999, which means 4 items.
- *Fix:* Business decision. Consider "free delivery on 2+ items" or a lower base fee, and show "Add N more for free delivery" in the bag.

### 5.3 Mobile UI/UX

The sweep found **no horizontal overflow on any of 20 pages at 320 px**, the bottom nav hides correctly on product, checkout and login pages, and touch targets are mostly ≥ 44 px.

**UX-1 · P1 · Jeans is a second-class category**
- *Where:* `src/app/jeans/page.tsx:4` redirects to `/shop?category=Jeans`. `src/components/CategoryLanding.tsx:24` (`ALL`) leaves Jeans out of "Other silhouettes". The header nav and the home page ("Four cuts") treat Jeans as one of four equal categories.
- *Why it matters:*
  - Tapping Jeans lands on a different page layout from the other three categories.
  - The page title and canonical stay generic ("Shop All… | OFFVYBE", canonical `/shop`), so Jeans can't rank on its own.
  - Jeans isn't in the sitemap.
- *Fix:* Give Jeans a `CategoryLanding` config like the others (`src/app/jeans/page.tsx`), add it to `ALL` and the sitemap, and point the header link to `/jeans`.

**UX-2 · P2 · Home page is very long and shows the same products repeatedly**
- *Evidence:* About 6,900 px tall at 320 px wide (~12 screens). The same 24 products appear in the Drop List, four "Shop by fit" rails, the Hanging Rail and the Runway reel. The trust strip (free delivery / exchange / COD / secure) appears twice (`TrustStrip` on home and again at the top of the footer).
- *Fix:* Keep the hero, category stories, Drop List, ₹499 banner and one "Shop by fit" block, and cut or merge the rest. Every section can already be toggled in Admin → Settings → Storefront sections, so this may need no code. Remove the duplicate trust strip on the home page.

**UX-3 · P2 · Product page has three "Add to bag" actions, and the main button overflows at 320 px**
- *Where:* `src/app/product/[id]/page.tsx:532-571` (quantity + Add to bag + Save row) and the sticky bar (`:805`).
- *Evidence:* At 320 px the "Add to bag · ₹499" label needs 116 px but has 106 px, so the text and icon collide. It's fine at 360 px and up. The page also stacks a sticky Add to bag bar, an Add to bag button and a Buy it now button.
- *Fix:* Below 360 px, hide the price in the button label or put quantity on its own row. Consider dropping one of the three CTAs.

**UX-4 · P2 · Hydration warning from the scroll-reveal script on `/shop`**
- *Where:* `src/components/premium/ScrollReveal.tsx:74-78` adds `reveal-pending` to `[data-reveal]` cards. On `/shop` (wrapped in `<Suspense>`), this happens before React has hydrated that part of the page.
- *Evidence:* Console: `Warning: Prop className did not match … "reveal-pending"`.
- *Fix:* Only prime elements after hydration, e.g. delay the first `scan()` with `requestIdleCallback`. Or toggle the class from inside `ProductCard` with a ref and IntersectionObserver instead of mutating server-rendered DOM.

**UX-5 · P3 · Small polish items**
- Announcement bar text is cut off at 320 px ("Autumn / Winter 2026 Drops Live -…"). Shorten it or let it scroll.
- `text-[10px]` and smaller appears 82 times in storefront code, some of it in unused components, e.g. "New", "Only 8 left", category labels in home rails. Use 11 px minimum on phones.
- Footer trust tiles truncate ("On orders over …", "Serviceable PIN…").
- Inline text links are short tap targets (breadcrumb "Shop" 31×39, "Save your sizes" 93×15). Add vertical padding.

### 5.4 Accessibility

**A11Y-1 · P1 · Form labels aren't connected to their inputs**
- *Where:* `src/app/login/page.tsx:161-253` and `src/app/contact/page.tsx:144-199` use `<label>` without `htmlFor` (inputs have no `id`). Also the shop search field (`src/app/shop/page.tsx`, text input with placeholder only).
- *Why it matters:* Screen readers announce unnamed fields, and tapping the label doesn't focus the input.
- *Fix:* Add matching `id`/`htmlFor` pairs, or wrap the input inside the label. Add `aria-label="Search products"` to the search field.

**A11Y-2 · P2 · The bright red accent fails contrast for small text**
- *Evidence:*
  - `gold` token `#E3122B`: **4.14:1** on black `#0A0A0A` and **4.39:1** on off-white `#F5F5F5`. Both fail WCAG AA (4.5:1) for normal-size text. It's used for small eyebrows like "ONE PRICE. EVERY FIT." (11 px) and price accents.
  - `crimson` `#B30015` on black is **2.76:1** (fails). It's fine on off-white (6.58:1).
  - `text-espresso/50` on off-white is 3.62:1 (fails). There are 16 uses of `/40`–`/50` grey text on the storefront.
- *Fix:* Keep `#E3122B` for large text and graphics. For small text use a lighter red on dark (e.g. `#FF3B4E` = 5.64:1 on black) and `crimson` on light. Bump `/40`–`/50` greys to `/60` (5.11:1).

**A11Y-3 · P3 · Headings read as glued words**
- *Where:* `src/components/CategoryLanding.tsx:168,174` and `src/app/why-offvybe/page.tsx:73` use `<br />` between words. The accessible h1 reads "The jacketsvault." and "Three things.Made heavy."
- *Fix:* Put a space before `<br />` (`{config.titleTop}{" "}<br />`).

**A11Y-4 · P3 · Duplicate SVG id**
- *Where:* `src/components/premium/HangingRail.tsx:22` (`id="brassGrad"` is repeated for every hanger).
- *Fix:* Use `useId()` for the gradient id.

### 5.5 SEO

**SEO-1 · P1 · Jeans has no indexable landing page.** See UX-1.

**SEO-2 · P2 · Missing titles, descriptions or canonicals**
- *Where:*
  - `src/app/about/page.tsx:1` is a `"use client"` page, so it can't export `metadata`. It shows the generic site title and has no canonical.
  - `/returns`, `/shipping-policy` and `/terms` have titles but no `alternates.canonical`.
  - The home page (`/`) has no canonical.
- *Fix:* Split About into a server `page.tsx` with `metadata` plus a client component, and add `alternates: { canonical }` to the policy pages and home. Private pages (bag, checkout, saved, profile, login) should get `robots: { index: false }`.

**SEO-3 · P3 · Product URLs are IDs (`/product/ts-001`)**
- *Fix:* Add slugs (`/product/mayfair-heavyweight-oversized-tee`) with a 301 from the old ID URLs.

**SEO-4 · P3 · Sitemap marks every URL as modified "now" on every build**
- *Where:* `src/app/sitemap.ts` (`lastModified: now`).
- *Fix:* Use the product's `updatedAt`.

### 5.6 Trust, content & legal (India)

**TRUST-1 · P0 · A placeholder-looking support phone is hard-coded in many places**
- *Where:* `+91 98200 12345` appears in:
  - `src/components/Footer.tsx:47` (fallback when the admin setting is empty)
  - `src/app/contact/page.tsx:82`
  - `src/app/privacy-policy/page.tsx:149`
  - `src/lib/email.ts:346` (order emails)
  - `src/components/LiveCourierTrackerModal.tsx:338`
  - `src/context/StoreContext.tsx:138,194,229`

  Checkout's "Need help?" also shows it.
- *Why it matters:* If this isn't a real, staffed number, customers can't reach you, which hurts trust and is a consumer-law problem. Even if it is real, the contact page, privacy policy and emails ignore the phone set in Admin → Settings.
- *Fix:* Read the phone, email and address from `siteSettings.contactInfo` everywhere, and hide the line when it's empty instead of falling back to a sample number.

**TRUST-2 · P1 · Confirm the legal disclosures are real**
- *Where:*
  - Privacy policy names a grievance officer, "Rohan Kulkarni" (`src/app/privacy-policy/page.tsx:144`). Confirm this is a real person.
  - The footer, terms and contact pages don't show a legal entity name, registered address or GSTIN.
  - `grievance@offvybe.in` and `concierge@offvybe.in` must be real, monitored inboxes.
- *Why it matters:* India's Consumer Protection (E-Commerce) Rules 2020 expect sellers to show these details clearly. Have a lawyer or CA confirm current requirements, including the DPDP Act rules for the privacy policy.

**TRUST-3 · P3 · Old brand name still in code**
- *Where:* 17 occurrences of "Trend Street", e.g.:
  - `src/components/premium/WeightTest.tsx:93`
  - `src/components/OffcultAssistDrawer.tsx:100`
  - `src/components/GeoFaqSection.tsx`
  - Metadata of the redirected pages `src/app/complete-the-fit`, `shop-your-way` and `why-trend-street`
  - Internal names like the `ts_admin_session` cookie, the `ts_cart` storage key and the `TS-` order prefix
- Most of these are in unused files (CODE-1). Internal keys are fine to keep (renaming signs users out and empties carts). Order numbers starting `TS-` are customer-visible, so consider `OV-` for new orders.

### 5.7 Performance (code-based, not measured)

**PERF-1 · P2 · The whole catalogue is downloaded twice on every visit**
- *Where:*
  - `src/app/layout.tsx:102` already passes products, reviews and settings into `StoreProvider` from the server.
  - `src/context/StoreContext.tsx:325` then fetches `/api/storefront` again on every page load (~24 products with reviews and settings as JSON).
- *Fix:* Drop the client re-fetch, or make it conditional (only when the server data is older than N minutes, or on focus after a long idle).

**PERF-2 · P2 · One giant client context re-renders everything**
- *Where:* `src/context/StoreContext.tsx` (673 lines) holds products, cart, wishlist, orders, user, settings and UI flags in one context. Every cart or wishlist change re-renders every consumer, including every `ProductCard`.
- *Also:* The home page (`src/app/page.tsx`) is a client component, so the whole page ships as JS.
- *Fix:* Split into `CatalogContext` (rarely changes), `CartContext` and `UIContext`, or move to a small store (Zustand) with selectors. Make the home page a server component that renders client islands.

**PERF-3 · P3 · Service-worker cache grows forever**
- *Where:* `public/sw.js:4` (`VERSION = "v1"`, never bumped). Every deploy adds new hashed `/_next/static/` files to the same cache, and nothing removes old ones.
- *Fix:* Bump `VERSION` per release (inject the build id), or cap the cache by entry count.

**PERF-4 · P3 · `<img>` instead of `next/image`**
- *Where:* ESLint warns in 11 places. Most are in unused components (CODE-1) or admin screens, so low impact.

### 5.8 Code health & maintainability

**CODE-1 · P2 · Dead code: about 12 unused components, 4 dead routes, an unused 3D library**
- *Unused components (imported nowhere):*
  - `ShopTheFitSection`, `LimitedEditionVault`, `NewArrivalsDropRadar`, `SilhouetteStudio`
  - `StreetwearEditorialHero`, `StreetwearLookbookMatrix`, `3d/HeroShowroom3D`, `FlyingWearScrollStrip`
  - `CustomerReviewGallery`, `GeoFaqSection`, `premium/JodhpurEdit`, `premium/WeightTest`
  - `OffcultAssistDrawer`, `LiveCourierTrackerModal`
- *Dead routes:* `next.config.js` redirects `/lookbook`, `/shop-your-way`, `/complete-the-fit` and `/why-trend-street`, but their page files still exist.
- *Unused libraries:* `three` and `@types/three` are used only by the dead `HeroShowroom3D`. `clsx` and `tailwind-merge` are installed but never imported.
- *Fix:* Delete them (git keeps history) and remove the unused packages.

**CODE-2 · P2 · Repo folder clutter (on the dev machine, git-ignored)**
- *Where:* The project root contains `_backup_before_*` folders (5), `trendstreet-fixes.bundle`, `data/customers.json` (customer data), `.test-dist/`, `tsconfig.tsbuildinfo`, and a dozen overlapping report files (`PROJECT_AUDIT.md`, `SECURITY_AUDIT.md`, `UI_UX_AUDIT.md`, `docs/PROJECT_AUDIT_FOR_CHATGPT.md` etc.). The old reports still describe "Trend Street" and a burgundy/gold palette that no longer exists.
- *Fix:*
  - Delete the backups and the bundle.
  - Delete `data/customers.json` if the database is live, since it holds personal data.
  - Archive old reports in `docs/archive/` with a note that this file supersedes them.

**CODE-3 · P3 · Colour token names don't match the colours**
- *Where:* `tailwind.config.ts` and `src/app/globals.css`:
  - `burgundy` = black `#0A0A0A`
  - `gold` = red `#E3122B`
  - `espresso` = black
  - `ivory` = `#F5F5F5`
- *Why it matters:* Easy to misuse. For example, `text-gold` looks harmless but is the contrast-failing red (A11Y-2).
- *Fix:* Add semantic aliases (`ink`, `accent`, `accent-strong`, `paper`) and migrate gradually.

**CODE-4 · P3 · Very large files**
- *Where:* `src/app/checkout/page.tsx` (1,120 lines), `src/app/admin/settings/page.tsx` (1,122), `src/app/product/[id]/page.tsx` (947), `src/context/StoreContext.tsx` (673).
- *Fix:* Split checkout into Address / Delivery / Payment step components, and the product page into Gallery / BuyBox / Details / Related.

**CODE-5 · P3 · The admin "Staff & roles" screen is a placeholder**
- *Where:* `src/lib/admin-rbac.ts` defines 5 roles. Only the single `ADMIN_EMAIL` account can log in (`src/lib/auth.ts:53`), and `POST /api/admin/staff` says invitations "aren't built yet".
- *Fix:* Either hide the Staff screen, or build per-person admin accounts (`User.role = ADMIN/STAFF`, hashed passwords, a role in the session, per-route permission checks).

---

## 6. Prioritised action plan

| # | Do this | IDs | Effort |
|---|---|---|---|
| 1 | Upgrade Next.js to a patched release, plus Prisma and @vercel/blob; full regression test | SEC-1, SEC-2 | 1–2 days |
| 2 | Replace the hard-coded phone/address with Admin settings everywhere; confirm legal entity, GSTIN and grievance officer | TRUST-1, TRUST-2 | 2–3 h |
| 3 | Set Upstash env vars in production | SEC-3 | 15 min |
| 4 | Wrap background email/release calls in `waitUntil`; run stock release every 10–15 min | ORD-1, ORD-2 | 2–3 h |
| 5 | One-per-customer / first-order rule for the welcome code | ORD-3 | 2 h |
| 6 | Jeans landing page, sitemap entry, header link | UX-1, SEO-1 | 1 h |
| 7 | Link form labels; fix small red text contrast; heading spaces | A11Y-1..3 | 2 h |
| 8 | Trim home sections (admin toggles) and remove the duplicate trust strip | UX-2 | 30 min |
| 9 | Delete dead components, pages and unused packages; clean the project folder | CODE-1, CODE-2 | 1 h |
| 10 | Remove the double catalogue fetch; split StoreContext | PERF-1, PERF-2 | 0.5–1 day |
| 11 | Metadata/canonicals for About, policies, home; noindex private pages | SEO-2 | 1 h |
| 12 | Remaining P3 polish | UX-3..5, SEO-3/4, PERF-3/4, CODE-3..5, ORD-4..7, SEC-4/5 | as time allows |

---

## 7. Already done well (don't change)

- **Server-side pricing.** `priceOrder()` (`src/lib/orders.ts:94`) re-prices from the DB and never trusts browser prices. Delivery fees come from Admin settings.
- **Atomic stock reservation.** Conditional `updateMany … quantity >= n` inside a transaction (`src/lib/orders.ts:158-167`). Coupon use is also consumed inside the transaction.
- **Razorpay flow.**
  - The order is saved before checkout opens.
  - The amount is re-checked against the Razorpay order.
  - The signature is verified.
  - The paid amount is fetched from Razorpay, not from the browser.
  - The webhook has a signature check and de-duplication.
  - Refund-on-oversell is handled.
- **Sessions.**
  - HMAC-signed tokens with separate admin and customer keys.
  - No secret means fail closed in production.
  - The admin session is tied to a credential fingerprint, so a password change signs out every device.
  - Cookies are httpOnly, `SameSite=strict` for admin, and `Secure` on HTTPS.
  - Optional TOTP 2-step for admin.
- **Passwords.** PBKDF2-SHA512 with 310k iterations, constant-time compare, a dummy hash against user-enumeration timing.
- **CSRF guard.** Middleware blocks cross-site writes to `/api/*` (`src/middleware.ts`). All 20 admin API routes also check the session themselves.
- **Order lookup and cancel.** Order number and email must both match, the same error is returned for both cases, requests are rate-limited, and cancel is a conditional update.
- **COD abuse guards.** PIN serviceability, an open-COD cap per email/phone, a piece cap, and an admin kill switch.
- **Uploads.** Admin only, MIME allow-list plus magic-byte check, size limits, random suffix.
- **Security headers.** CSP, HSTS, frame-ancestors none, nosniff, Referrer-Policy, COOP, and `X-Robots-Tag: noindex` on admin and API.
- **Mobile layout.** No horizontal overflow at 320 px on 20 pages. iOS input-zoom prevention. Safe-area-aware bottom nav. Reduced-motion respected.
- **SEO basics.** Unique titles and descriptions on category and product pages, Product JSON-LD with `aggregateRating` only when there are real reviews, and a dynamic sitemap.
- **GST.** Shown as inclusive, 5% up to ₹2,500 and 18% above, matching the post-Sept-2025 apparel slabs.

---

## 8. Reference: key files

| Concern | File |
|---|---|
| Global layout / providers | `src/app/layout.tsx` |
| Home page sections | `src/app/page.tsx`, `src/components/home/*`, `src/components/premium/*` |
| Category landing (Oversized / Boxy / Jackets) | `src/components/CategoryLanding.tsx`, `src/app/{oversized,boxy-fit,jackets}/page.tsx` |
| Shop / filters | `src/app/shop/page.tsx` |
| Product card / product page | `src/components/ProductCard.tsx`, `src/app/product/[id]/page.tsx` |
| Client state (cart, wishlist, settings) | `src/context/StoreContext.tsx` |
| Orders, pricing, stock | `src/lib/orders.ts`, `src/lib/pricing.ts`, `src/lib/coupons.ts` |
| Payments | `src/app/api/payment/razorpay/*`, `src/app/api/webhooks/payment/route.ts`, `src/lib/razorpay.ts` |
| Auth | `src/lib/auth.ts`, `src/lib/session-token.ts`, `src/lib/customer-auth.ts`, `src/lib/admin-credentials.ts`, `src/middleware.ts` |
| Rate limiting | `src/lib/rate-limit.ts` |
| Security headers / redirects | `next.config.js` |
| Cron | `vercel.json`, `src/app/api/cron/release-stale-orders/route.ts` |

---

## 9. Instructions for ChatGPT

1. Work through Section 6 in order. For each item, show the exact diff per file and explain any behaviour change.
2. **Don't** rewrite anything in Section 7. Don't change prices, GST, the payment flow or auth unless a finding asks for it.
3. Keep the visual design: OFFVYBE black / off-white / red palette, Big Shoulders Display headings, Montserrat body.
4. Mobile first: every UI change must work at **320 px** and **390 px** wide with no horizontal scroll and tap targets ≥ 44 px.
5. For the Next.js upgrade (SEC-1), list the breaking changes that affect this codebase (async `params`, `cookies()`, `headers()`, React 19 types) before changing code.
6. Don't rename `ts_*` localStorage keys or the `ts_admin_session` cookie. That would empty shoppers' bags and sign everyone out.
7. After changes, the checks to pass are `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`.
8. If something in this audit looks wrong against the actual code, say so and don't force the fix.
