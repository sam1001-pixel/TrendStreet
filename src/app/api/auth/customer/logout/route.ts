import { NextRequest, NextResponse } from "next/server";
import { bumpSessionVersion } from "@/lib/customer-auth";
import { clearCustomerSessionCookie } from "@/lib/customer-session-cookie";
import { requireCustomer } from "@/lib/account";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Signs out this browser. With `{ "everywhere": true }` it also ends every other session for the
 * account (phones, other computers) by bumping the account's session version.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const everywhere = body?.everywhere === true;

  if (everywhere) {
    const auth = await requireCustomer(req, "logout-all");
    if (!auth.ok) return auth.response;
    try {
      await bumpSessionVersion(auth.user.id);
      await writeAudit(req, { action: "CUSTOMER_SIGNED_OUT_EVERYWHERE", entityType: "User", entityId: auth.user.id, userId: auth.user.id });
    } catch (e) {
      console.error("[Customer Auth] Sign out everywhere failed:", (e as Error).message);
      return NextResponse.json({ success: false, message: "Couldn't sign out other devices. Please try again." }, { status: 503 });
    }
  }

  const response = NextResponse.json(
    { success: true, message: everywhere ? "Signed out on every device." : "Signed out successfully." },
    { status: 200 }
  );
  clearCustomerSessionCookie(response, req);
  return response;
}
