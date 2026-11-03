import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | OFFVYBE",
  description: "Questions about sizing, an order, or an exchange? Reach the OFFVYBE team by email, phone or WhatsApp.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
