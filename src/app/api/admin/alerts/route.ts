import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { notifyDropLive, notifyRestock } from "@/lib/stock-alerts";

export const dynamic = "force-dynamic";

/** Restock and next-drop sign-ups, newest first. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const rows = await prisma.stockAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: { product: { select: { name: true } } },
    });
    return NextResponse.json({
      alerts: rows.map((a) => ({
        id: a.id,
        kind: a.kind,
        productId: a.productId,
        productName: a.product?.name ?? null,
        size: a.size,
        email: a.email,
        phone: a.phone,
        notifiedAt: a.notifiedAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
      emailEnabled: Boolean(process.env.RESEND_API_KEY),
    });
  } catch (err) {
    console.error("[Admin alerts]:", err);
    return NextResponse.json({ error: "Could not load alerts. Run `npm run db:push` if this is the first time." }, { status: 503 });
  }
}

/**
 * Actions:
 *  { action: "notify-restock", productId } — email everyone waiting for a product that is back in stock
 *  { action: "notify-drop" }               — email everyone waiting for the next drop
 *  { action: "mark", ids }                 — mark as contacted (e.g. after messaging on WhatsApp)
 *  { action: "delete", ids }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string").slice(0, 500) : [];

    if (body?.action === "notify-restock" && typeof body.productId === "string") {
      const result = await notifyRestock(body.productId);
      await writeAudit(req, { action: "STOCK_ALERTS_SENT", entityType: "Product", entityId: body.productId, metadata: result });
      return NextResponse.json({ success: true, ...result });
    }
    if (body?.action === "notify-drop") {
      const result = await notifyDropLive();
      await writeAudit(req, { action: "STOCK_ALERTS_SENT", entityType: "Drop", entityId: "next-drop", metadata: result });
      return NextResponse.json({ success: true, ...result });
    }
    if (body?.action === "mark" && ids.length) {
      const r = await prisma.stockAlert.updateMany({ where: { id: { in: ids }, notifiedAt: null }, data: { notifiedAt: new Date() } });
      return NextResponse.json({ success: true, updated: r.count });
    }
    if (body?.action === "delete" && ids.length) {
      const r = await prisma.stockAlert.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ success: true, deleted: r.count });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    console.error("[Admin alerts action]:", err);
    return NextResponse.json({ error: "Could not complete that. Please try again." }, { status: 503 });
  }
}
