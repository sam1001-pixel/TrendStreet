# TREND STREET — Master Project Brief, Technical Architecture & ChatGPT Context Dossier

> **Dossier Version**: 1.0.0  
> **Repository**: `trend-street`  
> **Target Audience**: AI Engineering Assistants (ChatGPT / Claude / Copilot), Senior Full-Stack Engineers, Product Managers  
> **Last Verified**: October 2026 (Next.js 14 App Router, TypeScript 5.6 strict mode, 0 lint/compile errors)

---

## 1. Executive Summary & Brand Identity

### 1.1 Brand Identity & Niche
* **Brand Name**: **Trend Street**
* **Brand Tagline**: *The Style Hub*
* **Primary Niche**: **High-End Architectural Streetwear & Luxury Menswear**
* **Core Philosophy**: Merging Savile Row construction standards with brutalist Japanese and Tokyo streetwear silhouettes. Engineered around substantial fabric density, exaggerated shoulder drops, cropped geometric torsos, and untreated selvedge indigo denim.
* **Core Product Silhouettes (Exclusively 4 Pillars)**:
  1. **Oversized**: 320gsm–520gsm Japanese French loopback cotton tees, drop-shoulder hoodies, and heavy cardigans.
  2. **Jeans**: 14oz–15oz Okayama redline shuttle-loom selvedge denim, wide-leg carpenter pants with utility hammer loops, and calibrated sneaker-puddle stacks.
  3. **Boxy Fit**: 1:1 square torso ratio cropped at the natural waistline, 220gsm mercerized poplin overshirts, and Italian extra-fine merino knits.
  4. **Jackets**: Florentine lambskin reverse-suede flight bombers, 16oz rugged duck canvas work jackets, and Swiss Raccagni two-way antiqued brass hardware.
  > *Strict Scope Rule*: Trend Street exclusively manufactures and sells these 4 garment silhouettes. Footwear, traditional formal business suits, and fast-fashion accessories are deliberately excluded.

### 1.2 Official Color Palette (Tokens)
Configured inside `tailwind.config.ts` and `src/app/globals.css`:

| Role | Color Name | Hex Code | RGB | Primary Usage |
|------|------------|----------|-----|---------------|
| **Primary** | Deep Burgundy | `#4A1216` | `rgb(74, 18, 22)` | Brand logo, primary buttons, headers, active accents |
| **Highlight** | Crimson | `#6B1D24` | `rgb(107, 29, 36)` | Hover states, sale pills, interactive highlights |
| **Shadow / Dark** | Dark Espresso | `#2B080A` | `rgb(43, 8, 10)` | Footers, dark modal backdrops, typography headings |
| **Canvas / Background** | Warm Ivory | `#F9F6F4` | `rgb(249, 246, 244)` | Page background canvas (allows burgundy logo to pop) |
| **Metallic Accent** | Sartorial Gold | `#C5A880` | `rgb(197, 168, 128)` | VIP badges, fabric spec counters, borders, luxury trims |

### 1.3 Brand Logo Architecture
* **Center Header Stage**: The authentic burgundy crest and serif wordmark are rendered via `src/components/Logo.tsx` centered in the primary header with zero overlap or layout shifts.
* **Assets**:
  - `public/trend-street-logo-burgundy.png` (Default on Warm Ivory)
  - `public/trend-street-logo-gold.png` (Gold variant for Dark Espresso surfaces)
  - `public/trend-street-logo-white.png` (Clean contrast)

---

## 2. Technical Stack & Dependencies

```
-------------------------------------------------------------------------------
Layer                 Technology                       Version
-------------------------------------------------------------------------------
Core Framework        Next.js (App Router)            14.2.15
Language              TypeScript (Strict Mode)        5.6.3
Frontend UI           React / React-DOM               18.3.1
Styling Engine        Tailwind CSS + PostCSS          3.4.14
3D WebGL Engine       Three.js + @types/three         0.169.0
Motion & Physics      Framer Motion                   11.11.17
Iconography           Lucide React                    0.454.0
Class Utilities       clsx + tailwind-merge           Latest
Linter / Formatter    ESLint (eslint-config-next)     8.57.1
-------------------------------------------------------------------------------
```

---

## 3. Architecture & System Workflows

```
                                  +-----------------------------+
                                  |    Next.js 14 App Router    |
                                  +--------------+--------------+
                                                 |
         +---------------------------------------+---------------------------------------+
         |                                                                               |
         v                                                                               v
+-------------------------------+                                               +-------------------------------+
|     Public Customer Store     |                                               |     Private Admin Portal      |
|                               |                                               |  (URL: /admin, hidden link)   |
| • / (Homepage with 3D/Capsule)|                                               |                               |
| • /shop (Catalog & Filters)   |                                               | • /admin/login (Protected)    |
| • /oversized, /jeans, etc.    |                                               | • /admin (KPI Dashboard)      |
| • /product/[id] (Detail)      |                                               | • /admin/settings (CMS Sync)  |
| • /bag & /checkout            |                                               | • /admin/products (CRUD)      |
| • /saved (Wishlist)           |                                               | • /admin/orders (Fulfillment) |
| • /lookbook & /about          |                                               | • /admin/access-register      |
+---------------+---------------+                                               +---------------+---------------+
                |                                                                               |
                +---------------------------------------+---------------------------------------+
                                                        |
                                                        v
                                        +-------------------------------+
                                        |    StoreContext & Hydration   |
                                        |   (localStorage Persistence)  |
                                        +---------------+---------------+
                                                        |
                     +----------------------------------+----------------------------------+
                     |                                  |                                  |
                     v                                  v                                  v
       +----------------------------+    +----------------------------+     +----------------------------+
       |      Products & Orders     |    |   Cart, Wishlist, User     |     |    SiteSettings CMS Hub    |
       |  • CRUD garments catalog   |    |  • Bag item calculations   |     |  • Top announcement banner |
       |  • Live order fulfillment  |    |  • Wishlist toggles        |     |  • Hero headlines & stats  |
       |  • Inventory tracking      |    |  • Custom promo discounts  |     |  • Silhouette taglines     |
       +----------------------------+    +----------------------------+     |  • Marquee phrases & phone |
                                                                            +----------------------------+
```

### 3.1 StoreContext (`src/context/StoreContext.tsx`)
Acts as the central single source of truth for the browser session:
1. **Products Catalog**: Seeded with 12 high-fashion garments (`src/data/products.ts`), updated via `addProduct()`, `updateProduct()`, and `deleteProduct()`. Persisted to `localStorage` under `ts_products`.
2. **Shopping Bag**: Handles additions with size, color, and quantity tracking. Computes `cartSubtotal`, free courier thresholds ($200), dynamic discount cuts, courier fees, tax, and `cartTotal`.
3. **Wishlist**: Toggles garment IDs, persisted to `localStorage` under `ts_wishlist`.
4. **Order Processing**: Generates orders with sequential order numbers (`TS-2026-XXXX`), shipping tracking numbers, and delivery ETAs.
5. **SiteSettings (Dynamic CMS)**:
   - Controls top announcement banner (active toggle, text, link).
   - Controls hero headline line 1 & line 2, badge, subtitle, CTA links, and 3 live metrics counters.
   - Controls marquee ticker phrases.
   - Controls category taglines across all 4 pillars.
   - Controls active promo codes and discount percentages (e.g. `TREND10`, `VIP20`, `FREESHIP`).
   - Controls customer concierge phone, email, hours, and atelier address.
   - Live updates apply immediately across the entire storefront via `updateSiteSettings()` with `localStorage` key `ts_site_settings`.

### 3.2 AdminAuthContext (`src/context/AdminAuthContext.tsx`)
1. **Administrative Authentication**: Handles login state using ID `sujal@.com` and configured password `[REDACTED-rotate-this-password]`.
2. **Session Storage**: Saves auth state in `localStorage` under `ts_admin_auth`.
3. **Route Guard**: Automatically routes unauthenticated visitors attempting to view `/admin/*` to `/admin/login`.
4. **Access Governance**: Maintains the administrative access register for compliance review (CISO/audit logs).

### 3.3 Public Storefront vs. Admin Separation (Strict Privacy)
* **Zero Visible Admin Indicators**: The public customer site contains **no** "Admin", "Admin Login", "Atelier Admin Portal", or email references in headers, footers, mobile drawers, or mobile bottom navigation.
* **Direct Access Only**: The administrative portal is accessed exclusively by entering `/admin` or `/admin/login` directly into the browser URL bar.
* **Clean Login Prompt**: The login page displays a clean, unrevealing authentication prompt without displaying sensitive credentials or helper callouts on screen.

### 3.4 3D Floating Wear vs. Mobile Touch Architecture
* **Desktop Viewport (`md:` and above)**: [`src/components/FlyingWearHero.tsx`](file:///Users/macbook/Desktop/trend%20street/src/components/FlyingWearHero.tsx) renders textured garments floating freely with realistic drop-shadow physics and mouse-tilt interaction. **All bounding card borders and boxes around the clothes have been eliminated**.
* **Mobile Viewport (`< md`)**: The 3D canvas and interactive Three.js physics are **completely disabled and hidden** (`hidden md:flex`) to eliminate mobile battery drain, avoid GPU throttling, and maintain a seamless 60fps experience.
* **Mobile Replacement**: Replaced on mobile by an ultra-lightweight **Silhouette Capsule Card** (`block md:hidden`) featuring 1-tap category chips, instant coupon claims, and direct links to the 4 categories.

### 3.5 Mobile UX & Ergonomics (`/mobile-design`, `/mobile-developer`)
* **Thumb-Zone Navigation**: [`src/components/MobileBottomNav.tsx`](file:///Users/macbook/Desktop/trend%20street/src/components/MobileBottomNav.tsx) provides fixed bottom access to **Home**, **Shop**, **Saved** (with wishlist counter), **Bag** (opens slide-out cart drawer), and **Profile**.
* **2-Column Responsive Grids**: Instead of single-column mobile lists that cause severe vertical scroll fatigue, all catalog views (Homepage, `/shop`, `/saved`, and category landing pages) display in a modern **2-column grid** (`grid-cols-2 lg:grid-cols-3/4 gap-2.5 sm:gap-6`).
* **Mobile Quick-Add**: Because touchscreen devices lack hover states, product cards feature an always-visible quick-add cart button next to the garment price.

### 3.6 Generative Engine Optimization (GEO) & AI Search (`/seo-geo`)
* `public/llms.txt` and `public/llms-full.txt`: Structured Markdown dossiers formatted for consumption by Perplexity AI, Claude Search, and ChatGPT Search.
* `public/robots.txt`: Explicit allow directives for AI indexing bots (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`).
* Embedded `FAQPage` JSON-LD schema with citability-optimized answers covering GSM weights, Okayama denim shrinkage, boxy torso ratios, and global delivery SLAs.

---

## 4. Complete Route Map & Pages Catalog

| Route | Purpose | Key Components / Features |
|-------|---------|---------------------------|
| `/` | Primary Storefront Homepage | Hero with 3D texture (desktop) / Capsule (mobile), Marquee ticker, 4 Silhouette category portals, Silhouette Studio lab, Trending drops 2-col grid, GEO FAQ, Dynamic concierge footer. |
| `/shop` | Full Sartorial Catalog | Multi-filter sidebar (Category, Price range slider, Size chips, In-stock toggle), keyword search, sort by price/rating/newest, 2-column mobile grid, mobile filter drawer. |
| `/oversized` | Dedicated Oversized Landing | 320–520gsm fabric density breakdowns, +12cm dropped shoulder blueprints, double-walled hood analysis, dynamic tagline, filtered oversized catalog. |
| `/jeans` | Dedicated Jeans Landing | 14oz–15oz Okayama shuttle loom history, redline selvedge ID ticker, sneaker puddle stack geometry, dynamic tagline, filtered selvedge denim catalog. |
| `/boxy-fit` | Dedicated Boxy Fit Landing | 1:1 square torso ratio analysis, waistline crop mechanics, 220gsm mercerized poplin specs, dynamic tagline, filtered boxy catalog. |
| `/jackets` | Dedicated Jackets Landing | Tuscan reverse lambskin suede specs, 16oz duck canvas armor, Swiss Raccagni two-way hardware specs, dynamic tagline, filtered jackets catalog. |
| `/product/[id]` | Garment Detail Page | Multi-image gallery with high-res zoom, size selector, color swatches with live hex preview, GSM fabric specs, accordion for care/shipping, add-to-bag with toast, related garments. |
| `/saved` | Private Wishlist | Saved pieces grid (2-column on mobile), 1-tap "Move to Bag", shareable wishlist URL clipboard copy, empty state discover link. |
| `/bag` | Dedicated Shopping Bag Page | Comprehensive line-item overview, quantity stepper, free courier meter ($200 threshold), promo code input with instant validation, checkout breakdown. |
| `/checkout` | 256-Bit SSL Atelier Checkout | Client shipping info, delivery speed selector (Standard vs VIP Courier), card/Apple Pay simulation, order summary with discounts applied. |
| `/order-confirmation/[orderId]` | Order Success & Receipt | Live order breakdown, customer details, courier tracking number generation, printable invoice trigger, continue shopping action. |
| `/lookbook` | Seasonal Autumn/Winter Lookbook | Full-bleed editorial photography, garment callout tags with direct product links, art direction layout. |
| `/profile` | VIP Client Concierge Profile | VIP loyalty tier badge, measurements archive (chest, waist, inseam, jacket size), saved delivery addresses, recent orders history. |
| `/about` | Brand Heritage & Mills | Savile Row bespoke heritage, Toyoda shuttle loom partnership in Okayama, sustainability pledge, Florentine suede tanneries. |
| `/admin/login` | Secure Admin Authentication | Protected login prompt for admin credentials (`sujal@.com`). Clean UI with zero credential leaks. |
| `/admin` | Executive Control Dashboard | Real-time sales revenue, customer allocation counts, average basket value (AOV), active catalog garment counts, recent orders table. |
| `/admin/settings` | **Site Customizer CMS (Live)** | Dynamic live control panel with 6 tabs: Announcement Banner, Hero & Headlines, Category Taglines, Marquee Ticker, Promo Codes, and Concierge Details. |
| `/admin/products` | Catalog Inventory CRUD | Create new garment, update price/stock/sizes/fabrics, delete item, live preview. |
| `/admin/orders` | Order Fulfillment Center | Filter orders by status (Processing, Shipped, Delivered), update shipping status, inspect customer delivery addresses. |
| `/admin/access-register` | Security & Access Review | CISO audit register for administrative access privileges, CSV export, SQL DDL schema generator. |
| `/llms.txt` | AI Knowledge Graph | Condensed technical index for AI crawler citation. |
| `/llms-full.txt` | Complete Brand Knowledge Base | Unabridged technical documentation, fabric GSMs, sizing guides, and atelier specifications for LLM reasoning engines. |

---

## 5. File & Directory Structure

```
trend-street/
├── public/
│   ├── flying-wear-coat.png            # Asset for 3D/floating hero overcoat
│   ├── flying-wear-jacket.png          # Asset for 3D/floating hero suede bomber
│   ├── flying-wear-jeans.png           # Asset for 3D/floating hero selvedge denim
│   ├── llms.txt                        # GEO AI search summary
│   ├── llms-full.txt                   # GEO AI full markdown documentation
│   ├── robots.txt                      # AI crawler permissions (GPTBot, ClaudeBot, etc.)
│   ├── trend-street-logo-burgundy.png  # Authentic logo (Primary Burgundy)
│   ├── trend-street-logo-gold.png      # Authentic logo (Sartorial Gold)
│   └── trend-street-logo-white.png     # Authentic logo (White)
├── src/
│   ├── app/
│   │   ├── about/page.tsx              # Brand heritage & mill provenance
│   │   ├── admin/
│   │   │   ├── access-register/page.tsx# CISO privileged access register
│   │   │   ├── login/page.tsx          # Clean admin authentication page
│   │   │   ├── orders/page.tsx         # Orders fulfillment & tracking management
│   │   │   ├── page.tsx                # Admin overview dashboard & KPI counters
│   │   │   ├── products/page.tsx       # Products catalog CRUD manager
│   │   │   ├── settings/page.tsx       # Site Customizer CMS (Hero, Marquee, Promos, etc.)
│   │   │   └── layout.tsx              # Admin layout with sidebar navigation & auth guard
│   │   ├── bag/page.tsx                # Full-page shopping bag & order breakdown
│   │   ├── boxy-fit/page.tsx           # Dedicated Boxy Fit silhouette landing page
│   │   ├── checkout/page.tsx           # Checkout flow with promo validation & order generation
│   │   ├── globals.css                 # Global styling, Tailwind directives, font variables
│   │   ├── jackets/page.tsx            # Dedicated Jackets silhouette landing page
│   │   ├── jeans/page.tsx              # Dedicated Jeans silhouette landing page
│   │   ├── layout.tsx                  # Global root layout (Header, Footer, MobileBottomNav, Providers)
│   │   ├── lookbook/page.tsx           # Editorial lookbook with product tags
│   │   ├── order-confirmation/[orderId]/page.tsx # Post-purchase receipt & courier details
│   │   ├── oversized/page.tsx          # Dedicated Oversized silhouette landing page
│   │   ├── page.tsx                    # Storefront homepage (Hero, Studio, Grids, FAQ)
│   │   ├── product/[id]/page.tsx       # Garment detail page with specs & size selector
│   │   ├── profile/page.tsx            # Client VIP profile & measurement archive
│   │   ├── saved/page.tsx              # Wishlist page (2-column mobile grid)
│   │   ├── shop/page.tsx               # Filterable catalog with search, price slider, size pills
│   │   └── sitemap.ts                  # Dynamic Next.js sitemap generator
│   ├── components/
│   │   ├── 3d/
│   │   │   └── HeroShowroom3D.tsx      # Three.js 3D WebGL rotating showroom canvas
│   │   ├── CartDrawer.tsx              # Slide-out shopping bag drawer with free courier meter
│   │   ├── FlyingWearHero.tsx          # 3D floating wear hero (desktop) & capsule card (mobile)
│   │   ├── FlyingWearScrollStrip.tsx   # Legacy horizontal strip component
│   │   ├── Footer.tsx                  # Dynamic concierge footer (zero admin links)
│   │   ├── GeoFaqSection.tsx           # Citability FAQ accordion with JSON-LD schema
│   │   ├── Header.tsx                  # Top announcement, grouped 4 categories, centered logo
│   │   ├── Logo.tsx                    # Responsive brand logo component
│   │   ├── MobileBottomNav.tsx         # Fixed thumb-zone bottom navigation for mobile viewports
│   │   ├── ProductCard.tsx             # Reusable garment card with mobile quick-add button
│   │   ├── QuickViewModal.tsx          # Fast garment inspection modal without route departure
│   │   ├── SilhouetteStudio.tsx        # Interactive Drape & Architecture lab (replaces mid-site 3D)
│   │   └── seo/
│   │       └── JsonLd.tsx              # Schema.org structured data injector
│   ├── context/
│   │   ├── AdminAuthContext.tsx        # Admin authentication, credentials check, access records
│   │   └── StoreContext.tsx            # Single source of truth for products, bag, wishlist, settings
│   ├── data/
│   │   └── products.ts                 # 12 initial curated luxury streetwear garments
│   └── types/
│       └── store.ts                    # TypeScript definitions (Product, Order, SiteSettings, User)
├── .coderabbit.yaml                    # Automated AI code review configuration
├── next.config.js                      # Next.js build configuration (Unsplash remote image domains)
├── package.json                        # Scripts and dependencies
├── tailwind.config.ts                  # Brand colors (Burgundy, Crimson, Espresso, Ivory, Gold)
└── tsconfig.json                       # TypeScript compiler configuration (strict mode)
```

---

## 6. What Has Been Completed (Current Progress)

1. **Brand Aesthetic & Identity**:
   - Palette rigorously applied: Deep Burgundy (`#4A1216`), Crimson (`#6B1D24`), Dark Espresso (`#2B080A`), Warm Ivory (`#F9F6F4`), and Sartorial Gold (`#C5A880`).
   - Authentic logo positioned in the center stage of the desktop and mobile header with zero text collision.
   - Niche focused strictly on 4 core silhouettes: Oversized, Jeans, Boxy Fit, and Jackets.
2. **Navigation & Grouping**:
   - All 4 category links (`OVERSIZED`, `JEANS`, `BOXY FIT`, `JACKETS`) grouped sequentially on the left side of the header.
   - Right side reserved for customer utility: Search, Saved Wishlist, Shopping Bag Drawer, and Profile.
3. **Hero 3D Floating Wear Experience**:
   - Pure 3D textured floating garments with mouse-reactive physics on desktop.
   - Completely stripped all bounding boxes, borders, and card outlines around the clothes.
   - Heavy 3D disabled on mobile (`hidden md:flex`) and replaced with a touch-friendly silhouette capsule card (`block md:hidden`).
4. **Mid-Site Replacement — Silhouette Studio**:
   - Removed legacy 3D panels in the middle of the homepage.
   - Built the **Silhouette Studio (Drape & Architecture Lab)** with interactive silhouette switching, live fabric GSM/Oz gauges, cut blueprint diagrams, and direct landing page CTAs.
5. **4 Dedicated Category Landing Pages**:
   - Individual landing pages created for `/oversized`, `/jeans`, `/boxy-fit`, and `/jackets` with technical fabric density breakdowns, silhouette blueprint specs, and dynamic category product catalogs.
6. **Mobile UI Scaling & Touch Optimization**:
   - Scaled down section padding, typography, and card spacing across all routes.
   - 2-column e-commerce grid on mobile viewports for Homepage, `/shop`, `/saved`, and category landing pages.
   - Thumb-zone mobile bottom navigation bar (`MobileBottomNav.tsx`) with Home, Shop, Saved, Bag, and Profile.
   - Touch quick-add buttons on product cards.
7. **Admin Site Customizer (Live CMS)**:
   - Full control panel at `/admin/settings` to edit the top announcement banner, hero headlines, badge, subtitle, CTAs, 3 live trust stats, marquee ticker phrases, category taglines, promo codes, and concierge contact details.
   - Dynamic synchronization via `StoreContext` and `localStorage`.
8. **Storefront Privacy & Admin Decoupling**:
   - Completely removed all admin links, login buttons, and email references from the public header, footer, mobile drawer, and bottom navigation.
   - Removed credentials display from the login page for secure operation.
9. **SEO & GEO Generative AI Optimization**:
   - Injected JSON-LD schemas (`FAQPage`, `Product`, `Organization`).
   - Added `llms.txt` and `llms-full.txt` for AI search citation.
   - Configured `robots.txt` for AI crawlers (`GPTBot`, `ClaudeBot`, etc.).
10. **Type Safety & Code Quality**:
    - `npx tsc --noEmit` compiles cleanly with **0 errors**.
    - Next.js development server running and hot-reloading smoothly on `http://localhost:3000`.

---

## 7. What Is Remaining & Recommended Future Roadmap

The frontend, UI/UX, responsive mobile design, dynamic state management, and administrative control panels are fully operational in client-side simulation mode. The following items represent the natural progression for a production enterprise deployment:

### 7.1 Backend & Database Persistence
* **Current State**: Products, orders, and site settings are managed via `StoreContext` and persisted to the browser's `localStorage`.
* **Recommended Next Step**:
  - Connect a persistent PostgreSQL database (e.g. Supabase, Neon, or Prisma ORM).
  - Migrate `SiteSettings`, `Product[]`, and `Order[]` to PostgreSQL tables with Next.js Server Actions or API routes (`/api/settings`, `/api/products`, `/api/orders`).

### 7.2 Production Payment Gateway
* **Current State**: Checkout simulates an encrypted 256-bit checkout process and creates validated orders locally.
* **Recommended Next Step**:
  - Integrate **Stripe Elements** or **Shopify Buy SDK** / **MedusaJS**.
  - Add server-side webhook handler (`/api/webhooks/stripe`) to confirm payment intents and dispatch inventory locks.

### 7.3 Transactional Email & Messaging
* **Current State**: Order confirmation numbers and tracking codes are generated on-screen.
* **Recommended Next Step**:
  - Integrate **Resend** or **SendGrid** to dispatch branded HTML order confirmation emails and shipping tracking links to customers.

### 7.4 Cloud Image Storage & CDN
* **Current State**: High-resolution photography is served from Unsplash and local `/public` PNG assets.
* **Recommended Next Step**:
  - Integrate **Cloudflare R2** or **AWS S3** with **Uploadthing** in the Admin Products CRUD panel to allow the store owner to drag-and-drop new garment photography directly from their device.

### 7.5 Production User & Admin Authentication
* **Current State**: Admin authentication uses a client-side session guard with credentials `sujal@.com` / `[REDACTED-rotate-this-password]`.
* **Recommended Next Step**:
  - Implement **NextAuth.js (Auth.js)**, **Clerk**, or **Supabase Auth** with HTTP-only session cookies and role-based access control (RBAC).

### 7.6 Automated Testing Suite
* **Current State**: TypeScript compilation verified (`tsc --noEmit`).
* **Recommended Next Step**:
  - Add **Vitest** for unit tests (cart calculation math, promo code percentage deduction).
  - Add **Playwright** for end-to-end user journeys (browsing, adding to bag, checkout completion, admin customizer edits).

---

## 8. How to Run, Test and Deploy

### 8.1 Local Development
```bash
# 1. Clone repository & navigate to workspace
cd "trend street"

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
# The store runs at http://localhost:3000

# 4. Typecheck verification
npm run typecheck
```

### 8.2 Admin Portal Access
1. Open the browser and navigate directly to:  
   `http://localhost:3000/admin`
2. When prompted for credentials:
   - **Admin ID**: `sujal@.com`
   - **Password**: `[REDACTED-rotate-this-password]`
3. Access the **Site Customizer (Live)** at `http://localhost:3000/admin/settings` to edit banner text, hero headlines, promo codes, and contact details with instant live storefront synchronization.

### 8.3 Production Build & Deployment
```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```
The codebase is fully compatible with one-click deployment to **Vercel**, **AWS Amplify**, or any Node.js containerized hosting platform.

---

*This dossier constitutes the complete architectural blueprint and context record for Trend Street.*
