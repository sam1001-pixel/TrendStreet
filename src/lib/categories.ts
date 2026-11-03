import type { ProductCategory } from "@/types/store";

/** The four silhouettes, in the order the storefront shows them, with their landing pages. */
export const CATEGORY_LINKS: { category: ProductCategory; href: string; blurb: string }[] = [
  { category: "Oversized", href: "/oversized", blurb: "Heavy tees & hoodies" },
  { category: "Jeans", href: "/shop?category=Jeans", blurb: "Baggy & carpenter denim" },
  { category: "Boxy Fit", href: "/boxy-fit", blurb: "Cropped, wide-body shirts" },
  { category: "Jackets", href: "/jackets", blurb: "Bombers, chores & shells" },
];

export const categoryHref = (c: ProductCategory) => CATEGORY_LINKS.find((x) => x.category === c)?.href ?? "/shop";
