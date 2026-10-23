import type { Metadata } from "next";
import { CategoryLanding, type CategoryConfig } from "@/components/CategoryLanding";

export const metadata: Metadata = {
  title: "Selvedge, Carpenter & Baggy Jeans | Trend Street",
  description: "Okayama and Kurabo selvedge denim in carpenter, straight, baggy and wide-leg cuts. 14–15oz, made to fade.",
  alternates: { canonical: "/jeans" },
};

const CONFIG: CategoryConfig = {
  category: "Jeans",
  eyebrow: "Okayama shuttle-loom denim",
  titleTop: "Selvedge &",
  titleAccent: "carpenter jeans.",
  fallbackTagline: "14–15oz ring-spun selvedge woven on vintage shuttle looms. Rigid at first, then it fades into a record of how you wear it.",
  heroImage: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=2000&auto=format&fit=crop",
  checks: ["14–15oz redline selvedge", "Solid nickel hardware", "Natural slub texture"],
  specs: [
    {"value": "14–15 oz", "title": "Ring-spun pure cotton", "line": "Dense, honest denim with no stretch fibres, built to break in rather than wear out."},
    {"value": "Redline", "title": "Self-finished selvedge", "line": "The clean woven edge on the outseam is the mark of shuttle-loom denim."},
    {"value": "Puddle stack", "title": "Sneaker-length drape", "line": "Inseams cut long so the hem stacks and breaks over chunky sneakers."},
  ],
  fitTip: "Rigid denim relaxes about one waist size with wear. Choose snug, not tight.",
};

export default function JeansPage() {
  return <CategoryLanding config={CONFIG} />;
}
