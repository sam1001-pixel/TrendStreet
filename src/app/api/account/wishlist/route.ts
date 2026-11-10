import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_WISHLIST, requireCustomer } from "@/lib/account";

export const dynamic = "force-dynamic";

/** Replaces the saved-items list with the one on this device (ids of live products only). */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireCustomer(req, "wishlist");
    if (!auth.ok) return auth.response;
    const body = await req.json().catch(() => ({}));
    const requested: string[] = Array.isArray(body?.productIds)
      ? Array.from(new Set<string>(body.productIds.filter((x: unknown): x is string => typeof x === "string" && x.length <= 40))).slice(0, MAX_WISHLIST)
      : [];
    const userId = auth.user.id;

    const live = await prisma.product.findMany({ where: { id: { in: requested }, archived: false }, select: { id: true } });
    const keep = live.map((p) => p.id);

    await prisma.$transaction([
      prisma.wishlistItem.deleteMany({ where: { userId } }),
      prisma.wishlistItem.createMany({ data: keep.map((productId) => ({ userId, productId })) }),
    ]);
    return NextResponse.json({ wishlist: keep });
  } catch (err) {
    console.error("[Account] wishlist:", err);
    return NextResponse.json({ error: "Couldn't sync your saved items." }, { status: 503 });
  }
}
