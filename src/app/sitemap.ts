import { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

// Rebuild hourly so products added in /admin appear without a redeploy.
export const revalidate = 3600;

const PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/oversized", priority: 0.8, changeFrequency: "weekly" },
  { path: "/boxy-fit", priority: 0.8, changeFrequency: "weekly" },
  { path: "/jackets", priority: 0.8, changeFrequency: "weekly" },
  { path: "/why-trend-street", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/track", priority: 0.4, changeFrequency: "monthly" },
  { path: "/shipping-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/returns", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getCatalog();
  const now = new Date();

  return [
    ...PAGES.map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority })),
    ...products.map((product) => ({
      url: `${SITE_URL}/product/${product.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];
}
