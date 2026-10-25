import React from "react";

export const StoreJsonLd: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: "Trend Street",
    alternateName: "The Style Hub",
    description:
      "Premier luxury menswear fashion house specializing in three architectural silhouettes: Oversized hoodies & tees, boxy fit knits & poplin overshirts, and handcrafted structural jackets.",
    url: "https://trendstreet.com",
    logo: "https://trendstreet.com/trend-street-logo-burgundy.png",
    department: [
      { "@type": "Department", "name": "Oversized Silhouette", "url": "https://trendstreet.com/oversized" },
      { "@type": "Department", "name": "Boxy Fit Architecture", "url": "https://trendstreet.com/boxy-fit" },
      { "@type": "Department", "name": "Structural Jackets", "url": "https://trendstreet.com/jackets" },
    ],
    priceRange: "$$$$",
    currenciesAccepted: "USD, GBP, EUR",
    paymentAccepted: "Credit Card, Debit Card, Apple Pay, Google Pay, UPI",
    address: {
      "@type": "PostalAddress",
      streetAddress: "72 Shoreditch High Street, Hackney",
      addressLocality: "London",
      postalCode: "E1 6JJ",
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "51.5238",
      longitude: "-0.0768",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+44-20-7946-0912",
      contactType: "customer service",
      availableLanguage: ["English", "Italian", "French"],
    },
    sameAs: [
      "https://www.instagram.com/trendstreet",
      "https://twitter.com/trendstreet",
      "https://facebook.com/trendstreet",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
