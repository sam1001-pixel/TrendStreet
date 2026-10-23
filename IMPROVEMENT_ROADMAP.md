# TREND STREET — Master Improvement Roadmap (Phases 0 through 12)

> **Document Version**: 1.0.0  
> **Status**: Strategic Master Plan  
> **Governance**: Ralph & GSD Phased Execution Model  
> **Target Release**: Q4 2026 Production Launch  

---

## 1. Roadmap Overview & Milestones

The transformation of Trend Street from an ephemeral frontend prototype into a battle-tested, high-performance, secure luxury streetwear platform is structured across **13 distinct phases (Phase 0 through Phase 12)**:

```
[ Phase 0: Baseline Audit ] ──────────► [ Phase 1: Security & Auth ] ────────► [ Phase 2: UI/UX Refinement ]
                                                                                         │
┌────────────────────────────────────────────────────────────────────────────────────────┘
▼
[ Phase 3: PostgreSQL & ORM ] ────────► [ Phase 4: Real Commerce & Gateways ] ─► [ Phase 5: Cloud Services ]
                                                                                         │
┌────────────────────────────────────────────────────────────────────────────────────────┘
▼
[ Phase 6: SEO & WCAG 2.2 AA ] ───────► [ Phase 7: Performance & Web Vitals ] ──► [ Phase 8: Automated Tests ]
                                                                                         │
┌────────────────────────────────────────────────────────────────────────────────────────┘
▼
[ Phase 9: Ethical Hacking ] ─────────► [ Phase 10: Persistent Admin CMS ] ────► [ Phase 11: Observability ]
                                                                                         │
┌────────────────────────────────────────────────────────────────────────────────────────┘
▼
[ Phase 12: Production Launch Gate ] ──► LIVE PRODUCTION RELEASE
```

---

## 2. Phase-by-Phase Execution Plan

### Phase 0: Repository Discovery & Baseline Audit (COMPLETE)
* [x] Deep audit of all 22 routes, components, and contexts.
* [x] Verify strict TypeScript compilation (`tsc --noEmit` = 0 errors).
* [x] Audit Next.js production build (`next build` = 22 routes compiled).
* [x] Identify ESLint JSX unescaped quote errors and missing config.
* [x] Document critical security vulnerabilities (hardcoded credentials, client-only auth, mock checkout).
* [x] Produce `PROJECT_AUDIT.md`, `SECURITY_AUDIT.md`, `THREAT_MODEL.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `EXTERNAL_SERVICES.md`, and `ENVIRONMENT_SETUP.md`.

### Phase 1: Security Audit & Server Authentication Remediation
* [ ] Purge hardcoded plaintext credentials (`sujal@.com` / `[REDACTED-rotate-this-password]`) from `AdminAuthContext.tsx` and all client code.
* [ ] Implement Next.js Edge Middleware (`src/middleware.ts`) intercepting `/admin/*` routes.
* [ ] Establish server-side session authentication using HTTP-only, `Secure`, `SameSite=Lax` cookies.
* [ ] Secure administrative login route with generic error responses and brute-force rate limiting.
* [ ] Update `next.config.js` with comprehensive Content Security Policy (CSP), HSTS, and Permissions-Policy headers.

### Phase 2: UI/UX and Visual Design Audit & Refinement
* [ ] Fix ESLint JSX unescaped quote entities in `src/app/page.tsx` and `src/app/product/[id]/page.tsx`.
* [ ] Replace bespoke suit sizing tables (`38R`-`44R`) with authentic luxury streetwear sizing (`S`, `M`, `L`, `XL`, `XXL` for tops/outerwear; `30`-`36` waist for selvedge denim).
* [ ] Convert all critical raw `<img>` tags to Next.js `<Image />` with explicit aspect ratios and responsive `sizes`.
* [ ] Refine desktop 3D Floating Wear Hero with seamless canvas interaction and reduced-motion fallback.
* [ ] Audit mobile touch navigation to guarantee no floating bottom nav overlaps checkout CTAs or product size selectors.

### Phase 3: Backend, Database & Data Consistency
* [ ] Initialize Prisma ORM with PostgreSQL database schema (`prisma/schema.prisma`).
* [ ] Create initial SQL migration for core tables: `users`, `products`, `variants`, `inventory`, `orders`, `order_items`, `payments`, `coupons`, `site_settings`, `audit_logs`.
* [ ] Implement seed script (`prisma/seed.ts`) pre-populating the 12 luxury garments and default CMS settings.
* [ ] Migrate client-side state in `StoreContext.tsx` to Server Actions and API route handlers.
* [ ] Store monetary amounts exclusively in integer minor units (USD cents / INR paise) to prevent floating-point calculation errors.

### Phase 4: Real Commerce Features
* [ ] Build server-authoritative pricing engine: subtotal, volume tier discounts, promo code eligibility, shipping thresholds, and tax calculated strictly on server.
* [ ] Implement checkout session creation endpoint (`POST /api/checkout/session`).
* [ ] Integrate Razorpay (India: UPI, Cards, Netbanking) and Stripe Elements (Global Cards).
* [ ] Implement payment webhook endpoint (`POST /api/webhooks/payment`) with cryptographic HMAC-SHA256 signature verification.
* [ ] Implement atomic inventory decrement with row-level locks during order placement.
* [ ] Build order state machine: `PENDING` -> `PAID` -> `PROCESSING` -> `IN_TRANSIT` -> `DELIVERED`.

### Phase 5: External Services & Cloud Integrations
* [ ] Configure Cloudflare R2 / S3 image upload endpoint for admin product creation with MIME-type and size validation.
* [ ] Configure Resend email service with branded React Email templates for order confirmation receipts.
* [ ] Set up Shiprocket API integration for automated AWB generation and domestic pincode serviceability checks.

### Phase 6: SEO, Accessibility & Discoverability
* [ ] Audit and verify Open Graph tags, Twitter cards, and canonical URLs across all 22 routes.
* [ ] Validate JSON-LD structured data (`Product`, `Offer`, `Organization`, `FAQPage`, `BreadcrumbList`).
* [ ] Verify WCAG 2.2 AA compliance: keyboard focus rings, screen reader aria-labels, 4.5:1 text contrast on Warm Ivory and Deep Burgundy.

### Phase 7: Performance & Core Web Vitals Optimization
* [ ] Measure LCP, INP, and CLS baselines across desktop and mobile.
* [ ] Optimize hero garment textures (AVIF/WebP, capped 2048px).
* [ ] Implement explicit GPU memory cleanup (`geometry.dispose()`, `material.dispose()`) on Three.js unmount.
* [ ] Configure stale-while-revalidate caching headers for static assets and ISR catalog pages.

### Phase 8: Comprehensive Automated Testing Harness
* [ ] Install Vitest and React Testing Library.
* [ ] Implement unit test suite for pricing calculations, discount deductions, tax rules, and inventory reservation.
* [ ] Install Playwright and create E2E tests:
  - Customer journey: Home -> Shop -> Filter -> Product Detail -> Add to Bag -> Checkout -> Receipt.
  - Admin journey: Login -> Verify Protected Route -> Update Product -> Update Site Customizer CMS.

### Phase 9: Authorized Ethical Hacking & Hardening
* [ ] Execute automated and manual penetration tests in local environment.
* [ ] Test price tampering payloads, parameter pollution, and unverified discount codes.
* [ ] Verify IDOR protection: confirm customers cannot query or inspect other users' orders.
* [ ] Verify rate limiting on `/api/auth/*` and checkout session creation.

### Phase 10: Admin CMS & Business Operations
* [ ] Connect Admin Site Customizer (`/admin/settings`) to persistent database `site_settings` table.
* [ ] Add live preview toggle before publishing CMS updates.
* [ ] Implement audit trail: record every product edit, order status transition, and CMS change in `audit_logs`.

### Phase 11: Observability, SRE & Operations
* [ ] Integrate Sentry SDK with automatic error boundary instrumentation and PII data scrubbers.
* [ ] Set up structured JSON logging with request correlation IDs.
* [ ] Document automated database backup strategy (point-in-time recovery) and restoration verification runbook.

### Phase 12: Production Readiness & Release Gate
* [ ] Execute full pre-flight verification checklist.
* [ ] Verify all CI/CD quality gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
* [ ] Deploy to production hosting environment (Vercel / Cloudflare / AWS).
* [ ] Document zero-downtime rollback procedure.
