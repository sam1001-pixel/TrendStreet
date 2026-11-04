import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_SAVED_ADDRESSES, parseAddress, requireCustomer, toAccountAddress } from "@/lib/account";

export const dynamic = "force-dynamic";

async function listFor(userId: string) {
  const rows = await prisma.address.findMany({ where: { userId, saved: true }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return rows.map(toAccountAddress);
}

/** Add an address (no id) or edit one of your saved addresses (with id). */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireCustomer(req, "address");
    if (!auth.ok) return auth.response;
    const body = await req.json().catch(() => ({}));
    const parsed = parseAddress(body);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const d = parsed.data;
    const userId = auth.user.id;
    const id = typeof body?.id === "string" ? body.id : null;

    await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId, saved: true } });
      const makeDefault = d.isDefault || count === 0;
      if (makeDefault) await tx.address.updateMany({ where: { userId, saved: true }, data: { isDefault: false } });
      const data = {
        label: d.label,
        fullName: d.fullName,
        phone: d.phone || null,
        street: d.address,
        apartment: d.apartment || null,
        city: d.city,
        state: d.state || null,
        postalCode: d.postalCode,
        country: "IN",
      };

      if (id) {
        const existing = await tx.address.findFirst({ where: { id, userId, saved: true }, include: { _count: { select: { orders: true } } } });
        if (!existing) throw new Error("NOT_FOUND");
        if (existing._count.orders > 0) {
          // Past orders keep the address they shipped to: retire this one and save the edit as a new row.
          await tx.address.update({ where: { id }, data: { saved: false, isDefault: false } });
          await tx.address.create({ data: { ...data, userId, saved: true, isDefault: makeDefault || existing.isDefault } });
        } else {
          await tx.address.update({ where: { id }, data: { ...data, isDefault: makeDefault || existing.isDefault } });
        }
      } else {
        if (count >= MAX_SAVED_ADDRESSES) throw new Error("TOO_MANY");
        await tx.address.create({ data: { ...data, userId, saved: true, isDefault: makeDefault } });
      }
    });

    return NextResponse.json({ addresses: await listFor(userId) });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") return NextResponse.json({ error: "That address no longer exists." }, { status: 404 });
    if (err instanceof Error && err.message === "TOO_MANY") {
      return NextResponse.json({ error: `You can save up to ${MAX_SAVED_ADDRESSES} addresses. Remove one first.` }, { status: 400 });
    }
    console.error("[Account] address save:", err);
    return NextResponse.json({ error: "Couldn't save the address. Please try again." }, { status: 503 });
  }
}

/** Remove a saved address. Addresses used by past orders are only hidden, so those orders keep their details. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireCustomer(req, "address");
    if (!auth.ok) return auth.response;
    const id = req.nextUrl.searchParams.get("id") || "";
    const userId = auth.user.id;
    const existing = await prisma.address.findFirst({ where: { id, userId, saved: true }, include: { _count: { select: { orders: true } } } });
    if (!existing) return NextResponse.json({ error: "That address no longer exists." }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      if (existing._count.orders > 0) await tx.address.update({ where: { id }, data: { saved: false, isDefault: false } });
      else await tx.address.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.address.findFirst({ where: { userId, saved: true }, orderBy: { createdAt: "asc" } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    return NextResponse.json({ addresses: await listFor(userId) });
  } catch (err) {
    console.error("[Account] address delete:", err);
    return NextResponse.json({ error: "Couldn't remove the address. Please try again." }, { status: 503 });
  }
}
