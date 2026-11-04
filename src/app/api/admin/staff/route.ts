import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { AdminRole, ROLE_PERMISSIONS } from "@/lib/admin-rbac";

export const dynamic = "force-dynamic";

/**
 * Staff list. Only one account can sign in to admin today: the owner set in ADMIN_EMAIL.
 * Other staff records in the database are listed so they're visible, but they have no login yet.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const ownerEmail = (process.env.ADMIN_EMAIL || auth.session.email).toLowerCase();
    const [dbStaff, lastLogin] = await Promise.all([
      prisma.user.findMany({
        where: { OR: [{ role: "ADMIN" }, { role: "ATELIER_STAFF" }] },
        select: { id: true, name: true, email: true, phone: true, role: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.auditLog.findFirst({
        where: { action: "ADMIN_LOGIN" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const staff = [
      {
        id: "owner",
        name: "Store owner",
        email: ownerEmail,
        phone: "",
        role: "Owner/Admin" as AdminRole,
        twoFactorEnabled: false,
        status: "Active",
        lastLogin: lastLogin?.createdAt.toISOString() ?? null,
      },
      ...dbStaff
        .filter((u) => u.email.toLowerCase() !== ownerEmail)
        .map((u) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          phone: u.phone || "",
          role: (u.role === "ADMIN" ? "Owner/Admin" : "Read-only Analyst") as AdminRole,
          twoFactorEnabled: false,
          status: "No login yet",
          lastLogin: null,
        })),
    ];

    return NextResponse.json({ staff, roles: Object.keys(ROLE_PERMISSIONS) });
  } catch (err) {
    console.error("[Admin Staff GET]:", err);
    return NextResponse.json({ error: "Could not load staff accounts." }, { status: 503 });
  }
}

/** Staff invitations need per-person logins and role checks, which aren't built yet. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  return NextResponse.json(
    {
      error:
        "Staff invitations aren't available yet. Only the owner account (ADMIN_EMAIL) can sign in to admin, so an invite wouldn't give anyone access.",
    },
    { status: 501 }
  );
}
