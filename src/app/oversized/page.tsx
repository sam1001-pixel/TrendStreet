import type { Metadata } from "next";
import { CategoryLanding, type CategoryConfig } from "@/components/CategoryLanding";

export const metadata: Metadata = {
  title: "Oversized Tees & Hoodies | Trend Street",
  description: "Heavyweight oversized tees and hoodies in 320–520gsm cotton with dropped shoulders. Free delivery over ₹1,999.",
  alternates: { canonical: "/oversized" },
};

const CONFIG: CategoryConfig = {
  category: "Oversized",
  eyebrow: "320–520 gsm cotton",
  titleTop: "The oversized",
  titleAccent: "architecture.",
  fallbackTagline: "Custom 320–520gsm loopback and combed jersey. Dropped shoulders, zero side tension and a drape that stands off the body.",
  heroImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2000&auto=format&fit=crop",
  checks: ["520gsm loopback terry", "Pre-shrunk & garment dyed", "Seamless dropped shoulders"],
  specs: [
    {"value": "320–520 GSM", "title": "Real fabric weight", "line": "Light tees cling; heavy jersey drapes. Ours keeps its square shape as you move."},
    {"value": "+12 cm", "title": "Calculated shoulder drop", "line": "The seam sits 12cm past the shoulder while the cuff stays snug, so sleeves never bunch."},
    {"value": "Double-walled", "title": "Hoods that stand up", "line": "Two-ply hoods hold their shape on their own and frame the face."},
  ],
  fitTip: "Take your usual size for the intended oversized drape, or size down once for a closer fit.",
};

export default function OversizedPage() {
  return <CategoryLanding config={CONFIG} />;
}
