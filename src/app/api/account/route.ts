import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadAccount, requireCustomer } from "@/lib/account";

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
