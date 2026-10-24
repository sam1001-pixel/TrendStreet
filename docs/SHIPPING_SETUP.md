# Trend Street — Shiprocket Logistics Integration & Runbook

This document details the configuration, courier SLA mapping, pickup hub operations, and tracking workflow for the **Shiprocket** logistics adapter in Trend Street.

---

## 1. Logistics Architecture & Indian Delivery Footprint

Trend Street delivers high-end menswear across all Indian postal circles. The shipping engine is abstracted via a carrier-agnostic interface (`src/lib/shipping/types.ts`) with a concrete `ShiprocketShippingAdapter` (`src/lib/shipping/shiprocket.ts`).

```
[ Customer Checkout ]
        │
        ▼
[ PIN Code Validation ] ──> Regex + Geographic Prefix Check (110001 - 855117)
        │
        ▼
[ Serviceability Check ] ──> Shiprocket Live API (or deterministic Sandbox Mock)
        │
        ▼
[ Order Placed ] ─────────> Automatic AWB Booking & Shipping Label Generation
        │
        ▼
[ Carrier Dispatch ] ─────> Blue Dart Apex Priority Air (Metro 2-3 Days)
                            Delhivery Express Air (Tier 1/2 3-4 Days)
                            Standard Surface (Rest of India 4-6 Days)
        │
        ▼
[ Real-Time Tracking ] ───> Checkpoint streaming on `/track` page
```

---

## 2. Bandra West Atelier Primary Pickup Hub

Shiprocket requires a registered primary pickup warehouse location matching the dispatch origin.

### Primary Pickup Location Details
- **Pickup Location Nickname**: `Atelier-Bandra-West`
- **Address Line 1**: `Trend Street Atelier, 14th Road`
- **Address Line 2**: `Off Linking Road, Bandra West`
- **City**: `Mumbai`
- **State**: `Maharashtra`
- **PIN Code**: `400050`
- **Contact Person**: Logistics Lead / Atelier Manager
- **Phone**: Business contact phone registered in Shiprocket

---

## 3. Account Configuration & Environment Setup

1. Register an Indian Business account on [Shiprocket.in](https://www.shiprocket.in).
2. Complete KYC and add minimum wallet balance for courier deductions.
3. Configure API credentials in Trend Street's environment:
   ```env
   SHIPROCKET_EMAIL="logistics@trendstreet.in"
   SHIPROCKET_PASSWORD="your_secure_shiprocket_password"
   ```
4. **Sandbox Mock Mode**: If `SHIPROCKET_EMAIL` or `SHIPROCKET_PASSWORD` are not configured (or set to placeholder values), Trend Street automatically operates in deterministic **Sandbox Mock Mode**:
   - Generates realistic mock AWB codes (`AWB400050...`).
   - Generates realistic courier options (Blue Dart Apex, Delhivery Air).
   - Simulates real transit checkpoints for testing without billing wallet balances.

---

## 4. Shipping Rules & Pricing Strategy

- **Free Shipping Threshold**: Orders with subtotal **≥ ₹1,999** (199,900 paise) automatically qualify for complimentary express air courier shipping across all serviceable Indian PIN codes.
- **Orders Below Threshold**: A flat shipping fee of **₹250** (25,000 paise) is applied at checkout.
- **Promotional Overrides**: The `FREESHIP` promo code overrides and waives shipping fees even on orders below ₹1,999.
- **Cash on Delivery (COD)**: Available up to an order limit of **₹10,000** (1,000,000 paise) to mitigate Return to Origin (RTO) risks.

---

## 5. Courier SLAs & Delivery Zones

| Zone | Indian Hubs | Preferred Courier Partner | Typical Air SLA |
| :--- | :--- | :--- | :--- |
| **Zone A (Intra-City)** | Mumbai, Thane, Navi Mumbai | Blue Dart Surface / Local Express | 1-2 Business Days |
| **Zone B (Metros)** | Delhi NCR, Bengaluru, Chennai, Hyderabad, Kolkata | Blue Dart Apex Priority Air | 2-3 Business Days |
| **Zone C (Tier 1 & 2)** | Pune, Ahmedabad, Jaipur, Chandigarh, Lucknow, Kochi | Delhivery Express Air | 3-4 Business Days |
| **Zone D (Rest of India)** | All other serviceable 6-digit PIN codes | Blue Dart / Delhivery / DTDC Air | 4-6 Business Days |

---

## 6. Order Tracking & Customer Experience

Customers can track their shipments in real time on the `/track` page using their order number or AWB code. The tracking response normalizes status into standard milestones:
1. `MANIFESTED`: Order packed at Bandra West Atelier and shipping label printed.
2. `PICKED_UP`: Handed over to courier express agent.
3. `IN_TRANSIT`: En route via air cargo complex.
4. `OUT_FOR_DELIVERY`: Dispatched with local courier delivery executive.
5. `DELIVERED`: Delivered and signed.
