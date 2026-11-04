import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Product titles, prices and stock come from the database; refresh every 5 minutes.
export const revalidate = 300;

async function findProduct(id: string) {
  const { products } = await getCatalog();
  return products.find((p) => p.id === id) ?? null;
}

const absolute = (src: string) => (src.startsWith("http") ? src : `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`);

/** Per-product title, description and share image (the page itself renders in the browser). */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await findProduct(id);
  if (!product) return { title: `Product not found | ${SITE_NAME}`, robots: { index: false } };

  const title = `${product.name} — ₹${product.price.toLocaleString("en-IN")} | ${SITE_NAME}`;
  const description = (product.subtitle ? `${product.subtitle}. ` : "") + product.description.slice(0, 150);
  const images = product.images.filter((i) => !i.startsWith("data:")).slice(0, 1).map(absolute);

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/product/${product.id}` },
    openGraph: { type: "website", title, description, url: `${SITE_URL}/product/${product.id}`, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await findProduct(id);

  const jsonLd = product && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: product.category,
    image: product.images.filter((i) => !i.startsWith("data:")).map(absolute),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: "INR",
      price: product.price.toFixed(2),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    // aggregateRating is added only once there are real, verified reviews.
    ...(product.reviewsCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewsCount } } : {}),
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // JSON.stringify output can't close the script tag once "<" is escaped.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      {children}
    </>
  );
}
