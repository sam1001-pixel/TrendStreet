import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All — Oversized Tees, Jeans, Boxy Fits & Jackets at ₹499 | Trend Street",
  description: "Every Trend Street piece at one price: oversized tees and hoodies, baggy jeans, boxy shirts and jackets. Cash on delivery and easy size exchanges across India.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
