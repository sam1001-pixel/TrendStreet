import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { UserAuthProvider } from "@/context/UserAuthContext";
import { AccountProvider } from "@/context/AccountContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { QuickViewModal } from "@/components/QuickViewModal";
import { AddedToBagToast } from "@/components/AddedToBagToast";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
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
    "OFFVYBE is the definitive contemporary luxury menswear house. Specializing in 240–350gsm loopback oversized hoodies, boxy fit knits, and handcrafted flight jackets.",
  keywords: [
    "offvybe",
    "₹499 t-shirts",
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
  // Opened from the iPhone home screen: full screen, with the OFFVYBE name under the icon.
  appleWebApp: { capable: true, title: "OFFVYBE", statusBarStyle: "black" },
  other: {
    "geo.region": "IN-RJ",
    "geo.placename": "Jodhpur, Rajasthan",
    "geo.position": "26.2389;73.0243",
    "ICBM": "26.2389, 73.0243",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    title: "OFFVYBE | Wear Your Own Vibe — Oversized, Boxy Fit & Jackets",
    description:
      "Contemporary luxury menswear engineering. 240–350gsm Japanese loopback hoodies, boxy fit architecture, and handcrafted jackets.",
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
  const { products, videoReviews, settings } = await getCachedStorefront();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Montserrat:wght@400;500;600;700&display=swap"
        />
        <StoreJsonLd />
      </head>
      <body className="min-h-screen flex flex-col bg-ivory text-espresso antialiased">
        <SmoothScroll />
        <AdminAuthProvider>
          <StoreProvider initialProducts={products} initialVideoReviews={videoReviews} initialSettings={settings}>
            <UserAuthProvider>
             <AccountProvider>
              <HideOnAdmin>
                <Header />
              </HideOnAdmin>
              <main className="flex-1">{children}</main>
              <ScrollReveal />
              <HideOnAdmin>
                <Footer />
                <CartDrawer />
                <QuickViewModal />
                <AddedToBagToast />
                <InstallAppPrompt />
              </HideOnAdmin>
              <MobileBottomNav />
             </AccountProvider>
            </UserAuthProvider>
          </StoreProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
