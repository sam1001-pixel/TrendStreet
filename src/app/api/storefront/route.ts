import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCatalog, getVideoReviews } from "@/lib/catalog";
import { settingsFromDb } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

/** Public catalog, video reviews and CMS settings for the storefront, edge-cached briefly. */
export async function GET() {
  const [{ products, source }, videoReviews, settingsRow] = await Promise.all([
    getCatalog(),
    getVideoReviews(),
    prisma.siteSettings.findUnique({ where: { id: "global" } }).catch(() => null),
  ]);

  return NextResponse.json(
    { products, videoReviews, settings: settingsFromDb(settingsRow), source },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } }
  );
}
