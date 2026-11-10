import type { Metadata } from "next";

// One-time links: never index these pages, and never send the link on to another site as a referrer.
export const metadata: Metadata = {
  title: "Your account | OFFVYBE",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
