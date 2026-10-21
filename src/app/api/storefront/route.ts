import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCatalog } from "@/lib/catalog";
import { settingsFromDb } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

/** Public catalog + CMS settings for the storefront, edge-cached briefly. */
export async function GET() {
  const [{ products, source }, settingsRow] = await Promise.all([
    getCatalog(),
    prisma.siteSettings.findUnique({ where: { id: "global" } }).catch(() => null),
  ]);

  return NextResponse.json(
    { products, settings: settingsFromDb(settingsRow), source },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } }
  );
}
