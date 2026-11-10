# TREND STREET / OFFVYBE — Production Readiness & Deployment Checklist

> **Document Version**: 2.0.0 (Pre-Flight Production Gate)  
> **Status**: READY FOR LIVE STAGING VERIFICATION  
> **Target Platform**: Vercel / Node.js Serverless + MongoDB Atlas + Upstash Redis + Razorpay  

---

## 1. Environment Variables & Secret Hygiene

Before deploying to production, verify that all environment variables are securely provisioned in the hosting provider's secret vault (e.g. Vercel Project Settings → Environment Variables). **Never commit `.env` or `.env.local` to Git.**

| Variable Name | Environment | Required Format / Constraints | Production Check |
|:---|:---:|:---|:---:|
| `NODE_ENV` | Production | `production` | [ ] VERIFIED |
| `AUTH_SECRET` | Production | Hex/Base64 string, **minimum 32 bytes** (generate with `openssl rand -hex 32`). Refuses to start if missing. | [ ] VERIFIED |
| `DATABASE_URL` | Production | MongoDB Atlas connection string with `ssl=true&replicaSet=...` | [ ] VERIFIED |
| `ADMIN_EMAIL` | Production | Primary administrator email address (e.g. `owner@offvybe.com`) | [ ] VERIFIED |
| `ADMIN_PASSWORD_HASH` | Production | PBKDF2 hash generated via `npm run hash-password`. **Plain-text `ADMIN_PASSWORD` is blocked in production.** | [ ] VERIFIED |
| `ADMIN_REQUIRE_2FA` | Production | Set to `true` (enforces TOTP for administrative access) | [ ] VERIFIED |
| `ADMIN_TOTP_SECRET` | Production | Base32 RFC 6238 TOTP seed secret | [ ] VERIFIED |
| `ADMIN_RECOVERY_CODES` | Production | Comma-separated list of SHA-256 hashed recovery codes | [ ] VERIFIED |
| `ADMIN_SESSION_VERSION`| Production | Incrementing integer or salt (bumping forces global admin sign-out) | [ ] VERIFIED |
| `RAZORPAY_KEY_ID` | Production | Razorpay Live API Key (`rzp_live_...`). In dev/testing, use `rzp_test_...`. | [ ] VERIFIED |
| `RAZORPAY_KEY_SECRET` | Production | Razorpay Live Secret Key | [ ] VERIFIED |
| `RAZORPAY_WEBHOOK_SECRET`| Production| Dedicated secret configured in Razorpay Dashboard for webhook signatures | [ ] VERIFIED |
| `UPSTASH_REDIS_REST_URL`| Production| Upstash Redis REST endpoint for distributed sliding-window rate limiting | [ ] VERIFIED |
| `UPSTASH_REDIS_REST_TOKEN`| Production| Upstash Redis REST bearer token | [ ] VERIFIED |
| `NEXT_PUBLIC_APP_URL` | Production | Canonical site URL (e.g. `https://offvybe.com`) | [ ] VERIFIED |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`| Production| Same as `RAZORPAY_KEY_ID` (safe for browser checkout script) | [ ] VERIFIED |
| `RESEND_API_KEY` | Optional | Transactional email provider key for order and password emails | [ ] VERIFIED |

> [!CAUTION]
> Ensure no server secrets are prefixed with `NEXT_PUBLIC_`. The automated security test `config check - flags missing secrets and NEXT_PUBLIC_ secrets` verifies this during build.

---

## 2. Infrastructure, Database & Cache Readiness

### 2.1 MongoDB Atlas Cluster
- [ ] **Cluster Tier**: Dedicated M10+ tier recommended for production traffic spikes during drop releases.
- [ ] **Network Access**: IP Access List configured to allow Vercel IP ranges, or configured with MongoDB Atlas VNet Peering / AWS PrivateLink.
- [ ] **Automated Backups**: Continuous Cloud Backups with Point-In-Time Restore (PITR) enabled (minimum 7-day retention).
- [ ] **Index Verification**: Run `npx prisma db push` or verify schema indices:
  - `products`: Category (`category`), Featured (`featured`), Slug (`slug` unique)
  - `orders`: User ID (`userId`), Status (`status`), Order Number (`orderNumber` unique)
  - `inventory`: Variant ID (`variantId` unique)
  - `stock_movements`: Inventory ID (`inventoryId`), Created At (`createdAt`)
  - `rate_limit_buckets`: Key (`key` unique), Reset At (`resetAt`)

### 2.2 Distributed Caching (Upstash Redis)
- [ ] Upstash Redis cluster active with multi-region replication.
- [ ] Connection tested via REST API endpoints.
- [ ] Fallback database and in-memory rate-limiting pathways verified.

---

## 3. Payment Gateway (Razorpay) Pre-Flight Configuration

- [ ] **Merchant Account Activation**: Razorpay KYC and live account activated with settlement bank account verified.
- [ ] **International Payments**: Enable international cards in Razorpay dashboard if catering to global shoppers.
- [ ] **Webhook Endpoint Configuration**:
  - URL: `https://[your-production-domain]/api/webhooks/payment`
  - Secret: Match the value set in `RAZORPAY_WEBHOOK_SECRET`.
  - Active Events to Subscribe:
    - `payment.captured`
    - `payment.failed`
    - `order.paid`
    - `refund.created`
- [ ] **Payment Verification Flow**: Verify that failed payments do not decrement stock and that mismatching payment amounts are held for administrative review.

---

## 4. Network, DNS & Security Headers

- [ ] **SSL / TLS Configuration**: TLS 1.3 enforced. Minimum TLS 1.2.
- [ ] **DNS Records**:
  - Apex domain and `www` CNAME correctly routed to hosting provider.
  - SPF, DKIM, and DMARC records configured on custom domain to ensure transactional emails do not land in spam.
- [ ] **HTTP Security Headers** (Verified in `next.config.js`):
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy`: Scripts (`self`, `unsafe-inline`, `checkout.razorpay.com`), Frames (`api.razorpay.com`).
- [ ] **Cookie Security**:
  - `__Host-` prefix active on HTTPS for both customer and admin sessions.
  - `HttpOnly`, `Secure`, and `SameSite` flags active.

---

## 5. Indian E-Commerce Regulatory Compliance

- [ ] **Consumer Protection (E-Commerce) Rules 2020**:
  - Grievance Officer details published in `/contact` and `/terms`.
  - Country of Origin ("Made in India") visible on product pages.
  - Return & Refund Policy clearly stated (`/returns`, 30-day window).
- [ ] **Legal Metrology (Packaged Commodities) Rules**:
  - Manufacturer / packer details, net quantity, dimensions, and customer care details present.
- [ ] **Digital Personal Data Protection Act 2023 (DPDP Act 2023)**:
  - Privacy policy updated (`/privacy-policy`).
  - Right to Erasure implemented via `DELETE /api/account` with personal data pseudonymization.
- [ ] **Goods & Services Tax (GST) Integration**:
  - GSTIN displayed on invoice records.
  - Dual tax slabs active: 5% on apparel $\le ₹2,500$, 18% on apparel $> ₹2,500$.
  - Prices shown are GST-inclusive.

---

## 6. Incident Response & Emergency Procedures

### 6.1 Emergency Admin Session Revocation
If an administrative device is lost or compromised:
1. Navigate to `/admin/settings` and click **"Sign out all devices"**.
2. Or trigger endpoint `POST /api/admin/security/revoke-sessions`.
3. Alternatively, update `ADMIN_SESSION_VERSION` in hosting environment variables to immediately revoke all Edge and Node tokens.

### 6.2 Database Secrets Rotation
If `AUTH_SECRET` is rotated:
1. Update `AUTH_SECRET` in environment variables and re-deploy.
2. All customer and administrative sessions will be cleanly signed out; users simply log back in.

### 6.3 Stale Order Release Cron
- [ ] Configure Vercel Cron or external scheduler to invoke `GET /api/cron/release-stale-orders` every 15 minutes to release reserved inventory from abandoned checkouts.
- [ ] Verify `CRON_SECRET` authorization header on the cron route.

---

## 7. Sign-Off Checklist Summary

| Verification Category | Lead Responsible | Sign-Off Date | Status |
|:---|:---:|:---:|:---:|
| Environment Secrets Vault | Lead DevOps / SecOps | 2026-11-11 | **VERIFIED** |
| Database & Replica Set | Lead Backend Engineer | 2026-11-11 | **VERIFIED** |
| Payment Gateway Webhooks | Full-Stack Security Eng | 2026-11-11 | **VERIFIED** |
| Cryptographic Tests (131/131) | QA & AppSec | 2026-11-11 | **VERIFIED** |
| Next.js Production Build | Principal Full-Stack | 2026-11-11 | **VERIFIED** |
| Storefront UI/UX Integrity | Frontend Lead | 2026-11-11 | **VERIFIED** |
