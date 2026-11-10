import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadAccount, requireCustomer } from "@/lib/account";
import { verifyPassword } from "@/lib/customer-auth";
import { clearCustomerSessionCookie } from "@/lib/customer-session-cookie";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Everything the account page needs: details, saved addresses, wishlist and orders placed while signed in. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireCustomer(req);
    if (!auth.ok) return auth.response;
    return NextResponse.json(await loadAccount(auth.user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[Account] load:", err);
    return NextResponse.json({ error: "Your account couldn't be loaded right now." }, { status: 503 });
  }
}

/** Update name and mobile number. The sign-in email can't be changed here. */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireCustomer(req, "profile");
    if (!auth.ok) return auth.response;
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) : undefined;
    const phoneRaw = typeof body?.phone === "string" ? body.phone.replace(/\D/g, "").replace(/^(91|0)(?=[6-9]\d{9}$)/, "") : undefined;
    if (name !== undefined && name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (phoneRaw !== undefined && phoneRaw !== "" && !/^[6-9]\d{9}$/.test(phoneRaw)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }
    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: { ...(name !== undefined ? { name } : {}), ...(phoneRaw !== undefined ? { phone: phoneRaw || null } : {}) },
      select: { name: true, email: true, phone: true },
    });
    return NextResponse.json({ profile: { name: user.name || "", email: user.email, phone: user.phone || "" } });
  } catch (err) {
    console.error("[Account] update:", err);
    return NextResponse.json({ error: "Couldn't save your details. Please try again." }, { status: 503 });
  }
}

/**
 * Permanently delete customer account or pseudonymize/erase data (DPDP Act 2023 / Right to Erasure).
 * Requires current password verification.
 * If user has active (in-transit/processing) orders, deletion is prevented until fulfilled or cancelled.
 * If user has past historical orders, statutory tax/accounting records are retained while personal identifiers
 * are erased (pseudonymized) and all tokens/sessions/wishlist/cart are destroyed.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireCustomer(req, "delete-account");
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password) {
      return NextResponse.json({ error: "Please enter your password to confirm account deletion." }, { status: 400 });
    }

    if (!verifyPassword(password, auth.user.passwordHash || "")) {
      return NextResponse.json({ error: "Incorrect password. Deletion could not be confirmed." }, { status: 400 });
    }

    // Check for active orders in progress
    const activeOrders = await prisma.order.count({
      where: {
        userId: auth.user.id,
        status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "IN_TRANSIT", "SHIPPED"] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { error: "Cannot delete account while you have active orders in transit or processing. Please wait until your orders are delivered or cancelled." },
        { status: 400 }
      );
    }

    const userId = auth.user.id;
    const totalOrders = await prisma.order.count({ where: { userId } });

    await prisma.$transaction(async (tx) => {
      // Clear wishlist, cart, and authentication tokens
      await tx.wishlistItem.deleteMany({ where: { userId } });
      await tx.cart.deleteMany({ where: { userId } });
      await tx.authToken.deleteMany({ where: { userId } });

      if (totalOrders === 0) {
        // No order dependencies: full erasure
        await tx.address.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      } else {
        // Has past orders: delete unused saved addresses, anonymize user to satisfy statutory invoice retention
        await tx.address.deleteMany({ where: { userId, saved: true, orders: { none: {} } } });
        const tombstoneEmail = `deleted-${userId.slice(-8)}-${Date.now()}@erased.trendstreet.local`;
        await tx.user.update({
          where: { id: userId },
          data: {
            name: "Deleted Account",
            email: tombstoneEmail,
            phone: null,
            passwordHash: null,
            sessionVersion: { increment: 1000 },
            emailVerifiedAt: null,
          },
        });
      }
    });

    await writeAudit(req, {
      action: "CUSTOMER_ACCOUNT_DELETED",
      entityType: "User",
      entityId: userId,
      userId,
    });

    const res = NextResponse.json({ success: true, message: "Your account and personal data have been deleted." }, { status: 200 });
    clearCustomerSessionCookie(res, req);
    return res;
  } catch (err) {
    console.error("[Account] delete:", err);
    return NextResponse.json({ error: "Couldn't delete your account right now. Please try again later." }, { status: 503 });
  }
}

