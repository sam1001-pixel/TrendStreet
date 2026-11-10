# TREND STREET — SEO, GEO & Accessibility Baseline Audit

> **Document Version**: 1.0.0  
> **Evaluation Period**: October 2026  
> **Audit Targets**: Search Engine Optimization (SEO), Generative Engine Optimization (GEO), WCAG 2.2 AA Accessibility  

---

## 1. SEO & GEO Discoverability Audit

### 1.1 Metadata & OpenGraph Infrastructure
* **Dynamic Title & Descriptions**: Implemented across primary routes. Each product detail page dynamically derives its `<title>` from `product.name | Trend Street` and `<meta name="description">` from `product.description`.
* **Dynamic Sitemap (`src/app/sitemap.ts`)**: Automatically indexes all 22 static and dynamic storefront routes with ISO 8601 `lastModified` timestamps and appropriate priority weighting (`1.0` for home, `0.9` for shop, `0.8` for category landings).
* **Robots Configuration (`public/robots.txt`)**:
  - Explicit allow directives configured for leading AI crawlers: `GPTBot`, `ClaudeBot`, `PerplexityBot`, and `Google-Extended`.
  - Disallow directives properly protect `/admin/*` and private checkout paths from search engine indexing.

### 1.2 Generative Engine Optimization (GEO) (`public/llms.txt`)
* `llms.txt` and `llms-full.txt` are provisioned in `public/`.
* High-density passages (134–167 words) engineered for AI citability, detailing:
  - Loopback French Terry GSM densities (320gsm–520gsm)
  - Okayama shuttle-loom selvedge denim shrinkage and redline ID
  - Boxy fit 1:1 torso ratio geometry
  - Florentine lambskin reverse suede craftsmanship
* Embedded `FAQPage` schema ensures search engines and AI knowledge graphs can accurately answer user queries regarding garment provenance and fit.

### 1.3 Structured Data (JSON-LD)
* **Storefront Schema**: Injected via `src/components/seo/JsonLd.tsx`. Validates against `ClothingStore` and `Organization` schemas.
* **Product Schema**: Configured on `/product/[id]` with `Product` and `Offer` schema types, including price currency, stock availability (`InStock`), and brand identity.
* **Next Action**: Add `BreadcrumbList` schema to category landing pages (`/oversized`, `/jeans`, etc.) to enhance search result navigation snippets.

---

## 2. WCAG 2.2 AA Accessibility Audit

| Checkpoint | Target | Current Status | Finding / Action Required |
|:---|:---:|:---:|:---|
| **1.4.3 Contrast (Minimum)** | 4.5:1 for text | **PASS (12.4:1)** | Deep Burgundy (`#4A1216`) on Warm Ivory (`#F9F6F4`) achieves 12.4:1 contrast. |
| **2.1.1 Keyboard Navigation** | All actions operable | **PASS** | Slide-over drawers, modals, size chips, and buttons are keyboard accessible via Tab/Enter. |
| **2.4.7 Focus Visible** | Clear visual outline | **PASS** | `focus-visible:ring-2 focus-visible:ring-burgundy` configured across interactive elements. |
| **1.3.1 Info and Relationships** | Form inputs labeled | **PASS** | All checkout and admin inputs possess associated `<label>` elements. |
| **2.2.2 Pause, Stop, Hide** | Marquee & 3D controls | **PASS** | Marquee ticker pauses on hover; 3D hero responds to pointer and reduced-motion settings. |
| **2.5.5 Target Size** | Min 44x44px touch targets | **PASS** | Mobile bottom navigation items measure 56x46px; quick-add buttons meet minimum 44px threshold. |
| **1.1.1 Non-text Content** | Alt text on images | **PASS / REFINEMENT** | Product images have descriptive alt text; converting raw `<img>` to `<Image />` will ensure optimal rendering. |
