# Trend Street — Razorpay Payment Gateway Setup & Security Guide

This document outlines the step-by-step procedure for configuring, securing, and operating the **Razorpay** payment gateway for Trend Street in the Indian e-commerce market.

---

## 1. Razorpay Merchant Account & KYC Requirements

To process domestic Indian payments (UPI, RuPay, Visa, Mastercard, NetBanking, and Wallets), the merchant entity must complete RBI-mandated KYC on the Razorpay Dashboard.

### Required Business Information
- Registered Indian Business Entity (Private Limited, LLP, or Sole Proprietorship).
- GSTIN (Goods and Services Tax Identification Number) corresponding to Maharashtra / state of operation.
- Current Bank Account details (Account Number & IFSC Code) for T+2 settlements.
- PAN (Permanent Account Number) of the entity and authorized signatories.
- Operational website with published Terms of Service, Privacy Policy, Shipping Policy, and Cancellation & Refund Policy.

---

## 2. API Key Management & Storage

1. Navigate to **Razorpay Dashboard** > **Settings** > **API Keys**.
2. Generate API Keys for the respective environment:
   - **Staging / Testing**: Keys starting with `rzp_test_...`
   - **Production**: Keys starting with `rzp_live_...`
3. Store credentials securely in your hosting provider's encrypted environment variables:
   ```env
   RAZORPAY_KEY_ID="rzp_live_your_actual_key_id"
   RAZORPAY_KEY_SECRET="your_actual_secret_key"
   ```
4. **NEVER** commit API secrets to Git. In Trend Street, client components only receive the public `RAZORPAY_KEY_ID` through explicit server responses (`/api/payment/create-order`), preventing secret leakage in client-side bundles.

---

## 3. Webhook Configuration & Security

Webhooks guarantee reliable order fulfillment even if a customer closes their browser immediately after entering their UPI PIN or OTP.

### Webhook Setup Steps
1. Navigate to **Razorpay Dashboard** > **Settings** > **Webhooks**.
2. Click **Add New Webhook**.
3. **Webhook URL**:
   ```
   https://trendstreet.in/api/webhooks/payment
   ```
4. **Secret**: Generate a cryptographically random secret (`openssl rand -hex 24`) and save it in `.env` as `RAZORPAY_WEBHOOK_SECRET`.
5. **Subscribed Events**:
   - `order.paid` (Primary trigger for order fulfillment)
   - `payment.authorized` (Card authorization)
   - `payment.failed` (Updates order status to PAYMENT_FAILED)
   - `refund.processed` (Updates order status to REFUNDED)

### Cryptographic Webhook Verification in Trend Street
Trend Street implements HMAC-SHA256 signature verification over the raw incoming request buffer:
```ts
const expectedSignature = crypto
  .createHmac("sha256", webhookSecret)
  .update(rawBody)
  .digest("hex");

const isValid = timingSafeEqualStr(signature, expectedSignature);
```
- Deduplication: Every webhook event ID is recorded in the PostgreSQL `AuditLog` table. Replays or duplicates sent by Razorpay are idempotently acknowledged with HTTP 200 without duplicate credit.
- Atomic Update: Payment record and Order status updates are bundled into a single Prisma `$transaction`.

---

## 4. Live Mode Protection Gate

To safeguard against accidental real financial transactions during testing or staging deployments, Trend Street includes a built-in safety gate (`src/lib/razorpay.ts`):
```ts
if (isLiveKey && process.env.ALLOW_LIVE_PAYMENTS !== "true") {
  throw new Error("CRITICAL SAFETY BLOCK: Live payments are not permitted without ALLOW_LIVE_PAYMENTS=true.");
}
```
**Staging deployment**: `ALLOW_LIVE_PAYMENTS="false"`  
**Production deployment**: `ALLOW_LIVE_PAYMENTS="true"` (Enabled only after successful pre-flight testing).

---

## 5. Test Card Credentials & UPI Flow Verification

| Scenario | Card Number | Expiry | CVV | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Successful Domestic Card** | `4012 0000 0000 0002` | Any future date | `123` | OTP Prompt -> Success -> Order Paid |
| **OTP Failure / Authentication Drop** | `4012 0000 0000 0002` | Any future date | `123` | Fail OTP -> Payment Failed recorded |
| **Domestic UPI (Success)** | `success@razorpay` | N/A | N/A | Instant Success -> Webhook `order.paid` |
| **Domestic UPI (Failure)** | `failure@razorpay` | N/A | N/A | Instant Decline |
