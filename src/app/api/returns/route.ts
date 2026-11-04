import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDistributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { RETURN_REASONS, canRequestReturn, customerOrderInclude, loadOwnOrder, toCustomerOrder } from "@/lib/order-actions";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const NOT_FOUND = "We couldn't find an order with that number and email.";

/**
 * Exchange / return request for a delivered order, within the return window.
 * Body: { orderNumber, email?, kind: "EXCHANGE" | "RETURN", reason, note?, items: [{ orderItemId, quantity, exchangeSize? }] }
 */
export async function POST(req: NextRequest) {
  const limit = await checkDistributedRateLimit(`returns:${getClientIp(req.headers)}`, { windowMs: 15 * 60 * 1000, maxRequests: 10 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });

  try {
    const body = await req.json().catch(() => ({}));
    const order = await loadOwnOrder(req, body?.orderNumber, body?.email);
    if (!order) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    if (!canRequestReturn(order)) {
      return NextResponse.json(
        {
          error:
            order.status !== "DELIVERED"
              ? "Exchanges open once your order is delivered."
              : order.returnRequests.some((r) => ["REQUESTED", "APPROVED", "PICKED_UP"].includes(r.status))
                ? "You already have a request open for this order. We'll be in touch soon."
                : "The 30-day exchange window for this order has closed.",
        },
        { status: 409 }
      );
    }

    const kind = body?.kind === "RETURN" ? "RETURN" : body?.kind === "EXCHANGE" ? "EXCHANGE" : null;
    if (!kind) return NextResponse.json({ error: "Choose exchange or return." }, { status: 400 });
    const reason = RETURN_REASONS.find((r) => r === body?.reason);
    if (!reason) return NextResponse.json({ error: "Please choose a reason." }, { status: 400 });
    const note = typeof body?.note === "string" ? body.note.replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 500) : "";

    // Every line must be an item of this order, in a quantity that was bought.
    const rawItems: unknown[] = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
    const items: { orderItemId: string; productName: string; size: string; quantity: number; exchangeSize: string | null }[] = [];
    for (const raw of rawItems) {
      const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const line = order.items.find((i) => i.id === r.orderItemId);
      const qty = Math.floor(Number(r.quantity));
      if (!line || !Number.isFinite(qty) || qty < 1 || qty > line.quantity || items.some((x) => x.orderItemId === line.id)) {
        return NextResponse.json({ error: "Please choose the items again." }, { status: 400 });
      }
      let exchangeSize: string | null = null;
      if (kind === "EXCHANGE") {
        const sizes = await prisma.productVariant.findMany({ where: { productId: line.variant.productId }, select: { size: true } });
        exchangeSize = typeof r.exchangeSize === "string" && sizes.some((s) => s.size === r.exchangeSize) ? r.exchangeSize : null;
        if (!exchangeSize) return NextResponse.json({ error: `Choose the new size for ${line.variant.product.name}.` }, { status: 400 });
      }
      items.push({ orderItemId: line.id, productName: line.variant.product.name, size: line.variant.size, quantity: qty, exchangeSize });
    }
    if (!items.length) return NextResponse.json({ error: "Choose at least one item." }, { status: 400 });

    const created = await prisma.returnRequest.create({ data: { orderId: order.id, kind, reason, note: note || null, items } });
    await writeAudit(req, {
      action: "RETURN_REQUESTED",
      entityType: "Order",
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, kind, requestId: created.id },
    }).catch(() => {});

    const fresh = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: customerOrderInclude });
    return NextResponse.json({ success: true, order: toCustomerOrder(fresh) });
  } catch (err) {
    console.error("[Returns]:", err);
    return NextResponse.json({ error: "We couldn't send your request right now. Please try again." }, { status: 503 });
  }
}
