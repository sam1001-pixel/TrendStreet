import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const STATUSES = ["REQUESTED", "APPROVED", "PICKED_UP", "COMPLETED", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];

/** Exchange / return requests, open ones first. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;
  try {
    const rows = await prisma.returnRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { order: { include: { user: { select: { email: true } }, shippingAddress: true, payments: { select: { provider: true } } } } },
    });
    return NextResponse.json({
      requests: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        status: r.status,
        reason: r.reason,
        note: r.note,
        adminNote: r.adminNote,
        items: r.items,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        order: {
          id: r.order.id,
          orderNumber: r.order.orderNumber,
          total: r.order.totalAmount / 100,
          paidOnline: !r.order.payments.some((p) => p.provider === "CASH_ON_DELIVERY"),
          customerName: r.order.shippingAddress.fullName,
          email: r.order.user?.email ?? "",
          phone: r.order.shippingAddress.phone ?? "",
          address: [r.order.shippingAddress.street, r.order.shippingAddress.apartment, r.order.shippingAddress.city, r.order.shippingAddress.state, r.order.shippingAddress.postalCode]
            .filter(Boolean)
            .join(", "),
        },
      })),
    });
  } catch (err) {
    console.error("[Admin returns]:", err);
    return NextResponse.json({ error: "Could not load requests. Run `npm run db:push` if this is the first time." }, { status: 503 });
  }
}

/** { id, status?, adminNote? } — the note is shown to the customer on their order. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;
  try {
    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : "";
    const status = STATUSES.includes(body?.status) ? (body.status as Status) : undefined;
    const adminNote =
      typeof body?.adminNote === "string" ? body.adminNote.replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 300) || null : undefined;
    if (!id || (status === undefined && adminNote === undefined)) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

    const before = await prisma.returnRequest.findUnique({ where: { id }, include: { order: { select: { orderNumber: true } } } });
    if (!before) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    const updated = await prisma.returnRequest.update({
      where: { id },
      data: { ...(status ? { status } : {}), ...(adminNote !== undefined ? { adminNote } : {}) },
    });
    if (status && status !== before.status) {
      await writeAudit(req, {
        action: "RETURN_STATUS_UPDATE",
        entityType: "ReturnRequest",
        entityId: id,
        metadata: { orderNumber: before.order.orderNumber, from: before.status, to: status },
      });
    }
    return NextResponse.json({ success: true, status: updated.status, adminNote: updated.adminNote });
  } catch (err) {
    console.error("[Admin returns] update:", err);
    return NextResponse.json({ error: "Could not update the request." }, { status: 503 });
  }
}
