# OFFVYBE — Security Hardening Report (5 Nov 2026)

**Scope:** an authorized white-box review of the OFFVYBE codebase (`TrendStreet-main`), followed by fixes, regression tests and verification. All testing ran locally against a production build. **Nothing was deployed** and nothing touched the live site.

**Bottom line:**
- No known critical or high-severity issue remains in the code or its dependencies.
- `npm audit` reports **0 vulnerabilities** (production and development).
- Some protections only switch on once you configure them (email, admin 2-step, Blob hostname). Several items are documented as remaining (§6).
- The site is **ready for a production security review once the deployment steps in §9 are done**. Not before.

---

## 1. Summary

| | Found | Fixed | Remaining (documented) |
|---|---|---|---|
| Critical | 1 | 1 | 0 |
| High | 4 | 4 | 0 |
| Medium | 15 | 13 | 2 (R1 inline-script CSP, R2 stock-release cadence) — plus R3/R4, which are fixed in code but switched off until configured |
| Low | 11 | 9 | 2 (+ informational items in §6) |
| **Total** | **31** | **27** | **4 + configuration-dependent items** |

Your decisions (5 Nov):
- Next.js **15.5.29** (patched backport line) rather than 16.
- Admin 2-step **built but not forced** (`ADMIN_REQUIRE_2FA` stays off).
- Email confirmation **built, and switches on automatically once Resend is configured**.
- Rate limits stored in **your PostgreSQL**, with Upstash used automatically if you add it.

---

## 2. Attack-surface inventory (what was reviewed)

- **All 42 existing API routes, plus the 5 new ones** (47 total), each checked for: authentication, authorization, input validation, rate limit, method, body size/type, error handling, DB query safety and ownership:
  - customer auth (4 + 3 new)
  - admin auth (3)
  - admin APIs (20 + 1 new)
  - account (3 + 1 new)
  - checkout (2), orders (3), payments (2), webhook (1), cron (1), returns, alerts, storefront
- **Middleware** (Edge): CSRF origin check, admin gate, and now body size/type.
- **Sessions:** HMAC tokens for admin (8 h) and customer (30 d), plus the new admin device cookie.
- **Payments:** Razorpay create → checkout → verify → webhook → stale-order reconcile; COD.
- **Database:** Prisma schema (20 models). All queries use the Prisma API or parameterized tagged-template `$queryRaw`, with no string-built SQL. Atomic stock and coupon updates.
- **Uploads:** admin multipart route and Vercel Blob client tokens.
- **Front end:**
  - `dangerouslySetInnerHTML`: 3 uses, all JSON-LD built from server data, `<` escaped.
  - localStorage holds the cart, wishlist and a profile copy. It holds no tokens; auth cookies are httpOnly.
  - No secrets in `NEXT_PUBLIC_*`.
- **Configuration:** `next.config.js` headers/CSP, `vercel.json` cron, `.env.example`.
  - The local `.env.local` was checked by variable name and strength only (values never printed). It holds only placeholders and an admin password hash.
- **Supply chain:**
  - `npm audit` (production + dev).
  - Lockfile resolved from the public registry.
  - Only postinstall script: `prisma generate`.
- **Secret scan:** the working tree, plus every readable object in `trendstreet-fixes.bundle` (git history). Nothing real was found (§8).

---

## 3. Findings and fixes

### Critical

**C1 — Next.js 14.2.35 had published critical/high advisories** (image-optimizer RCE GHSA-2xp9-vwfh-vxw4 and GHSA-2464-fhr4-w9xw, Server Components/Actions DoS, SSRF in rewrites, cache poisoning).
- **Fixed:** upgraded to `next@15.5.29` + `react/react-dom@19.3.1` + `eslint-config-next@15.5.29`.
- Code changes required by Next 15 / React 19:
  - async `params` in 3 admin routes, the product layout and the complete-the-fit page
  - `RefObject<… | null>` in 2 hooks
  - the "Big Shoulders Display" font is now "Big Shoulders" (Google renamed it). `opsz` is pinned to 72 in `globals.css` to keep the same display cut.

### High

**H1 — Anyone could take over a guest shopper's identity.**
- Registering with an email that had guest orders "claimed" that record with the attacker's password, with no proof of owning the inbox.
- The guest's saved phone number then appeared in the attacker's profile.
- Later guest orders under that email attached to the attacker's account.
- **Fixed** (`lib/customer-auth.ts`, `api/auth/customer/register`, new `verify-email`):
  - With email configured: sign-up always goes through a confirmation link. Nothing on the record changes until the inbox owner opens it, and the guest phone is never carried over.
  - Without email: existing guest emails are refused, with a "contact us" message.

**H2 — The payment callback could mark an order paid without the money being captured.**
- `verify` used `order.amount_paid || order.amount`, so an order with nothing paid yet fell back to the full amount.
- **Fixed** (`lib/razorpay.ts → fetchCapturedPayment`, `api/payment/razorpay/verify`):
  - Fetches the payment from Razorpay.
  - Requires it to belong to that order.
  - Captures it if it's only authorized.
  - Otherwise leaves the order pending; the webhook confirms it on capture.

**H3 — Rate limits didn't hold in production.**
- The in-memory `Map` is per serverless instance and Upstash wasn't configured, so login, COD, coupon and order-lookup limits were easy to get past.
- **Fixed** (`lib/rate-limit.ts`): shared counters in PostgreSQL (`rate_limit_buckets`, one atomic `INSERT … ON CONFLICT`), Upstash if configured, memory only as a last resort.

**H4 — Vulnerable transitive dependencies:** `deepmerge-ts` (via prisma), `zod` (via @vercel/blob), bundled `postcss`, and `minimatch` (dev).
- **Fixed** with `package.json` `overrides`, and `postcss` bumped to 8.5.32.
- Both `npm audit` and `npm audit --omit=dev` now report 0.
- Removed the unused `three`, `@types/three`, `clsx` and `tailwind-merge`.

### Medium (all fixed)

| ID | Issue | Fix (files) |
|---|---|---|
| M1 | The global admin-login limit (30/hour from anywhere) let anyone lock the owner out | Failed attempts across all IPs only pause **browsers that have never signed in**. A signed, httpOnly device cookie keeps the owner's usual browser working. Per-IP limit kept (`api/auth/login`, `lib/auth.ts`) |
| M2 | Admin sign-out didn't revoke the token on the server; no "sign out everywhere" | Sessions carry a random `sid`. Sign-out marks it revoked. **Sign out all devices** in the admin sidebar. Checked in every admin API (`lib/admin-guard.ts`, `api/auth/logout`, `api/admin/security/revoke-sessions`) |
| M3 | Admin 2-step: no replay protection, no recovery codes, no way to make it mandatory | Each 6-digit code works once. One-time recovery codes are stored as hashes (`npm run admin:recovery-codes`). `ADMIN_REQUIRE_2FA=true` enforces 2-step in production (`lib/admin-mfa.ts`, `lib/totp.ts`, admin login page) |
| M4 | Customer sessions couldn't be revoked; no password change or reset | `sessionVersion` on users, checked on every customer API. Change password (needs the current one) and **sign out of all devices** in Profile → Details. **Forgot password** with single-use, 30-minute, SHA-256-hashed tokens. Sessions rotate daily, with a 90-day absolute cap |
| M5 | No per-account sign-in throttling (credential stuffing from many IPs) | 10 failed attempts per account per 15 minutes, from any IP. The same answer whether or not the account exists |
| M6 | Email enumeration at sign-up ("account already exists") | With email configured: one generic answer for all cases, and the real owner gets an "you already have an account" email. Without email: see R4 |
| M7 | Weak password policy | 8–200 characters, common-password list, no email in password. PBKDF2 now runs async (doesn't block the server) with an iteration cap, and old 100k hashes are upgraded at sign-in |
| M8 | The "welcome / first order" code could be reused on every order | New coupon rules **First order only** and **Uses per customer** (Admin → Discounts). Enforced inside the order transaction under per-customer advisory locks, matched by canonical email (Gmail dots and +tags) or mobile number (`lib/coupons.ts`, `lib/orders.ts`) |
| M9 | Repeating a bag line got past the 10-per-line limit | Lines are merged by product + size + colour before validation (`lib/orders.ts`) |
| M10 | Order emails and stock release ran "fire-and-forget" and could be killed on serverless | `after()` (Next 15) in verify, webhook, COD and create-order |
| M11 | Admin could set an unpaid online order to Confirmed/Shipped/Delivered, cancel a delivered order, or re-open an unpaid one | Server-side transition rules (`lib/admin-orders.ts → checkOrderTransition`) |
| M12 | API bodies of any size and type were parsed (resource use; `text/plain` form-CSRF trick) | Middleware: JSON-only for API writes (uploads excepted), 64 KB public / 1 MB admin, otherwise 413/415 |
| M13 | A second `PrismaClient` in `email.ts` opened a separate DB connection pool per instance | Uses the shared client |
| M14 | Rate-limit IP came from `X-Forwarded-For` even when no trusted proxy set it | Trusted only on Vercel (Vercel overwrites it), or with `TRUST_PROXY_HEADERS` / `TRUST_CLOUDFLARE_IP` |
| M15 | Webhook de-duplication was check-then-insert (not atomic) | Atomic first-time markers (`security_markers`). Processing was already idempotent (an order flips to paid at most once), now verified by tests |

### Low (fixed)

- **L1** — No `Cross-Origin-Resource-Policy`. Now `same-origin` on `/api/*` and `/admin/*`.
- **L2** — Any Vercel Blob store's images were allowed in `next/image` and the CSP. Set `BLOB_PUBLIC_HOSTNAME` to restrict to yours.
- **L3** — No upload rate limit or early size check. Added 60 uploads per 10 minutes per admin, with Content-Length checked before reading.
- **L4** — The local media delete accepted `..` as a file name. Tightened.
- **L5** — No re-authentication for bulk actions. **Set every price** and **export all customers (CSV)** now need a sign-in from the last 30 minutes.
- **L6** — No production configuration check. `src/instrumentation.ts` logs missing or weak settings at start-up, names only.
- **L7** — Alerts: there was no email on admin sign-in from a new browser. Added, sent once email is configured, plus audit entries.
- **L8** — Security events weren't in the audit log. Added: admin login blocked, recovery code used, new-device login, sessions revoked, customer password changed/reset, sign-out everywhere, email confirmed, account locked, webhook signature failure, payment verify rejected.
- **L9** — Admin and customer tokens shared one secret (with different derived keys). Optional `ADMIN_AUTH_SECRET` now gives admin tokens their own.

---

## 4. Verified as already correct (kept as they were)

All of these were checked against the code before relying on them:
- server-side pricing from the database
- atomic conditional stock decrement
- coupon use consumed inside the transaction
- Razorpay signature check (timing-safe) and amount re-check
- refund on oversell
- webhook HMAC check
- HMAC session tokens that fail closed without `AUTH_SECRET`
- credential fingerprint in admin sessions
- PBKDF2 (310k, SHA-512) with a dummy hash against user enumeration
- CSRF origin check on all API writes
- `requireAdminSession` on all 20 admin routes, plus the middleware gate
- order lookup and cancel require order number + email, with the same error for both cases
- COD caps
- upload MIME + magic-byte checks
- `safeRedirectPath` (open-redirect guard)
- CSV formula-injection guard
- HTML escaping in emails
- `<` escaped in JSON-LD
- CSP, HSTS, `frame-ancestors 'none'`, `nosniff`, Referrer-Policy, Permissions-Policy

GST rules, prices, the payment flow, the design and customer features are unchanged, apart from the security behaviour described above.

---

## 5. Files changed (85, plus this report)

**New (22):**
- Library: `src/lib/{admin-guard, admin-mfa, auth-tokens, customer-session-cookie, env-check, security-email, security-marker}.ts`, `src/instrumentation.ts`
- API: `src/app/api/auth/customer/{password-reset, password-reset/confirm, verify-email}/route.ts`, `src/app/api/account/password/route.ts`, `src/app/api/admin/security/revoke-sessions/route.ts`
- Pages and components: `src/app/{reset-password, verify-email}/{page, layout}.tsx`, `src/components/{AccountSecurity, AuthCard}.tsx`
- Scripts, tests, docs: `scripts/admin-recovery-codes.ts`, `tests/unit/security-hardening.test.ts`, `docs/security/2026-11-05-schema-changes.sql`

**Emptied:** `src/components/3d/HeroShowroom3D.tsx`. It was unused and was the only user of `three`. You can delete it.

**Modified (62):**
- Config: `package.json`, `package-lock.json`, `next.config.js`, `prisma/schema.prisma`, `src/middleware.ts`
- Library:
  - Auth and sessions: `src/lib/{auth, session-token, customer-auth, totp, account, order-actions}.ts`
  - Orders and payments: `src/lib/{orders, coupons, razorpay, admin-orders}.ts`
  - Infrastructure: `src/lib/{rate-limit, audit, email, media}.ts`
- Auth routes: customer login/register/session/logout; admin login/logout/session
- Payment and order routes: verify, webhook, COD, create-order
- Admin routes: orders/[id], products/[id], reviews/[id], pricing, customers, discounts, upload, upload/blob (the other 12 admin routes changed only their import line)
- UI:
  - Admin: login page, discounts page, sidebar
  - Customer: login page, profile page, `UserAuthContext`
- Next 15 fixes: `app/layout.tsx`, `globals.css`, `product/[id]/layout.tsx`, `complete-the-fit/page.tsx`, `hooks/useAutoScroll.ts`, `hooks/useSwipeToClose.ts`

## 6. Remaining risks (not fixed, or depending on your configuration)

| ID | Risk | Severity | What to do |
|---|---|---|---|
| R1 | CSP still allows inline scripts (`'unsafe-inline'`). A nonce-based CSP would make every page server-rendered on each request (no static pages), a large performance and cost change. There is no user-generated HTML and React escapes output, so the practical XSS exposure is low | Medium (accepted) | Revisit with Next 16's nonce support or a hash-based CSP |
| R2 | Unpaid online orders hold stock until the daily cron or the next checkout releases them (Vercel Hobby crons run once a day) | Medium | Call `GET /api/cron/release-stale-orders` with `Authorization: Bearer $CRON_SECRET` every 10–15 min from cron-job.org, GitHub Actions or Upstash QStash |
| R3 | Admin 2-step isn't mandatory (your choice) | Medium until enabled | `npm run admin:2fa` → set `ADMIN_TOTP_SECRET`; `npm run admin:recovery-codes` → set `ADMIN_RECOVERY_CODE_HASHES`; then `ADMIN_REQUIRE_2FA=true` |
| R4 | Until Resend is configured: no password reset (shows "contact us"), no sign-up confirmation (new emails sign up instantly, guest emails are refused), sign-up still reveals whether an account exists, no new-device alerts — **and no order confirmation emails at all** | Medium | Set `RESEND_API_KEY` + `RESEND_FROM_EMAIL` on a verified domain |
| R5 | Anyone can lock a customer account for 15 minutes with 10 wrong passwords (the cost of per-account throttling) | Low (accepted) | Mitigated by password reset once email is on |
| R6 | COD has no phone OTP (fake COD orders hold stock until cancelled) | Low/business | Optional WhatsApp/SMS confirmation |
| R7 | "Notify me" sign-ups don't confirm the email (someone could subscribe another person) | Low | Double opt-in if it's ever abused |
| R8 | Cancel/lookup by order number + email: someone holding both could cancel a COD order | Low | Fine for now; signed-in customers use their session |
| R9 | Only one admin account; the Staff/roles screen is a placeholder | Info | Build per-person admin logins before adding staff |
| R10 | Database least privilege, backups, TLS, and the Vercel env values themselves can't be seen from code | Info | Use a non-owner DB role for the app; keep `sslmode=require`; enable point-in-time recovery or Neon branching; review Vercel env access |
| R11 | Prisma 6 (Prisma 7 is a major migration, with driver adapters and a config file); `next lint` is deprecated; ESLint 8 is end-of-life | Info | Plan upgrades; `npx @next/codemod@canary next-lint-to-eslint-cli .` |
| R12 | `docs/PROJECT_AUDIT_FOR_CHATGPT.md` lists an example admin password ("TrendStreetAdmin@2026") from an old version | Info | If that was ever a real password, change it — the current code has no default passwords |
| R13 | Uploaded images have no pixel-dimension limit (Next's image optimizer, sharp, already caps input pixels) | Low | Optional |

## 7. Dependencies

| Package | Before | After |
|---|---|---|
| next | 14.2.35 | **15.5.29** |
| react / react-dom | 18.3.1 | **19.3.1** |
| @types/react / -dom | 18.x | 19.3.0 |
| eslint-config-next | 14.2.35 | 15.5.29 |
| postcss | 8.4.x | 8.5.32 (also forced for Next's bundled copy) |
| overrides | — | `zod ^4.6.7`, `deepmerge-ts ^8.0.2`, `postcss $postcss`, `@typescript-eslint/typescript-estree > minimatch ^11.0.4` |
| removed | three, @types/three, clsx, tailwind-merge | — |

## 8. Database changes, new settings, scans

**Migration (additive only, no drops):**
- New tables `auth_tokens`, `rate_limit_buckets`, `security_markers` and enum `AuthTokenPurpose`.
- New columns `users.sessionVersion` (default 0), `users.emailVerifiedAt`, `coupons.firstOrderOnly` (default false), `coupons.perCustomerLimit`, `site_settings.adminSessionsRevokedAt`.
- Exact SQL: `docs/security/2026-11-05-schema-changes.sql`.
- Existing sessions keep working: older customer tokens count as version 0, and older admin tokens have no `sid`.

**New environment variables (all optional; nothing breaks if unset):**

| Variable | Purpose |
|---|---|
| `ADMIN_REQUIRE_2FA` | `true` = refuse password-only admin sign-in in production |
| `ADMIN_RECOVERY_CODE_HASHES` | Hashes from `npm run admin:recovery-codes` |
| `ADMIN_AUTH_SECRET` | 32+ characters; separate signing key for admin tokens (setting it signs admins out once) |
| `BLOB_PUBLIC_HOSTNAME` | Your Blob store host, e.g. `abc123.public.blob.vercel-storage.com` |
| `TRUST_PROXY_HEADERS` / `TRUST_CLOUDFLARE_IP` | Only if you host somewhere other than Vercel |
| Existing, now important | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL` (reset and confirmation links use it), `UPSTASH_REDIS_REST_URL/TOKEN` (optional) |

**Scans:**
- `npm audit`: 0 vulnerabilities (production and development).
- Secret scan: no keys, tokens, private keys or credentialed database URLs in the working tree or the bundle history. The only hits were placeholders in `.env.example`, test keys in unit tests and the old doc in R12.
- `eslint-plugin-security` (ad hoc):
  - 91 `detect-object-injection` warnings. These are bracket reads with typed keys; I reviewed a sample and found no user-controlled prototype access.
  - 7 `fs` warnings in `lib/media.ts`: fixed names under `public/uploads` (tightened, see L4).
  - 1 regex warning on the IP pattern: input is length-capped to 45 characters first.
  - 1 timing warning: a client-side "passwords match" check, a false positive.
- Browser check (production build, iPhone size): no CSP violations or hydration errors on 10 pages (home, shop, oversized, product, checkout, login, reset-password, verify-email, admin login, track).

**HTTP checks against the production build:**

| Check | Result |
|---|---|
| Cross-site POST | 403 |
| `text/plain` POST | 415 |
| 200 KB body | 413 |
| Admin API with no cookie / forged cookie | 401 / 401 |
| `/admin` | 307 to login |
| Admin brute force | 401 ×5, then 429 |
| Admin cookies | `HttpOnly; SameSite=strict`; device cookie path `/api/auth` |
| Admin API when the DB is unreachable | 503 (fails closed) |
| Reset with a bad token | 400 |
| Weak password at sign-up | 400 |
| Payment verify with a bad signature | 400 |
| Webhook with no signature / bad signature | 400 / 401 |
| Cron with no secret / wrong secret | 401 / 401 |
| Reset and confirm pages | `noindex`, `no-referrer`, `no-store` |
| `Cross-Origin-Resource-Policy` on `/api` | present |

---

## 9. Deployment (in this order — don't deploy the code before step 3)

1. **On your computer:** `npm install` (the lockfile changed). Then `npm run typecheck`, `npm test` and `npm run build` should match §10.
2. **Back up the database** (Neon: create a branch; Supabase: download a backup).
3. **Apply the schema:** `npm run db:push`, with `DATABASE_URL` pointing at production. Or run `docs/security/2026-11-05-schema-changes.sql` in the SQL editor. The current live code ignores the new tables and columns, so this step is safe before deploying.
4. **Vercel → Settings → Environment Variables:**
   - Check `AUTH_SECRET` (32+ characters), `RAZORPAY_WEBHOOK_SECRET` and `CRON_SECRET`.
   - Add `BLOB_PUBLIC_HOSTNAME`.
   - When ready: `RESEND_API_KEY` / `RESEND_FROM_EMAIL`, and the 2-step settings (R3).
5. **Razorpay dashboard:** webhook events `payment.captured` and `order.paid`, pointing to `/api/webhooks/payment`.
6. **Deploy to a Preview** and test there:
   - admin sign-in and sign-out, and "Sign out all devices"
   - an order status change
   - creating a coupon with "First order only"
   - customer sign-up and sign-in, change password, "Sign out of all devices"
   - a Razorpay **test-mode** payment, and a COD order
   - the four category pages and the ₹499 banner on a phone; check the heading font looks the same
7. **Promote to Production.** The startup log lists any missing settings (`[Config ERROR]` / `[Config warning]`).
8. Set up the external 10–15-minute call to the stock-release job (R2).
9. Commit the changes to your git repository (`.git` in the project folder).

## 10. Rollback

- **Code:** Vercel → Deployments → previous deployment → **Instant Rollback**. Or revert the commit in git.
- **Database:** nothing to undo; the old code ignores the new tables and columns. If you want them gone, the DROP statements are at the end of the SQL file. Run them only after rolling the code back.
- **Settings:** remove `ADMIN_REQUIRE_2FA` if a 2-step problem ever locks you out (then redeploy).

## 11. Test results (actual output, from the sandbox)

```
$ npm run typecheck
> tsc --noEmit
[exit 0]

$ npm run lint
`next lint` is deprecated and will be removed in Next.js 16.
11 warnings, all @next/next/no-img-element (unchanged from before), 0 errors
[exit 0]

$ npm test
# tests 125
# pass 123
# fail 2
[exit 1]

$ npm run build
▲ Next.js 15.5.29
✓ Compiled successfully in 35.9s
✓ Generating static pages (53/53)
[exit 0]
```

- **Passed:** all 20 new security regression tests (`tests/unit/security-hardening.test.ts`), and all 103 existing tests that passed before.
- **Failed (environment, not code):** `order-actions.test.ts` and `security.test.ts`. **Every individual test inside them passes.** Each file is only marked failed because Prisma tries to start its database engine after the tests finish, and my sandbox can't download that engine. The same 2 files failed in exactly the same way on your original code before any change. They should pass on your computer.
- **Not run:**
  - Against a real PostgreSQL database (raw SQL for rate limits and markers was tested against a stand-in, not real Postgres).
  - Real Razorpay or Resend calls.
  - OWASP ZAP or Semgrep (not reachable from the sandbox).
  - Lighthouse.
  - Real phones.
- **Build caveat:** the sandbox couldn't reach Google Fonts, so the build used the same font files served locally through Next's official test hook. Vercel fetches them normally.

## 12. Security limitations of this review

- It's a code review plus local testing, not a penetration test of the live site.
- It can't see your Vercel environment values, database roles or backups, Razorpay dashboard settings, or GitHub repository history. Only the `.bundle` file's history was scanned, and part of it is stored as deltas against commits that aren't in the bundle.
- "Remaining" items in §6 are real and are listed so they aren't forgotten.
