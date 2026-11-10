/**
 * Trend Street — India-First Postal Logistics & PIN Code Serviceability Engine
 * Supports 6-digit Indian PIN codes, postal circle detection, courier transit estimation,
 * and Cash-on-Delivery (COD) eligibility validation.
 */

export interface PincodeServiceability {
  isValid: boolean;
  pincode: string;
  isServiceable: boolean;
  city?: string;
  state?: string;
  tier: "Metro" | "Tier 1" | "Tier 2" | "Rest of India";
  transitDaysMin: number;
  transitDaysMax: number;
  courierPartner: string;
  codAvailable: boolean;
  freeShippingThreshold: number; // in INR (e.g., 1999)
  message: string;
}

// Indian Postal Circle mapping by first 2 digits
const POSTAL_PREFIX_MAP: Record<string, { state: string; city: string; tier: "Metro" | "Tier 1" | "Tier 2" }> = {
  // Northern Circle
  "11": { state: "Delhi", city: "New Delhi", tier: "Metro" },
  "12": { state: "Haryana", city: "Gurugram / Faridabad", tier: "Tier 1" },
  "13": { state: "Haryana", city: "Ambala / Panipat", tier: "Tier 2" },
  "14": { state: "Punjab", city: "Amritsar / Jalandhar", tier: "Tier 2" },
  "16": { state: "Chandigarh", city: "Chandigarh", tier: "Tier 1" },
  "20": { state: "Uttar Pradesh", city: "Noida / Ghaziabad", tier: "Tier 1" },
  // Western Circle
  "40": { state: "Maharashtra", city: "Mumbai", tier: "Metro" },
  "41": { state: "Maharashtra", city: "Pune", tier: "Metro" },
  "42": { state: "Maharashtra", city: "Nashik", tier: "Tier 2" },
  "44": { state: "Maharashtra", city: "Nagpur", tier: "Tier 2" },
  "38": { state: "Gujarat", city: "Ahmedabad", tier: "Metro" },
  "39": { state: "Gujarat", city: "Surat / Vadodara", tier: "Tier 1" },
  "403": { state: "Goa", city: "Panaji / North Goa", tier: "Tier 2" },
  // Southern Circle
  "56": { state: "Karnataka", city: "Bengaluru", tier: "Metro" },
  "57": { state: "Karnataka", city: "Mangaluru / Mysuru", tier: "Tier 2" },
  "50": { state: "Telangana", city: "Hyderabad", tier: "Metro" },
  "53": { state: "Andhra Pradesh", city: "Visakhapatnam", tier: "Tier 2" },
  "60": { state: "Tamil Nadu", city: "Chennai", tier: "Metro" },
  "64": { state: "Tamil Nadu", city: "Coimbatore", tier: "Tier 2" },
  "68": { state: "Kerala", city: "Kochi", tier: "Tier 1" },
  "69": { state: "Kerala", city: "Thiruvananthapuram", tier: "Tier 2" },
  // Eastern Circle
  "70": { state: "West Bengal", city: "Kolkata", tier: "Metro" },
  "75": { state: "Odisha", city: "Bhubaneswar", tier: "Tier 2" },
  "80": { state: "Bihar", city: "Patna", tier: "Tier 2" },
};

/**
 * Validates a 6-digit Indian PIN code format.
 * Must start with non-zero digit 1-9 and contain exactly 6 digits.
 */
export function isValidIndianPincode(pincode: string): boolean {
  if (!pincode || typeof pincode !== "string") return false;
  const clean = pincode.trim();
  return /^[1-9][0-9]{5}$/.test(clean);
}

/**
 * Checks logistics serviceability, estimated delivery timeline, and courier partner for an Indian PIN code.
 */
export function checkPincodeServiceability(pincodeInput: string): PincodeServiceability {
  const pincode = pincodeInput.trim();

  if (!isValidIndianPincode(pincode)) {
    return {
      isValid: false,
      pincode,
      isServiceable: false,
      tier: "Rest of India",
      transitDaysMin: 0,
      transitDaysMax: 0,
      courierPartner: "Delhivery / Blue Dart",
      codAvailable: false,
      freeShippingThreshold: 1999,
      message: "Please enter a valid 6-digit Indian PIN code (e.g., 400050, 110001, 560001).",
    };
  }

  // Identify postal circle by first 2 or 3 digits
  const prefix2 = pincode.substring(0, 2);
  const prefix3 = pincode.substring(0, 3);
  const match = POSTAL_PREFIX_MAP[prefix3] || POSTAL_PREFIX_MAP[prefix2];

  if (match) {
    if (match.tier === "Metro") {
      return {
        isValid: true,
        pincode,
        isServiceable: true,
        city: match.city,
        state: match.state,
        tier: "Metro",
        transitDaysMin: 2,
        transitDaysMax: 3,
        courierPartner: "Blue Dart Apex / Delhivery Air",
        codAvailable: true,
        freeShippingThreshold: 1999,
        message: `Verified for ${match.city}, ${match.state}. Express delivery in 2–3 business days via Blue Dart Apex / Delhivery Air. Cash on Delivery (COD) available.`,
      };
    }

    if (match.tier === "Tier 1") {
      return {
        isValid: true,
        pincode,
        isServiceable: true,
        city: match.city,
        state: match.state,
        tier: "Tier 1",
        transitDaysMin: 3,
        transitDaysMax: 4,
        courierPartner: "Delhivery Express / Xpressbees",
        codAvailable: true,
        freeShippingThreshold: 1999,
        message: `Verified for ${match.city}, ${match.state}. Express delivery in 3–4 business days via Delhivery Express. Cash on Delivery (COD) available.`,
      };
    }

    return {
      isValid: true,
      pincode,
      isServiceable: true,
      city: match.city,
      state: match.state,
      tier: "Tier 2",
      transitDaysMin: 4,
      transitDaysMax: 5,
      courierPartner: "Delhivery / DTDC Express",
      codAvailable: true,
      freeShippingThreshold: 1999,
      message: `Verified for ${match.city}, ${match.state}. Priority delivery in 4–5 business days via Delhivery. Cash on Delivery (COD) available.`,
    };
  }

  // Valid Indian PIN code outside mapped major hubs (Rest of India)
  return {
    isValid: true,
    pincode,
    isServiceable: true,
    tier: "Rest of India",
    transitDaysMin: 4,
    transitDaysMax: 6,
    courierPartner: "Delhivery Surface / India Post Speed Post",
    codAvailable: true,
    freeShippingThreshold: 1999,
    message: `Verified for ${pincode}. Priority courier delivery in 4–6 business days via Delhivery. Cash on Delivery (COD) available.`,
  };
}
