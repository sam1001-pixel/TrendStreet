import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Big_Shoulders_Display } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Big_Shoulders_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
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
import { SmoothScroll } from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Trend Street | The Style Hub — Oversized, Boxy Fit & Jackets",
  description:
    "Trend Street is the definitive contemporary luxury menswear house. Specializing in 520gsm loopback oversized hoodies, boxy fit knits, and handcrafted flight jackets.",
  keywords: [
    "trend street",
    "oversized hoodie",
    "heavyweight oversized tee",
    "heavyweight streetwear",
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
    title: "Trend Street | The Style Hub — Oversized, Boxy Fit & Jackets",
    description:
      "Contemporary luxury menswear engineering. 520gsm Japanese loopback hoodies, boxy fit architecture, and handcrafted jackets.",
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
    description: "Contemporary Streetwear & Luxury Menswear: Oversized, Boxy Fit, Jackets.",
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
    <html lang="en">
      <head>
        <StoreJsonLd />
      </head>
      <body className={`${sans.variable} ${serif.variable} ${display.variable} min-h-screen flex flex-col bg-ivory text-espresso antialiased`}>
        <SmoothScroll />
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
