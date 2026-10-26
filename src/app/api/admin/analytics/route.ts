import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { generateSafeCsv, getSafeExportFilename } from "@/lib/csv-security";
import { DB_TO_CATEGORY } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * Admin Operational Analytics API
 * Aggregates real database sales, refunds, silhouette splits, and daily revenue trends.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const range = req.nextUrl.searchParams.get("range") || "30d"; // "today", "7d", "30d", "90d"
    const isExport = req.nextUrl.searchParams.get("export") === "csv";

    // 1. Calculate date boundaries
    const now = new Date();
    let startDate = new Date();

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (range === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    // 2. Query Orders within date range
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        payments: true,
        items: {
          include: {
            variant: {
              include: { product: { select: { id: true, name: true, category: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 3. Compute Metrics
    let grossPaise = 0;
    let netPaise = 0;
    let cancelledPaise = 0;
    let cancelledCount = 0;
    let completedCount = 0;
    let totalUnitsSold = 0;

    const silhouetteMap: Record<string, { units: number; revenuePaise: number }> = {
      Oversized: { units: 0, revenuePaise: 0 },
      "Boxy Fit": { units: 0, revenuePaise: 0 },
      Jackets: { units: 0, revenuePaise: 0 },
    };

    const paymentMap = {
      razorpay: { count: 0, volumePaise: 0 },
      cod: { count: 0, volumePaise: 0 },
    };

    const dailyTrendsMap = new Map<string, { date: string; orders: number; revenuePaise: number }>();

    for (const o of orders) {
      grossPaise += o.totalAmount;
      const isCancelled = o.status === "CANCELLED";

      if (isCancelled) {
        cancelledCount++;
        cancelledPaise += o.totalAmount;
      } else {
        completedCount++;
        netPaise += o.totalAmount;

        // Daily trend
        const dayStr = o.createdAt.toISOString().slice(0, 10);
        const day = dailyTrendsMap.get(dayStr) || { date: dayStr, orders: 0, revenuePaise: 0 };
        day.orders += 1;
        day.revenuePaise += o.totalAmount;
        dailyTrendsMap.set(dayStr, day);

        // Payment method breakdown
        const isCod = o.payments.some((p) => p.provider === "CASH_ON_DELIVERY");
        if (isCod) {
          paymentMap.cod.count += 1;
          paymentMap.cod.volumePaise += o.totalAmount;
        } else {
          paymentMap.razorpay.count += 1;
          paymentMap.razorpay.volumePaise += o.totalAmount;
        }

        // Line items and silhouette calculation
        for (const it of o.items) {
          totalUnitsSold += it.quantity;
          const cat = DB_TO_CATEGORY[it.variant.product.category] || "Oversized";
          if (!silhouetteMap[cat]) silhouetteMap[cat] = { units: 0, revenuePaise: 0 };
          silhouetteMap[cat].units += it.quantity;
          silhouetteMap[cat].revenuePaise += it.totalPrice;
        }
      }
    }

    const aovPaise = completedCount > 0 ? Math.round(netPaise / completedCount) : 0;
    const dailyTrends = Array.from(dailyTrendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // CSV Export
    if (isExport) {
      const headers = ["Metric", "Value"];
      const rows = [
        ["Report Period", range],
        ["Generated At", now.toISOString()],
        ["Gross Sales (INR)", (grossPaise / 100).toFixed(2)],
        ["Net Realized Sales (INR)", (netPaise / 100).toFixed(2)],
        ["Refunded / Cancelled (INR)", (cancelledPaise / 100).toFixed(2)],
        ["Total Orders", orders.length],
        ["Realized Orders", completedCount],
        ["Cancelled Orders", cancelledCount],
        ["Average Order Value (INR)", (aovPaise / 100).toFixed(2)],
        ["Total Garment Units Sold", totalUnitsSold],
        ["Prepaid Razorpay Revenue (INR)", (paymentMap.razorpay.volumePaise / 100).toFixed(2)],
        ["Cash On Delivery Revenue (INR)", (paymentMap.cod.volumePaise / 100).toFixed(2)],
      ];

      const csv = generateSafeCsv(headers, rows);
      const filename = getSafeExportFilename(`analytics-${range}`);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        grossSales: grossPaise / 100,
        netSales: netPaise / 100,
        refundedAmount: cancelledPaise / 100,
        totalOrders: orders.length,
        completedOrders: completedCount,
        cancelledOrders: cancelledCount,
        aov: aovPaise / 100,
        unitsSold: totalUnitsSold,
      },
      silhouettes: Object.entries(silhouetteMap).map(([name, data]) => ({
        name,
        units: data.units,
        revenue: data.revenuePaise / 100,
        percentage: netPaise > 0 ? Math.round((data.revenuePaise / netPaise) * 100) : 0,
      })),
      paymentMethods: {
        razorpay: { count: paymentMap.razorpay.count, revenue: paymentMap.razorpay.volumePaise / 100 },
        cod: { count: paymentMap.cod.count, revenue: paymentMap.cod.volumePaise / 100 },
      },
      dailyTrends: dailyTrends.map((d) => ({
        ...d,
        revenue: d.revenuePaise / 100,
      })),
    });
  } catch (err) {
    console.error("[Admin Analytics GET]:", err);
    return NextResponse.json({ error: "Could not compute analytics report." }, { status: 503 });
  }
}
