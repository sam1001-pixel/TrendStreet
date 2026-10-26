import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { adjustInventoryTransactional, StockAdjustmentReason } from "@/lib/stock-movements";
import { generateSafeCsv, getSafeExportFilename } from "@/lib/csv-security";
import { DB_TO_CATEGORY } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * Dedicated Inventory API
 * GET: Searchable variant stock, low/out filters, movement logs, and CSV export.
 * POST: Reason-enforced transactional stock adjustments with movement ledger.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const search = req.nextUrl.searchParams.get("search")?.toLowerCase().trim() || "";
    const filter = req.nextUrl.searchParams.get("filter") || "all"; // "all" | "low" | "out"
    const isExport = req.nextUrl.searchParams.get("export") === "csv";

    // 1. Fetch all inventory records with variant and product relations
    const rows = await prisma.inventory.findMany({
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                featured: true,
              },
            },
          },
        },
        movements: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 2. Format and filter records
    const formatted = rows.map((r) => {
      const available = Math.max(0, r.quantity - r.reservedQty);
      const isOutOfStock = r.quantity === 0;
      const isLowStock = r.quantity > 0 && r.quantity <= 5;
      const status = isOutOfStock
        ? "Out of Stock"
        : isLowStock
        ? "Low Stock"
        : "In Stock";

      return {
        id: r.id,
        inventoryId: r.id,
        variantId: r.variantId,
        productId: r.variant.productId,
        productName: r.variant.product.name,
        category: DB_TO_CATEGORY[r.variant.product.category] || r.variant.product.category,
        size: r.variant.size,
        colorName: r.variant.colorName,
        colorHex: r.variant.colorHex,
        sku: r.variant.sku,
        quantity: r.quantity,
        reservedQty: r.reservedQty,
        available,
        status,
        updatedAt: r.updatedAt.toISOString(),
        recentMovements: r.movements.map((m) => ({
          id: m.id,
          changeQty: m.changeQty,
          balanceBefore: m.balanceBefore,
          balanceAfter: m.balanceAfter,
          reason: m.reason,
          notes: m.notes,
          performedBy: m.performedBy,
          createdAt: m.createdAt.toISOString(),
        })),
      };
    });

    // Apply search filter
    let filtered = formatted;
    if (search) {
      filtered = filtered.filter(
        (it) =>
          it.productName.toLowerCase().includes(search) ||
          it.sku.toLowerCase().includes(search) ||
          it.size.toLowerCase().includes(search) ||
          it.colorName.toLowerCase().includes(search) ||
          it.category.toLowerCase().includes(search)
      );
    }

    // Apply stock status filter
    if (filter === "low") {
      filtered = filtered.filter((it) => it.quantity > 0 && it.quantity <= 5);
    } else if (filter === "out") {
      filtered = filtered.filter((it) => it.quantity === 0);
    }

    // CSV Export requested
    if (isExport) {
      const headers = [
        "Product Name",
        "Silhouette",
        "Size",
        "Colour",
        "SKU",
        "Current Quantity",
        "Reserved Quantity",
        "Available Units",
        "Status",
        "Last Updated",
      ];

      const csvRows = filtered.map((r) => [
        r.productName,
        r.category,
        r.size,
        r.colorName,
        r.sku,
        r.quantity,
        r.reservedQty,
        r.available,
        r.status,
        r.updatedAt,
      ]);

      const csvContent = generateSafeCsv(headers, csvRows);
      const filename = getSafeExportFilename("inventory");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Calculate store inventory metrics
    const totalSkus = formatted.length;
    const totalUnits = formatted.reduce((acc, it) => acc + it.quantity, 0);
    const lowStockCount = formatted.filter((it) => it.quantity > 0 && it.quantity <= 5).length;
    const outOfStockCount = formatted.filter((it) => it.quantity === 0).length;

    return NextResponse.json({
      items: filtered,
      metrics: {
        totalSkus,
        totalUnits,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (err) {
    console.error("[Admin Inventory GET]:", err);
    return NextResponse.json(
      { error: "Could not load inventory catalog." },
      { status: 503 }
    );
  }
}

/**
 * Reason-enforced Stock Adjustment
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const inventoryId = body?.inventoryId;
    const changeQty = Number(body?.changeQty);
    const reason = body?.reason as StockAdjustmentReason;
    const notes = typeof body?.notes === "string" ? body.notes : "";

    if (!inventoryId) {
      return NextResponse.json({ error: "Inventory ID is required." }, { status: 400 });
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const result = await prisma.$transaction(async (tx) => {
      return adjustInventoryTransactional(tx, {
        inventoryId,
        changeQty,
        reason,
        notes,
        performedBy: auth.session.email || "admin",
        ipAddress,
      });
    });

    return NextResponse.json({
      success: true,
      inventory: result.inventory,
      movement: result.movement,
    });
  } catch (err) {
    console.error("[Admin Inventory POST]:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to adjust inventory." },
      { status: 400 }
    );
  }
}
