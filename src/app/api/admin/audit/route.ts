import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Most recent privileged actions for the access register. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const action = req.nextUrl.searchParams.get("action") || undefined;
    const logs = await prisma.auditLog.findMany({
      where: action ? { action } : undefined,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { user: { select: { email: true, name: true } } },
    });
    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        actor: l.user?.email ?? (l.metadata as any)?.actorEmail ?? "system",
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[Admin audit]:", err);
    return NextResponse.json({ error: "Could not load the audit log." }, { status: 503 });
  }
}
