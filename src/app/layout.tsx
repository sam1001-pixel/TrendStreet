import type { Metadata, Viewport } from "next";
import { Montserrat, Big_Shoulders_Display } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

// OFFVYBE typography: Montserrat (ExtraBold / Medium per the brand sheet) for text and headings.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
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
import { HideOnAdmin } from "@/components/HideOnAdmin";
import { SITE_URL } from "@/lib/site";
import { getCachedStorefront } from "@/lib/catalog";

// viewport-fit=cover lets env(safe-area-inset-*) work, so bottom bars clear the iPhone home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export const metadata: Metadata = {
  title: "OFFVYBE | Wear Your Own Vibe — Oversized, Boxy Fit & Jackets",
  description:
    "OFFVYBE is the definitive contemporary luxury menswear house. Specializing in 520gsm loopback oversized hoodies, boxy fit knits, and handcrafted flight jackets.",
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
    "wear your own vibe",
  ],
  authors: [{ name: "OFFVYBE Studio" }],
  creator: "OFFVYBE",
  publisher: "OFFVYBE",
  metadataBase: new URL(SITE_URL),
  other: {
    "geo.region": "IN-MH",
    "geo.placename": "Mumbai, Bandra West",
    "geo.position": "19.0544;72.8346",
    "ICBM": "19.0544, 72.8346",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    title: "OFFVYBE | Wear Your Own Vibe — Oversized, Boxy Fit & Jackets",
    description:
      "Contemporary luxury menswear engineering. 520gsm Japanese loopback hoodies, boxy fit architecture, and handcrafted jackets.",
    siteName: "OFFVYBE",
  },
  twitter: {
    card: "summary_large_image",
    title: "OFFVYBE | Wear Your Own Vibe",
    description: "Contemporary Streetwear & Luxury Menswear: Oversized, Boxy Fit, Jackets.",
    creator: "@offvybe",
  },
};

// Re-render pages with the latest catalog at most once a minute (admin saves refresh it immediately).
export const revalidate = 60;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { products, videoReviews } = await getCachedStorefront();
  return (
    <html lang="en">
      <head>
        <StoreJsonLd />
      </head>
      <body className={`${montserrat.variable} ${display.variable} min-h-screen flex flex-col bg-ivory text-espresso antialiased`}>
        <SmoothScroll />
        <AdminAuthProvider>
          <StoreProvider initialProducts={products} initialVideoReviews={videoReviews}>
            <UserAuthProvider>
              <HideOnAdmin>
                <Header />
              </HideOnAdmin>
              <main className="flex-1">{children}</main>
              <ScrollReveal />
              <HideOnAdmin>
                <Footer />
                <CartDrawer />
                <QuickViewModal />
              </HideOnAdmin>
              <MobileBottomNav />
            </UserAuthProvider>
          </StoreProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
