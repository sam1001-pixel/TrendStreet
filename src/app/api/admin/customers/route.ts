import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { generateSafeCsv, getSafeExportFilename } from "@/lib/csv-security";

export const dynamic = "force-dynamic";

/**
 * Customers Directory API
 * Returns list of customer accounts with aggregated lifetime spend and order count.
 * Supports search and safe CSV export with formula injection protection.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const search = req.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";
    const isExport = req.nextUrl.searchParams.get("export") === "csv";

    // 1. Fetch registered users and orders
    const [users, orders] = await Promise.all([
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        include: { addresses: true, orders: { select: { id: true, totalAmount: true, status: true, createdAt: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          shippingAddress: true,
          user: { select: { email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // 2. Aggregate customers by email
    const customerMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string;
      city: string;
      state: string;
      postalCode: string;
      orderCount: number;
      lifetimeSpendMinor: number;
      memberSince: string;
      lastOrderDate: string | null;
      status: string;
    }>();

    // Ingest registered users
    for (const u of users) {
      const liveOrders = u.orders.filter((o) => o.status !== "CANCELLED");
      const spend = liveOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const defaultAddr = u.addresses.find((a) => a.isDefault) || u.addresses[0];
      const latestOrder = u.orders[0];

      customerMap.set(u.email.toLowerCase(), {
        id: u.id,
        name: u.name || defaultAddr?.fullName || "Valued Client",
        email: u.email,
        phone: u.phone || defaultAddr?.phone || "—",
        city: defaultAddr?.city || "—",
        state: defaultAddr?.state || "—",
        postalCode: defaultAddr?.postalCode || "—",
        orderCount: u.orders.length,
        lifetimeSpendMinor: spend,
        memberSince: u.createdAt.toISOString().slice(0, 10),
        lastOrderDate: latestOrder ? latestOrder.createdAt.toISOString().slice(0, 10) : null,
        status: "Registered",
      });
    }

    // Ingest guest orders
    for (const o of orders) {
      const email = (o.user?.email || o.shippingAddress?.fullName?.toLowerCase().replace(/\s+/g, ".") + "@guest.trendstreet.in").toLowerCase();
      if (!customerMap.has(email)) {
        const isLive = o.status !== "CANCELLED";
        customerMap.set(email, {
          id: `guest-${o.id}`,
          name: o.shippingAddress?.fullName || o.user?.name || "Guest Patron",
          email: o.user?.email || email,
          phone: o.shippingAddress?.phone || "—",
          city: o.shippingAddress?.city || "—",
          state: o.shippingAddress?.state || "—",
          postalCode: o.shippingAddress?.postalCode || "—",
          orderCount: 1,
          lifetimeSpendMinor: isLive ? o.totalAmount : 0,
          memberSince: o.createdAt.toISOString().slice(0, 10),
          lastOrderDate: o.createdAt.toISOString().slice(0, 10),
          status: "Guest Checkout",
        });
      }
    }

    let customers = Array.from(customerMap.values());

    // Search filter
    if (search) {
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.toLowerCase().includes(search) ||
          c.city.toLowerCase().includes(search)
      );
    }

    // Sort by lifetime spend descending
    customers.sort((a, b) => b.lifetimeSpendMinor - a.lifetimeSpendMinor);

    // CSV Export
    if (isExport) {
      const headers = [
        "Customer Name",
        "Email",
        "Phone",
        "City",
        "State",
        "Postal Code",
        "Total Orders",
        "Lifetime Spend (INR)",
        "Member Since",
        "Last Order Date",
        "Account Type",
      ];

      const csvRows = customers.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.city,
        c.state,
        c.postalCode,
        c.orderCount,
        (c.lifetimeSpendMinor / 100).toFixed(2),
        c.memberSince,
        c.lastOrderDate || "—",
        c.status,
      ]);

      const csv = generateSafeCsv(headers, csvRows);
      const filename = getSafeExportFilename("customers");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const totalCustomers = customers.length;
    const totalRevenuePaise = customers.reduce((acc, c) => acc + c.lifetimeSpendMinor, 0);
    const avgLifetimeValue = totalCustomers > 0 ? Math.round(totalRevenuePaise / totalCustomers) : 0;

    return NextResponse.json({
      customers: customers.map((c) => ({
        ...c,
        lifetimeSpend: c.lifetimeSpendMinor / 100,
      })),
      metrics: {
        totalCustomers,
        totalRevenue: totalRevenuePaise / 100,
        avgLifetimeValue: avgLifetimeValue / 100,
      },
    });
  } catch (err) {
    console.error("[Admin Customers GET]:", err);
    return NextResponse.json(
      { error: "Could not load customers directory." },
      { status: 503 }
    );
  }
}
