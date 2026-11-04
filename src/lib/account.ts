/**
 * Signed-in customer account data kept on the server, so details, saved addresses, wishlist and
 * orders follow the shopper to any phone or laptop. Server-only.
 */
import { NextResponse, type NextRequest } from "next/server";
import type { Address } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLACED_ORDERS_WHERE } from "@/lib/admin-orders";
import { customerOrderInclude, getCustomerSession, toCustomerOrder } from "@/lib/order-actions";
import { checkDistributedRateLimit } from "@/lib/rate-limit";
import { isValidIndianPincode } from "@/lib/pincode";
import { INDIAN_STATES_AND_UTS } from "@/lib/indian-states";

export const MAX_SAVED_ADDRESSES = 10;
export const MAX_WISHLIST = 200;

export interface AccountAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export function toAccountAddress(a: Address): AccountAddress {
  return {
    id: a.id,
    label: a.label || "Home",
    fullName: a.fullName,
    phone: a.phone || "",
    address: a.street,
    apartment: a.apartment || "",
    city: a.city,
    state: a.state || "",
    postalCode: a.postalCode,
    isDefault: a.isDefault,
  };
}

/**
 * Resolves the signed-in customer, or returns the response to send instead.
 * `writeKey` applies a per-account rate limit to changes.
 */
export async function requireCustomer(req: NextRequest, writeKey?: string) {
  const session = await getCustomerSession(req);
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, name: true, phone: true, role: true, passwordHash: true } });
  if (!user || user.role !== "CUSTOMER" || !user.passwordHash) {
    return { ok: false as const, response: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) };
  }
  if (writeKey) {
    const limit = await checkDistributedRateLimit(`account:${writeKey}:${user.id}`, { windowMs: 60_000, maxRequests: 30 });
    if (!limit.allowed) {
      return { ok: false as const, response: NextResponse.json({ error: "Too many changes at once. Please wait a moment." }, { status: 429 }) };
    }
  }
  return { ok: true as const, user };
}

export async function loadAccount(userId: string) {
  const [user, addresses, wishlist, orders] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true, phone: true, createdAt: true } }),
    prisma.address.findMany({ where: { userId, saved: true }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    prisma.wishlistItem.findMany({ where: { userId, product: { archived: false } }, orderBy: { createdAt: "desc" }, select: { productId: true } }),
    prisma.order.findMany({
      where: { userId, placedSignedIn: true, ...PLACED_ORDERS_WHERE },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: customerOrderInclude,
    }),
  ]);
  return {
    profile: { name: user.name || "", email: user.email, phone: user.phone || "", memberSince: user.createdAt.toISOString() },
    addresses: addresses.map(toAccountAddress),
    wishlist: wishlist.map((w) => w.productId),
    orders: orders.map(toCustomerOrder),
  };
}

export type AccountData = Awaited<ReturnType<typeof loadAccount>>;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

export const INDIAN_STATES = new Set(INDIAN_STATES_AND_UTS);

/** Validates an address from the account page. Returns the data or a shopper-readable error. */
export function parseAddress(raw: unknown): { data: Omit<AccountAddress, "id"> } | { error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const phone = clean(r.phone, 20).replace(/\D/g, "").replace(/^(91|0)(?=[6-9]\d{9}$)/, "");
  const data = {
    label: clean(r.label, 30) || "Home",
    fullName: clean(r.fullName, 80),
    phone,
    address: clean(r.address, 200),
    apartment: clean(r.apartment, 100),
    city: clean(r.city, 60),
    state: clean(r.state, 60),
    postalCode: clean(r.postalCode, 6).replace(/\D/g, ""),
    isDefault: r.isDefault === true,
  };
  if (data.fullName.length < 2) return { error: "Please enter the full name." };
  if (phone && !/^[6-9]\d{9}$/.test(phone)) return { error: "Please enter a valid 10-digit mobile number." };
  if (data.address.length < 5) return { error: "Please enter the house number and street." };
  if (data.city.length < 2) return { error: "Please enter the city." };
  if (data.state && !INDIAN_STATES.has(data.state)) return { error: "Please choose the state from the list." };
  if (!isValidIndianPincode(data.postalCode)) return { error: "Please enter a valid 6-digit PIN code." };
  return { data };
}
