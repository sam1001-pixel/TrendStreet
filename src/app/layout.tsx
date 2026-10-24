import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { UserAuthProvider } from "@/context/UserAuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { QuickViewModal } from "@/components/QuickViewModal";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { StoreJsonLd } from "@/components/seo/JsonLd";
import { ScrollReveal } from "@/components/premium/ScrollReveal";

export const metadata: Metadata = {
  title: "Trend Street | The Style Hub — Oversized, Jeans, Boxy Fit & Jackets",
  description:
    "Trend Street is the definitive contemporary luxury menswear house. Specializing in 520gsm loopback oversized hoodies, 14oz Okayama selvedge carpenter jeans, boxy fit knits, and handcrafted flight jackets.",
  keywords: [
    "trend street",
    "oversized hoodie",
    "heavyweight oversized tee",
    "okayama selvedge jeans",
    "carpenter denim",
    "boxy fit shirt",
    "boxy knitwear",
    "suede bomber jacket",
    "mens streetwear luxury",
    "menswear",
    "the style hub",
  ],
  authors: [{ name: "Trend Street Studio" }],
  creator: "Trend Street",
  publisher: "Trend Street Luxury Apparels Private Limited",
  metadataBase: new URL("https://trendstreet.com"),
  other: {
    "geo.region": "IN-MH",
    "geo.placename": "Mumbai, Bandra West",
    "geo.position": "19.0544;72.8346",
    "ICBM": "19.0544, 72.8346",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://trendstreet.com",
    title: "Trend Street | The Style Hub — Oversized, Jeans, Boxy Fit & Jackets",
    description:
      "Contemporary luxury menswear engineering. 520gsm Japanese loopback hoodies, Okayama redline selvedge denim jeans, boxy fit architecture, and handcrafted jackets.",
    siteName: "Trend Street",
    images: [
      {
        url: "/trend-street-logo-burgundy.png",
        width: 1179,
        height: 779,
        alt: "Trend Street - The Style Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trend Street | The Style Hub",
    description: "Contemporary Streetwear & Luxury Menswear: Oversized, Jeans, Boxy Fit, Jackets.",
    creator: "@trendstreet",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <StoreJsonLd />
      </head>
      <body className="min-h-screen flex flex-col bg-ivory text-espresso antialiased">
        <AdminAuthProvider>
          <StoreProvider>
            <UserAuthProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <ScrollReveal />
              <Footer />
              <CartDrawer />
              <QuickViewModal />
              <MobileBottomNav />
            </UserAuthProvider>
          </StoreProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
