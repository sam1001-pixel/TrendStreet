import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOrderInclude, toAdminOrder } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

/** All orders, newest first. Protected by middleware (/api/admin/*). */
export async function GET() {
  try {
    const rows = await prisma.order.findMany({ include: adminOrderInclude, orderBy: { createdAt: "desc" }, take: 500 });
    return NextResponse.json({ orders: rows.map(toAdminOrder) });
  } catch (err) {
    console.error("[Admin orders]:", err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 503 });
  }
}
