import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Trend Street",
  description: "Questions about sizing, an order, or an exchange? Reach the Trend Street team by email, phone or WhatsApp.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
