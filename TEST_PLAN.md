# TREND STREET — Comprehensive Automated Test Plan

> **Document Version**: 1.0.0  
> **Status**: Approved Quality Assurance Blueprint  
> **Testing Stack**: Vitest (Unit & Integration) | React Testing Library | Playwright (E2E) | axe-core (Accessibility)  

---

## 1. Testing Pyramid Strategy

```
           / \
          /   \
         / E2E \       Playwright: 25 Critical User Journeys
        /───────\      (Checkout, Admin CRUD, Category Navigation)
       /  Integ  \     React Testing Library & API Route Tests
      /───────────\    (Session Cookies, Cart State, Webhooks)
     /  Unit Tests \   Vitest: Fast Pure Logic Verification
    /───────────────\  (Pricing, Discounts, Minor Units, Zod Schemas)
```

---

## 2. Unit Testing Suite (Vitest)

### 2.1 Pricing & Calculation Engine (`tests/unit/pricing.test.ts`)
* **Test 1**: Verify subtotal correctly aggregates unit prices multiplied by quantities in integer minor units.
* **Test 2**: Verify promotional code `TREND10` applies exactly 10% discount to eligible line items.
* **Test 3**: Verify promotional code `FREESHIP` zeros out courier delivery fees.
* **Test 4**: Verify free shipping is automatically applied when cart subtotal meets or exceeds the threshold ($200.00 / Rs 16,000).
* **Test 5**: Verify standard tax calculation (e.g. 8% or 12% GST) is calculated on discounted subtotals and rounded to the nearest minor unit without floating-point drift.
* **Test 6**: Verify negative, non-numeric, or zero quantities are strictly rejected.

### 2.2 Schema & Input Validation (`tests/unit/validation.test.ts`)
* **Test 7**: Verify Zod schema for checkout address accepts valid postal codes, cities, and countries, and rejects empty strings or malformed emails.
* **Test 8**: Verify product creation schema enforces permitted categories (`Oversized`, `Jeans`, `Boxy Fit`, `Jackets`) and rejects unapproved categories (e.g. "Footwear", "Suits").
* **Test 9**: Verify payment webhook payload schema validates signature headers and prevents missing transaction IDs.

---

## 3. Integration & API Testing Suite

### 3.1 Authentication & Middleware (`tests/integration/auth.test.ts`)
* **Test 10**: Verify `POST /api/auth/login` returns HTTP 200 with an encrypted `Set-Cookie` header on valid admin credentials.
* **Test 11**: Verify `POST /api/auth/login` returns generic HTTP 401 on incorrect credentials without leaking whether email exists.
* **Test 12**: Verify Next.js `middleware.ts` redirects unauthenticated requests targeting `/admin` to `/admin/login`.
* **Test 13**: Verify Next.js `middleware.ts` permits requests to `/admin` when a valid session cookie is present.
* **Test 14**: Verify `POST /api/auth/logout` clears session cookies and revokes session tokens.

### 3.2 Webhook & Order Integrity (`tests/integration/webhooks.test.ts`)
* **Test 15**: Verify `POST /api/webhooks/payment` rejects requests with missing or invalid HMAC-SHA256 signatures with HTTP 400.
* **Test 16**: Verify valid payment webhook atomically transitions order status from `PENDING` to `PAID` and decrements inventory.
* **Test 17**: Verify webhook replay attacks (identical payment IDs) are handled idempotently without duplicate inventory deductions.

---

## 4. End-to-End Testing Matrix (Playwright)

| Test ID | User Role | Flow Description | Acceptance Criteria |
|:---|:---|:---|:---|
| **E2E-01** | Anonymous Shopper | Homepage to Product Detail | Navigates from `/` via category link to `/oversized`, clicks garment card, verifies gallery, fabric GSM specs, and size chips. |
| **E2E-02** | Anonymous Shopper | Full Checkout Flow | Adds garment to bag, opens slide-out drawer, navigates to `/checkout`, fills shipping address, selects payment, verifies order confirmation with order ID. |
| **E2E-03** | Anonymous Shopper | Wishlist Synchronization | Toggles heart icon on product card, verifies header wishlist counter increments, navigates to `/saved`, clicks "Move to Bag". |
| **E2E-04** | Malicious Actor | Unauthorized Admin Access | Directly loads `http://localhost:3000/admin`, verifies immediate redirect to `/admin/login`. Attempts to forge `localStorage` key, verifies server still rejects. |
| **E2E-05** | Administrator | Admin Login & Product CRUD | Logs in at `/admin/login`, navigates to `/admin/products`, adds a new oversized hoodie, verifies it renders in the catalog table. |
| **E2E-06** | Administrator | Site Customizer CMS | Navigates to `/admin/settings`, updates top announcement text, saves, visits `/`, verifies new announcement renders. |
| **E2E-07** | Mobile User | Mobile Navigation & Layout | Emulates iPhone 15 Pro (393x852), verifies centered logo, confirms 3D WebGL is disabled, checks 2-col catalog, tests bottom navigation. |

---

## 5. Automated Regression Gates (CI Pipeline)

Before any commit or pull request is merged into `main`, the following automated pipeline must pass:

1. **`npm run typecheck`**: Strict TypeScript compilation with 0 errors.
2. **`npm run lint`**: ESLint Core Web Vitals with 0 errors.
3. **`npm run test`**: Vitest unit and integration test suites pass with 100% success.
4. **`npx playwright test`**: Core E2E user journeys execute and pass in headless Chrome.
5. **`npm run build`**: Production Next.js build compiles all routes without SSR failure.
