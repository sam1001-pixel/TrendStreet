import type { Metadata } from "next";
import { CategoryLanding, type CategoryConfig } from "@/components/CategoryLanding";

export const metadata: Metadata = {
  title: "Suede Bombers, Canvas & Leather Jackets | Trend Street",
  description: "Suede MA-1 bombers, duck canvas chore coats, field jackets and full-grain leather moto jackets.",
  alternates: { canonical: "/jackets" },
};

const CONFIG: CategoryConfig = {
  category: "Jackets",
  eyebrow: "Suede, canvas & leather",
  titleTop: "The jackets",
  titleAccent: "vault.",
  fallbackTagline: "Suede flight bombers, washed duck canvas, field jackets and full-grain leather. Built to outlast a decade of trends.",
  heroImage: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=2000&auto=format&fit=crop",
  checks: ["Tuscan lambskin suede", "16oz washed duck canvas", "Two-way heavy zips"],
  specs: [
    {"value": "100% suede", "title": "Lambskin you can feel", "line": "Soft, dense suede that ages to a rich patina instead of cracking."},
    {"value": "16 oz duck", "title": "Washed heavy canvas", "line": "Pre-washed so it starts soft and keeps getting better with every wear."},
    {"value": "2-way zips", "title": "Hardware that lasts", "line": "Heavy two-way zips let you sit and ride without the jacket riding up."},
  ],
  fitTip: "Jackets are cut to layer over a hoodie. Take your usual size; size down only if you'll wear it over tees.",
};

export default function JacketsPage() {
  return <CategoryLanding config={CONFIG} />;
}
