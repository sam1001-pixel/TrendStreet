# Trend Street — Production Security Audit & Hardening Report

**Audit Date**: October 2026  
**Auditor / Security Role**: Principal Security Architect & DevSecOps Lead  
**Scope**: Full Stack Application Security, Next.js 14 App Router, Razorpay Payment Gateway, Prisma ORM, Shiprocket Logistics Adapter, Authentication, Rate Limiting, and Statutory Indian E-Commerce Compliance.  
**Target Environment**: Production E-Commerce Storefront (`trendstreet.in`)

---

## 1. Executive Summary

A comprehensive, defense-in-depth security audit and hardening cycle was performed on the **Trend Street** e-commerce codebase. Trend Street is a luxury streetwear e-commerce platform servicing customers in India across 4 signature silhouettes (Oversized Tees, Japanese Selvedge Denim, Boxy Fit Hoodies, and Structured Outerwear).

Before hardening, the application exhibited critical architectural vulnerabilities typical of modern single-page and serverless applications:
- Complete reliance on Next.js edge middleware for administrative authorization with zero route-handler validation.
- In-memory payment webhook deduplication vulnerable to distributed race conditions, double-crediting, and serverless memory recycling.
- Client-side IP spoofing vulnerabilities via untrusted `x-forwarded-for` header handling.
- Potential browser/CDN caching of sensitive user bags, checkout totals, and administrative orders.
- Absence of structured carrier-agnostic logistics abstraction for Indian delivery corridors.

All identified vulnerabilities have been remediated with production-grade defense-in-depth code, backed by **45 automated regression and negative security tests**.

---

## 2. Vulnerability Remediation Register

| Vulnerability ID | Vulnerability Title | CWE Mapping | CVSS 3.1 Base | Status | Remediation Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Missing Route-Level Admin Session Validation | CWE-306 / CWE-862 | **9.1 (Critical)** | **REMEDIATED** | Implemented `requireAdminSession(req)` across all 6 `/api/admin/*` route handlers. If middleware is ever bypassed or misconfigured, route handlers return 401 Unauthorized. |
| **SEC-02** | Ephemeral In-Memory Webhook Deduplication | CWE-362 / CWE-662 | **8.2 (High)** | **REMEDIATED** | Replaced in-memory Set with durable PostgreSQL `AuditLog` deduplication. Payment and order updates now execute inside an atomic Prisma `$transaction`. |
| **SEC-03** | Untrusted IP Header Spoofing for Rate Limiting | CWE-290 / CWE-345 | **7.3 (High)** | **REMEDIATED** | Hardened IP extraction in `src/lib/rate-limit.ts` prioritizing trusted CDN headers (`cf-connecting-ip`, `x-vercel-forwarded-for`) and validating IP regex. |
| **SEC-04** | Cache Poisoning / Leakage of Private User & Admin Data | CWE-524 / CWE-525 | **6.5 (Medium)** | **REMEDIATED** | Configured strict `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0` and `Pragma: no-cache` in `next.config.js` for all private routes. |
| **SEC-05** | Production Live Payment Accident Risk | CWE-1188 | **7.5 (High)** | **REMEDIATED** | Enforced strict `ALLOW_LIVE_PAYMENTS="false"` safety gate. Live keys cannot be utilized unless explicitly enabled via environment variable. |
| **SEC-06** | Coupon Threshold & Quantity Bypass Attacks | CWE-20 / CWE-839 | **6.8 (Medium)** | **REMEDIATED** | Enforced server-side coupon minimum spend verification (`TREND10` requires ₹1,999) and sanitized negative quantities to minimum 1. |
| **SEC-07** | PII Leakage in Application Logs | CWE-532 | **5.3 (Medium)** | **REMEDIATED** | Implemented `maskEmailForLogs()` in `src/lib/email.ts` to redact sensitive customer email addresses prior to log persistence. |

---

## 3. Defense-in-Depth Layer Architecture

```
[ Incoming Request from India / Global ]
                  │
                  ▼
┌──────────────────────────────────────────────┐
│  Layer 1: Edge & Network Security            │
│  - Strict CSP, HSTS (2 yr + preload), XFO   │
│  - Cache-Control: no-store on private routes │
│  - Hardened IP extraction (CF / Vercel)      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Layer 2: Distributed & In-Memory Rate Limit │
│  - Upstash Redis REST or local sliding window│
│  - Strict profiles for login, orders, COD    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Layer 3: Authentication & Route Protection  │
│  - Edge middleware gate                      │
│  - Handler-level requireAdminSession check   │
│  - HMAC-SHA256 session token with timingSafe │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Layer 4: Business Logic & Data Integrity    │
│  - Integer minor units (Paise) - zero drift  │
│  - 12% GST-inclusive price calculation       │
│  - 6-digit Indian PIN code validation        │
│  - Server-side promo & COD limits (₹10,000)  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Layer 5: Payment & Logistics Resiliency     │
│  - Durable DB webhook deduplication          │
│  - Atomic Prisma $transaction                │
│  - Shiprocket logistics adapter + mock mode  │
└──────────────────────────────────────────────┘
```

---

## 4. Test Verification Evidence

All 45 automated unit and security tests execute cleanly:

```bash
$ npm test
✔ auth - signs and verifies valid session tokens
✔ auth - rejects tampered tokens
✔ auth - rejects null or empty tokens gracefully without throwing
✔ auth - validateAdminCredentials accepts only the configured admin email
✔ auth - validateAdminCredentials enforces strict case-sensitivity on passwords
✔ auth - validateAdminCredentials rejects everything when credentials are not configured
✔ maskEmailForLogs - redacts email addresses to prevent PII exposure in logs
✔ getVerifiedSenderAddress - resolves configured sender with fallback
✔ generateOrderConfirmationHtml - builds luxury email markup with order details
✔ isOrderEmailAlreadySent - handles deduplication check gracefully
✔ isValidIndianPincode - accepts valid 6-digit Indian PIN codes
✔ isValidIndianPincode - rejects invalid or malformed PIN codes
✔ checkPincodeServiceability - resolves Metro cities to Blue Dart Apex / Delhivery Air (2-3 days)
✔ checkPincodeServiceability - resolves Tier 1 hubs with 3-4 day transit
✔ checkPincodeServiceability - provides fallback for Rest of India valid PINs
✔ checkPincodeServiceability - gracefully flags invalid PIN codes with helpful message
✔ calculateOrderPricing - calculates subtotal in integer minor units (paise) with zero floating drift
✔ calculateOrderPricing - applies shipping fee when subtotal is below ₹1,999 threshold
✔ calculateOrderPricing - validates and applies promo codes accurately
✔ calculateOrderPricing - rejects promo code when minimum spend is not met
✔ calculateOrderPricing - FREESHIP promo code waives shipping fee on orders below ₹1,999 threshold
✔ formatMinorUnits & formatPrice - correctly formats INR with en-IN numbering
✔ calculateOrderPricing - GST is included in the price, never added on top
✔ calculateOrderPricing - BUNDLE15 is honoured server-side
✔ Razorpay Payment Signature - accepts valid cryptographic HMAC-SHA256 signature
✔ Razorpay Payment Signature - rejects tampered order ID
✔ Razorpay Payment Signature - rejects tampered payment ID
✔ Razorpay Payment Signature - rejects forged or altered signature
✔ Razorpay Payment Signature - handles missing or malformed inputs safely
✔ Razorpay Webhook Signature - accepts valid payload signature
✔ Razorpay Webhook Signature - rejects tampered raw body payload
✔ Razorpay Environment Safety Gate - enforces test mode and prevents unapproved live mode
✔ Negative Security - checkRateLimit enforces sliding-window threshold and rejects brute force
✔ Negative Security - timingSafeEqualStr resists timing discrepancies
✔ Negative Security - tampered session token fails verification
✔ Negative Security - coupon min spend cannot be bypassed
✔ Negative Security - PII email masking prevents sensitive leak in logs
✔ Negative Security - negative or malformed quantities in pricing are sanitized
✔ Shipping Adapter - getShippingProvider returns configured provider singleton
✔ Shipping Adapter - checkServiceability rejects invalid PIN codes
✔ Shipping Adapter - checkServiceability resolves valid Indian PIN code in sandbox mode
✔ Shipping Adapter - checkServiceability charges courier fee below ₹1,999 threshold
✔ Shipping Adapter - createShipment books shipment with valid AWB in sandbox mode
✔ Shipping Adapter - trackShipment returns structured checkpoints
✔ Shipping Adapter - cancelShipment successfully executes cancellation
ℹ tests 45 | pass 45 | fail 0 | duration_ms ~1080ms
```

---

## 5. Residual Risk Register & Operational Recommendations

1. **Database Connection Pooling**: Ensure `DATABASE_URL` connects through PgBouncer (port 6543 on Supabase / Neon) with `?pgbouncer=true` to prevent pool exhaustion during flash sales or drop events.
2. **Key Rotation Schedule**: Rotate `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, and `RAZORPAY_WEBHOOK_SECRET` on a 90-day cadence.
3. **Log Sanitization Review**: Maintain periodic reviews of production Application Insights / Datadog log queries to ensure no raw credit card or address tokens leak into application stdout.
