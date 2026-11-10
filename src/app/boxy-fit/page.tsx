import type { Metadata } from "next";
import { CategoryLanding, type CategoryConfig } from "@/components/CategoryLanding";

export const metadata: Metadata = {
  title: "Boxy Fit Shirts, Knits & Tees | Trend Street",
  description: "Cropped, square-cut boxy shirts, knits and tees with wide bodies and structured collars.",
  alternates: { canonical: "/boxy-fit" },
};

const CONFIG: CategoryConfig = {
  category: "Boxy Fit",
  eyebrow: "Geometric tailoring",
  titleTop: "Boxy fit",
  titleAccent: "geometry.",
  fallbackTagline: "Cropped hems, wide bodies and a structured collar. Square on purpose, and made to pair with high-rise denim.",
  heroImage: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2000&auto=format&fit=crop",
  checks: ["Squared-off flat hems", "Extra-fine merino knits", "Structured 3cm collars"],
  specs: [
    {"value": "1:1 ratio", "title": "Square torso balance", "line": "Width and length cut close to equal for that clean, box-shaped line."},
    {"value": "Cropped", "title": "High-rise pairing", "line": "Hems finish at the belt so wide jeans and carpenters show their rise."},
    {"value": "220–320 GSM", "title": "Fabric that holds an edge", "line": "Mercerized poplin and dense jersey keep the square shape all day."},
  ],
  fitTip: "Boxy pieces are meant to be wide and short. If you're between sizes, go with your usual one.",
  clothesFirst: true,
};

export default function BoxyFitPage() {
  return <CategoryLanding config={CONFIG} />;
}
