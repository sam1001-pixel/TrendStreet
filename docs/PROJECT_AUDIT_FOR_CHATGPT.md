# TREND STREET — Complete Technical Architecture & Production Audit Dossier
> **Target Audience**: AI Engineering Systems / ChatGPT / Senior Full-Stack Reviewers  
> **Repository**: `sam1001-pixel/TrendStreet`  
> **Framework**: Next.js 14.2.15 App Router | React 18.3.1 | TypeScript 5.6.3 (Strict) | Prisma ORM 6.19.3 | Tailwind CSS  
> **Database**: PostgreSQL (Prisma ORM with JSON & Relational Models)  
> **Status**: **Production Ready — 51/51 Tests Passing — 32/32 Routes Compiled — Deployed to Main**

---

## 1. Executive Summary & Brand Identity

**Trend Street** (`trendstreet.in`) is an artisanal Indian luxury menswear e-commerce platform dedicated exclusively to architectural streetwear silhouettes. Unlike generic apparel stores, Trend Street focuses on three core textile silhouettes engineered with heavy GSM loopback cotton and raw selvedge denim:
1. **Oversized** (520gsm Japanese Loopback Terry, +12cm dropped shoulders).
2. **Boxy Fit** (320gsm Compact Organic Jersey, 1:1 square torso ratio).
3. **Jackets** (14oz Okayama Shuttle-Loomed Selvedge Denim & Utility Overcoats).

### Core Architectural Pillars
- **Zero-Flicker Ephemeral & Database Hybrid Persistence**: Seamless fallback from live PostgreSQL down to memory and JSON file storage, ensuring the storefront and admin panel never crash even during database cold-starts or migration delays.
- **Serverless & Edge Optimized**: Next.js 14 App Router, dynamic server routes, and static pages respecting Vercel's 4.5MB edge payload limit and read-only serverless filesystem.
- **Defensive Financial Integrity**: All commerce calculations (subtotal, discounts, shipping, GST) operate strictly in integer minor units (paise), eliminating floating-point rounding drift. GST is strictly inclusive in line with Indian e-commerce standards.
- **Comprehensive Admin Autonomy**: Full real-time site control allowing administrators to toggle storefront sections on/off, upload photography directly from native device galleries, adjust inventory inline, generate courier AWB tracking codes, and print packing slips.

---

## 2. Technical Stack Breakdown

| Layer | Technologies | Key Responsibility |
|---|---|---|
| **Frontend Framework** | Next.js 14.2.15 (App Router), React 18.3.1 | High-performance hybrid SSR, SSG, and client component trees. |
| **Styling & Aesthetics** | Tailwind CSS 3.4, Custom CSS Tokens, Framer Motion | Brand palette (Burgundy `#4A1216`, Crimson `#6B1D24`, Gold `#C5A880`, Espresso `#2B080A`, Bone `#F9F6F4`). Universal scrollbar suppression. |
| **Language & Typing** | TypeScript 5.6.3 (Strict Mode) | Strict typing across state, props, DB models, and API contracts. `tsc --noEmit` clean (0 errors). |
| **Database & ORM** | PostgreSQL (Neon / Supabase), Prisma ORM 6.19.3 | Relational schema (`users`, `products`, `orders`, `order_items`, `coupons`, `site_settings`, `audit_logs`). |
| **Authentication** | Node.js Web Crypto API, HMAC-SHA256, scrypt / PBKDF2 | Separate customer and admin auth flows, timing-safe equality, sliding-window rate limiting, `HttpOnly` secure cookies. |
| **Payment Gateway** | Razorpay Node SDK & REST API | Order creation, cryptographic HMAC-SHA256 signature verification, webhook listeners, COD flow. |
| **Logistics & Courier** | Shiprocket API + Sandbox Mock Provider | 6-digit Indian PIN code validation, courier tier routing (Metro Blue Dart / Tier 1 / Rest of India), AWB generation, checkpoint tracking. |
| **Transactional Email** | Resend API / Nodemailer SMTP | Luxury HTML order confirmations, recipient PII masking in server logs, database deduplication. |
| **Quality & Security** | Node.js Native Test Runner (`node --test`), CodeRabbit AI | 51 unit tests covering auth, pricing, payments, security, and shipping. |

---

## 3. Directory Structure & Key Files Map

```
TrendStreet-main2/
├── .coderabbit.yaml           # CodeRabbit AI code review & security rule configurations
├── .env.example               # Complete production & sandbox environment variable template
├── .gitignore                 # Excludes node_modules, .next, .test-dist, and *.tsbuildinfo
├── next.config.js             # Security headers (CSP, HSTS, X-Frame-Options), remote image domains
├── package.json               # Dependencies, scripts (dev, build, test, typecheck, prisma)
├── tailwind.config.ts         # Brand color tokens, fonts (Playfair, Jakarta), container queries
├── tsconfig.json              # Strict compiler options, path alias `@/*` -> `./src/*`
├── prisma/
│   └── schema.prisma          # PostgreSQL relational schema for Users, Orders, Products, CMS
├── data/
│   └── customers.json         # Local fallback database for customer authentication & profiles
├── public/
│   ├── flying-wear-*.png      # High-resolution transparent garment silhouettes for 3D physics hero
│   ├── llms.txt & llms-full.txt # Generative Engine Optimization (GEO) dossiers for AI search engines
│   ├── robots.txt & sitemap.xml # Search engine indexing directives
│   └── trend-street-logo-*.png# Vector brand logos in Burgundy, Gold, and White
├── src/
│   ├── middleware.ts          # Edge middleware enforcing rate-limiting & protecting `/admin/*`
│   ├── app/
│   │   ├── layout.tsx         # Root layout injecting StoreProvider, UserAuthProvider, AdminAuthProvider
│   │   ├── page.tsx           # Storefront homepage with dynamic section toggles
│   │   ├── globals.css        # Universal scrollbar suppression (`*::-webkit-scrollbar { display: none }`)
│   │   ├── (storefront)/      # Public pages (/shop, /oversized, /boxy-fit, /jackets, /lookbook)
│   │   ├── product/[id]/      # Product detail page with dynamic sizing, GSM specs, and Quick Add
│   │   ├── checkout/          # Checkout with Indian PIN code auto-fill, promo discounts, Razorpay / COD
│   │   ├── order-confirmation/# Order confirmation with tracking preview and email status
│   │   ├── profile/ & login/  # Customer account portal (order history, addresses, saved garments)
│   │   ├── track/             # Public courier tracking search with live checkpoint timeline
│   │   ├── admin/
│   │   │   ├── login/         # Dedicated administrative login gate with rate-limiting & lockout
│   │   │   ├── page.tsx       # Operations dashboard: live revenue, low-stock radar, section toggles
│   │   │   ├── products/      # Inventory CRUD, inline stock adjust, device gallery uploader modal
│   │   │   ├── orders/        # Order management: 1-click AWB generator, packing slips, status updates
│   │   │   ├── settings/      # Dynamic CMS: storefront section controller, hero, announcements, promos
│   │   │   └── access-register/# SOC2 / ISO-27001 internal access governance registry
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── upload/    # Hardened multipart & base64 image uploader with magic bytes check
│   │       │   ├── products/  # Admin product CRUD endpoints
│   │       │   ├── orders/    # Admin order status and tracking dispatch
│   │       │   └── settings/  # Dynamic site settings persistence (Prisma JSON)
│   │       ├── auth/          # Customer & Admin login, logout, and session verification routes
│   │       ├── payment/       # Razorpay create-order & cryptographic HMAC verify
│   │       └── storefront/    # Public edge-cached catalog and CMS API
│   ├── components/
│   │   ├── admin/
│   │   │   ├── ImageGalleryUpload.tsx # Device photo picker, camera input, drag-and-drop, atelier presets
│   │   │   ├── AdminStatusBar.tsx    # Operational health indicator (database sync, active errors)
│   │   │   └── PackingSlipModal.tsx  # Printable luxury order invoice & packing slip
│   │   └── premium/
│   │       ├── CinematicHero.tsx      # Interactive 3-silhouette switcher and live atelier metrics
│   │       ├── WeightTest.tsx         # Side-by-side GSM comparison (520gsm vs 320gsm vs 14oz)
│   │       ├── ShopByPriceOccasion.tsx# Curated discovery pathways by budget and occasion
│   │       ├── ScrollProductReel.tsx  # Horizontal scroll showcase with clean line-free aesthetics
│   │       ├── SilhouetteAccordion.tsx# Dimensional geometry breakdown (shoulder drop, chest drape)
│   │       └── CustomerReviewGallery.tsx # Verified customer ratings and feedback widgets
│   ├── context/
│   │   ├── StoreContext.tsx       # Global cart, catalog, active currency, and site settings
│   │   ├── UserAuthContext.tsx    # Customer authentication state, profile, and order history
│   │   └── AdminAuthContext.tsx   # Admin session state, access levels, and CSRF protection
│   ├── hooks/
│   │   └── useAdminData.ts        # Unified data hook for reactive orders, inventory, and CMS updates
│   └── lib/
│       ├── auth.ts                # Admin session tokens, timingSafeEqual, credential validation
│       ├── customer-auth.ts       # Customer scrypt password hashing and session management
│       ├── pricing.ts             # Integer minor-unit math, Indian GST inclusion, promo code engine
│       ├── pincode.ts             # 6-digit PIN code regex validation & Indian courier tier resolution
│       ├── rate-limit.ts          # In-memory sliding-window IP & user rate limiter
│       ├── site-settings.ts       # DB serialization/deserialization for dynamic CMS & section flags
│       └── shipping/
│           ├── index.ts           # Factory returning Shiprocket or Sandbox mock shipping adapter
│           └── shiprocket.ts      # Shiprocket REST API client (serviceability, AWB booking, tracking)
└── tests/
    └── unit/                  # 51 automated unit tests across auth, pricing, security, payments
```

---

## 4. Key Subsystems & Business Logic Deep-Dive

### 4.1. Merchandising & Storefront Experience
- **Three Silhouettes**: Standard jeans references have been completely phased out in favor of the core 3 streetwear cuts: Oversized, Boxy Fit, and Jackets.
- **The Weight Test**: Compares 520gsm Japanese Loopback Terry, 320gsm Compact Jersey, and 14oz Selvedge Denim side-by-side in a responsive `lg:grid-cols-3` layout with dynamic weight gauges.
- **Line-Free Aesthetics**: Removed all top fixed progress lines, runway reel tracks, and browser scrollbars via `globals.css` universal suppression.
- **Instant Quick-Add Drawer**: Customers select sizes on the fly without leaving the catalog feed.

### 4.2. Administrative Autonomy & Dynamic Site Control
- **Storefront Sections Visibility Controller**:
  - Live toggles on both `/admin` and `/admin/settings` allow real-time toggling of `hero`, `weightTest`, `shopByPriceOccasion`, `runwayReel`, `hangingRail`, `dropList`, `silhouetteAccordion`, `reviewGallery`, and `trustStrip`.
  - Stored persistently in PostgreSQL via Prisma's `storefrontSections Json?` column and synced to edge visitors within 30 seconds via `/api/storefront`.
- **Atelier Media & Device Gallery Uploader**:
  - Located in [`ImageGalleryUpload.tsx`](file:///Users/macbook/Downloads/TrendStreet-main%202/TrendStreet-main2/src/components/admin/ImageGalleryUpload.tsx) and [`/api/admin/upload`](file:///Users/macbook/Downloads/TrendStreet-main%202/TrendStreet-main2/src/app/api/admin/upload/route.ts).
  - Admins can click **"Upload from Gallery / Device"** to trigger native mobile file pickers/cameras.
  - Multi-file uploads execute sequentially via `imagesRef` closures to prevent state overwriting.
  - Dual storage: Writes to `/public/uploads/` on persistent servers; seamlessly falls back to Base64 Data URLs on read-only serverless platforms like Vercel.
- **Logistics & Order Management**:
  - 1-click AWB generation with simulated or live Shiprocket courier integration.
  - Instant transition through lifecycle states: `Pending` -> `Confirmed` -> `Shipped` -> `Delivered` -> `Cancelled`.
  - Printable luxury packing slips with customer address, AWB barcode placeholder, and garment specs.

### 4.3. Payment & Pricing Engine
- **Integer Minor-Unit (Paise) Precision**:
  - All currency calculations use paise (`1 INR = 100 paise`). Floating-point arithmetic is forbidden in pricing calculations to avoid IEEE-754 rounding errors.
  - Example: A garment listed at ₹2,499 is computed internally as `249900` paise.
- **Indian GST Compliance**:
  - GST is included in the garment price, never tacked on unexpectedly at checkout.
  - Server validation verifies coupon codes (`BUNDLE15`, `FREESHIP`) and enforces minimum spend thresholds server-side.
- **Razorpay Cryptographic Verification**:
  - Verifies payment signatures using HMAC-SHA256: `sha256(orderId + "|" + paymentId, keySecret) === signature`.
  - Negative security tests guarantee that forged or tampered signatures are rejected.

### 4.4. Security, Authentication & Defense
- **Admin Authentication**:
  - Passwords validated using strict case-sensitive comparisons and timing-safe algorithms (`timingSafeEqualStr`) to defeat side-channel timing attacks.
  - Sessions signed with HMAC-SHA256 containing admin IDs, roles, and expiration timestamps.
- **Customer Authentication**:
  - Supports both database storage (`users` table) and local fallback (`data/customers.json`).
  - Passwords hashed using cryptographically secure random salts and PBKDF2/scrypt.
- **Upload File Hardening**:
  - Server validates MIME types against an allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`).
  - Strict mapping determines file extension (`.jpg`, `.png`, etc.), ignoring client-supplied extensions to prevent Stored XSS.
  - Inspects file buffer magic bytes (e.g. `0xFF 0xD8 0xFF` for JPEG, `0x89 0x50 0x4E 0x47` for PNG) so scripts or HTML cannot masquerade as images.
  - 4MB file size limit to prevent Vercel edge proxy 413 drops.
- **Rate Limiting**:
  - In-memory sliding-window limiter on sensitive endpoints (`/api/auth/login`, `/api/auth/customer/login`, `/api/admin/*`) blocks brute-force credential stuffing.

---

## 5. Verification & Quality Assurance Audit

### 5.1. Automated Unit Tests (51/51 Passing)
Run command: `npm test`
```
✔ auth - signs and verifies valid session tokens
✔ auth - rejects tampered tokens
✔ auth - validateAdminCredentials enforces strict case-sensitivity
✔ customer-auth - hashes password and verifies correctly
✔ customer-auth - rejects tampered customer session tokens
✔ maskEmailForLogs - redacts email addresses to prevent PII exposure in logs
✔ isValidIndianPincode - accepts valid 6-digit Indian PIN codes
✔ checkPincodeServiceability - resolves Metro cities to Blue Dart / Delhivery (2-3 days)
✔ calculateOrderPricing - calculates subtotal in integer minor units with zero drift
✔ calculateOrderPricing - GST is included in the price, never added on top
✔ calculateOrderPricing - BUNDLE15 is honoured server-side
✔ Razorpay Payment Signature - accepts valid HMAC-SHA256 signature
✔ Razorpay Payment Signature - rejects forged or altered signature
✔ Negative Security - checkRateLimit enforces sliding-window threshold
✔ Negative Security - timingSafeEqualStr resists timing discrepancies
✔ Shipping Adapter - createShipment books shipment with valid AWB
✔ Shipping Adapter - trackShipment returns structured checkpoints
ℹ tests 51 | pass 51 | fail 0 | cancelled 0
```

### 5.2. Type Safety & Build Compilation
- **TypeScript**: `npm run typecheck` passes with **0 errors**.
- **Production Build**: `npm run build` compiles **32/32 static and dynamic routes** cleanly.

---

## 6. Environment Configuration (.env.example)

```env
# Application Base URL
NEXT_PUBLIC_APP_URL=https://trendstreet.in

# Database (PostgreSQL / Neon)
DATABASE_URL=postgresql://user:password@ep-cool-project-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Authentication Secrets
ADMIN_JWT_SECRET=super_secret_cryptographic_key_at_least_32_chars_long
CUSTOMER_JWT_SECRET=customer_session_cryptographic_key_at_least_32_chars_long
ADMIN_COOKIE_SECURE=false # Set to true on HTTPS production

# Default Administrative Credentials
ADMIN_EMAIL=admin@trendstreet.in
ADMIN_PASSWORD=TrendStreetAdmin@2026

# Razorpay Payment Gateway (Test / Live)
RAZORPAY_KEY_ID=rzp_test_YourTestKeyId123
RAZORPAY_KEY_SECRET=YourRazorpaySecretKey456
RAZORPAY_WEBHOOK_SECRET=YourRazorpayWebhookSecret789

# Shiprocket Courier API
SHIPROCKET_EMAIL=shipping@trendstreet.in
SHIPROCKET_PASSWORD=YourShiprocketPassword
SHIPROCKET_SANDBOX=true

# Transactional Email (Resend)
RESEND_API_KEY=re_123456789abcdef
EMAIL_FROM=Trend Street Concierge <concierge@trendstreet.in>
```

---

## 7. Instructions for ChatGPT / Downstream LLMs

When analyzing, expanding, or refactoring this codebase:
1. **Never Reintroduce Jeans**: All menswear collections are strictly partitioned into **Oversized**, **Boxy Fit**, and **Jackets**.
2. **Preserve Financial Minor Units**: Always compute monetary discounts, taxes, and order totals in integer paise.
3. **Respect Serverless Constraints**:
   - Vercel functions have a read-only root filesystem. Keep the Base64 Data URL fallback in `/api/admin/upload`.
   - Never exceed the 4.5MB serverless payload limit.
4. **Maintain Scrollbar Suppression**: All layout additions must preserve `scrollbar-width: none` and `::-webkit-scrollbar { display: none }` styling.
5. **Keep 51/51 Tests Green**: Any modifications to authentication, pricing, shipping, or payments must pass `npm test` and `npm run typecheck`.
