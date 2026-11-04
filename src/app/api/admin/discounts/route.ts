import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Discounts & Coupon Management API
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json({
      coupons: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        discountPercent: c.discountPercent,
        description: c.description,
        active: c.active,
        minSpend: c.minSpend / 100, // Convert paise to rupees for UI
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : null,
        firstOrderOnly: c.firstOrderOnly,
        perCustomerLimit: c.perCustomerLimit,
      })),
    });
  } catch (err) {
    console.error("[Admin Discounts GET]:", err);
    return NextResponse.json({ error: "Could not load coupons." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const code = String(body?.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return NextResponse.json({ error: "Codes use 3–32 letters, numbers, - or _." }, { status: 400 });
    }
    const discountPercent = parseInt(body?.discountPercent, 10);
    const description = typeof body?.description === "string" ? body.description.trim() : null;
    const minSpendRupees = parseInt(body?.minSpend, 10) || 0;
    const maxUsesRaw = parseInt(body?.maxUses, 10);
    const maxUses = Number.isFinite(maxUsesRaw) && maxUsesRaw > 0 ? maxUsesRaw : null;
    const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Expiry date isn't a valid date." }, { status: 400 });
    }
    const firstOrderOnly = body?.firstOrderOnly === true;
    const perCustomerRaw = parseInt(body?.perCustomerLimit, 10);
    const perCustomerLimit = Number.isFinite(perCustomerRaw) && perCustomerRaw > 0 ? Math.min(perCustomerRaw, 1000) : null;

    if (!code || code.length < 3) {
      return NextResponse.json({ error: "Coupon code must be at least 3 characters." }, { status: 400 });
    }

    // 0% is allowed and means "free shipping" (see src/lib/coupons.ts).
    if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 90) {
      return NextResponse.json({ error: "Discount percent must be between 0% (free shipping) and 90%." }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: `Coupon code '${code}' already exists.` }, { status: 400 });
    }

    const created = await prisma.coupon.create({
      data: {
        code,
        discountPercent,
        description,
        minSpend: Math.round(minSpendRupees * 100), // Store in paise
        maxUses,
        expiresAt,
        active: true,
        firstOrderOnly,
        perCustomerLimit,
      },
    });

    await writeAudit(req, {
      action: "COUPON_CREATE",
      entityType: "Coupon",
      entityId: created.id,
      metadata: { code, discountPercent, minSpendRupees, firstOrderOnly, perCustomerLimit },
    });

    return NextResponse.json({
      success: true,
      coupon: {
        ...created,
        minSpend: created.minSpend / 100,
      },
    });
  } catch (err) {
    console.error("[Admin Discounts POST]:", err);
    return NextResponse.json({ error: "Failed to create coupon." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const id = body?.id;
    const active = typeof body?.active === "boolean" ? body.active : undefined;

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required." }, { status: 400 });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(active !== undefined ? { active } : {}),
      },
    });

    await writeAudit(req, {
      action: "COUPON_UPDATE",
      entityType: "Coupon",
      entityId: id,
      metadata: { active },
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (err) {
    console.error("[Admin Discounts PATCH]:", err);
    return NextResponse.json({ error: "Failed to update coupon." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required." }, { status: 400 });
    }

    const deleted = await prisma.coupon.delete({ where: { id } });

    await writeAudit(req, {
      action: "COUPON_DELETE",
      entityType: "Coupon",
      entityId: id,
      metadata: { code: deleted.code },
    });

    return NextResponse.json({ success: true, deletedCode: deleted.code });
  } catch (err) {
    console.error("[Admin Discounts DELETE]:", err);
    return NextResponse.json({ error: "Failed to delete coupon." }, { status: 500 });
  }
}
