import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/account";
import { hashPasswordAsync, passwordProblem, signCustomerToken, verifyPasswordAsync, MAX_PASSWORD_LENGTH } from "@/lib/customer-auth";
import { setCustomerSessionCookie } from "@/lib/customer-session-cookie";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Change password (signed in). Needs the current password, ends every other session for the
 * account, and keeps this browser signed in with a fresh session.
 */
export async function POST(req: NextRequest) {
  const auth = await requireCustomer(req, "password");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const current = body?.currentPassword;
    if (typeof current !== "string" || !current || current.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Please enter your current password." }, { status: 400 });
    }
    if (!(await verifyPasswordAsync(current, auth.user.passwordHash!))) {
      return NextResponse.json({ error: "Your current password isn't right." }, { status: 400 });
    }
    const problem = passwordProblem(body?.newPassword, auth.user.email);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    if (body.newPassword === current) return NextResponse.json({ error: "Please choose a password you haven't used here." }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: { passwordHash: await hashPasswordAsync(body.newPassword), sessionVersion: { increment: 1 } },
      select: { id: true, email: true, name: true, sessionVersion: true },
    });
    await writeAudit(req, { action: "CUSTOMER_PASSWORD_CHANGED", entityType: "User", entityId: user.id, userId: user.id });

    const res = NextResponse.json({ success: true, message: "Password changed. Other devices have been signed out." });
    setCustomerSessionCookie(res, req, await signCustomerToken({ id: user.id, email: user.email, name: user.name || "Customer", sessionVersion: user.sessionVersion }));
    return res;
  } catch (err) {
    console.error("[Account] password change:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't change your password right now. Please try again." }, { status: 503 });
  }
}
