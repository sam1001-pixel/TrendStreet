import React from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Site-wide structured data for search engines. Only facts that are true for the shop belong here:
 * add `address`, `telephone` and `sameAs` (social profiles) once they're confirmed.
 */
export const StoreJsonLd: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE_NAME,
    alternateName: "Wear Your Own Vibe",
    description:
      "Indian menswear label for oversized tees and hoodies, boxy fit shirts, denim and jackets, shipped across India.",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/offvybe-logo-dark.png`,
    currenciesAccepted: "INR",
    paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery",
    areaServed: { "@type": "Country", name: "India" },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
};
