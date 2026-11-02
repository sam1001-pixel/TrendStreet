import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOrderInclude, PLACED_ORDERS_WHERE, toAdminOrder } from "@/lib/admin-orders";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** All orders, newest first. Protected by middleware and route-level session validation. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    // Online orders that were never paid (awaiting payment, or released after 30 minutes) aren't real
    // orders yet, so they're kept out of the fulfilment list.
    const rows = await prisma.order.findMany({
      where: PLACED_ORDERS_WHERE,
      include: adminOrderInclude,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json({ orders: rows.map(toAdminOrder) });
  } catch (err) {
    console.error("[Admin orders]:", err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 503 });
  }
}
