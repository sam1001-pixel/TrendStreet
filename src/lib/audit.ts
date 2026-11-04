/**
 * Privileged-action audit trail (feeds /admin/access-register).
 * Writing an audit entry must never break the action it records, so failures are logged and swallowed.
 */
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./auth";
import { getClientIp } from "./rate-limit";

export type AuditAction =
  | "ADMIN_LOGIN"
  | "ADMIN_LOGIN_FAILED"
  | "ADMIN_LOGOUT"
  | "ORDER_STATUS_UPDATE"
  | "ORDER_TRACKING_UPDATE"
  | "PRODUCT_CREATE"
  | "PRODUCT_EDIT"
  | "PRODUCT_DELETE"
  | "SETTINGS_CHANGE"
  | "STOCK_ADJUSTMENT"
  | "COUPON_CREATE"
  | "COUPON_UPDATE"
  | "COUPON_DELETE"
  | "STAFF_INVITE"
  | "MEDIA_DELETE"
  | "REVIEW_CREATE"
  | "REVIEW_EDIT"
  | "REVIEW_DELETE"
  | "STOCK_ALERTS_SENT"
  | "ORDER_CANCELLED_BY_CUSTOMER"
  | "RETURN_REQUESTED"
  | "RETURN_STATUS_UPDATE"
  // Security events (added 2026-11-05)
  | "ADMIN_LOGIN_BLOCKED"
  | "ADMIN_RECOVERY_CODE_USED"
  | "ADMIN_NEW_DEVICE_LOGIN"
  | "ADMIN_SESSIONS_REVOKED"
  | "ADMIN_REAUTH_REQUIRED"
  | "CUSTOMER_PASSWORD_CHANGED"
  | "CUSTOMER_PASSWORD_RESET_REQUESTED"
  | "CUSTOMER_PASSWORD_RESET"
  | "CUSTOMER_SIGNED_OUT_EVERYWHERE"
  | "CUSTOMER_EMAIL_CONFIRMED"
  | "CUSTOMER_LOGIN_LOCKED"
  | "WEBHOOK_SIGNATURE_FAILED"
  | "PAYMENT_VERIFY_REJECTED";

/** Email of the signed-in admin for this request, or null. */
export async function getAdminEmail(req: NextRequest): Promise<string | null> {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  return session?.email ?? null;
}

export async function writeAudit(
  req: NextRequest,
  entry: {
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
    actorEmail?: string | null;
    /** For customer security events: the customer's user id (their email isn't copied into the log). */
    userId?: string | null;
  }
) {
  try {
    const actorEmail = entry.userId ? null : entry.actorEmail ?? (await getAdminEmail(req));
    const actor = entry.userId
      ? { id: entry.userId }
      : actorEmail
        ? await prisma.user.findUnique({ where: { email: actorEmail }, select: { id: true } })
        : null;
    await prisma.auditLog.create({
      data: {
        userId: actor?.id ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        metadata: { actorEmail, ...(entry.metadata ?? {}) } as Prisma.InputJsonValue,
        ipAddress: getClientIp(req.headers),
        userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
    });
  } catch (err) {
    console.error("[Audit write failed]:", entry.action, (err as Error).message);
  }
}
