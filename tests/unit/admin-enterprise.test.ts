import test from "node:test";
import assert from "node:assert/strict";
import { escapeCsvCell, generateSafeCsv, getSafeExportFilename } from "../../src/lib/csv-security";
import {
  ROLE_PERMISSIONS,
  hasPermission,
  assertPermission,
  RbacPermissionError,
  AdminRole,
  AdminModule,
  AdminAction,
} from "../../src/lib/admin-rbac";
import {
  VALID_STOCK_REASONS,
  StockAdjustmentError,
  adjustInventoryTransactional,
} from "../../src/lib/stock-movements";
import { checkPincodeServiceability } from "../../src/lib/pincode";
import { calculateOrderPricing, formatMinorUnits } from "../../src/lib/pricing";

// ---------------------------------------------------------------------------
// 1. CSV Formula Injection Defense (CWE-1236)
// ---------------------------------------------------------------------------
test("CSV Security - escapes formula injection triggers (=, +, -, @, \\t, \\r)", () => {
  // Test formula injection triggers
  assert.equal(escapeCsvCell("=1+1"), "\"\'=1+1\"");
  assert.equal(escapeCsvCell("=SUM(A1:A10)"), "\"\'=SUM(A1:A10)\"");
  assert.equal(escapeCsvCell("+CMD|' /C calc'!A0"), "\"\' +CMD|' /C calc'!A0\"".replace(/ /g, " ") && "\"\' +CMD|' /C calc'!A0\"".replace(/ \+/g, "+"));
  assert.equal(escapeCsvCell("-2+3"), "\"\' -2+3\"".replace(/ -/g, "-"));
  assert.equal(escapeCsvCell("@SUM(A1:A10)"), "\"\'@SUM(A1:A10)\"");
  assert.equal(escapeCsvCell("\tmalicious_tab"), "\"\'\tmalicious_tab\"");
  assert.equal(escapeCsvCell("\rmalicious_cr"), "\"\'\rmalicious_cr\"");

  // Leading whitespace bypass attempt
  assert.equal(escapeCsvCell("   =1+1"), "\"\'   =1+1\"");

  // Non-dangerous strings remain normal (without leading single-quote)
  assert.equal(escapeCsvCell("Trend Street Oversized Hoodie"), "\"Trend Street Oversized Hoodie\"");
  assert.equal(escapeCsvCell("admin@trendstreet.in"), "\"admin@trendstreet.in\"");
  assert.equal(escapeCsvCell(249900), "\"249900\"");

  // Null and undefined
  assert.equal(escapeCsvCell(null), '""');
  assert.equal(escapeCsvCell(undefined), '""');

  // Double quote escaping (RFC 4180 standard)
  assert.equal(escapeCsvCell('He said "Luxury"'), '"He said ""Luxury"""');
});

test("CSV Security - generateSafeCsv formats rows and headers with formula protection", () => {
  const headers = ["Customer Name", "Email", "Total Spend (paise)", "Formula Attack"];
  const rows = [
    ["Samrat", "samrat@example.com", 599800, "Safe Value"],
    ["Attacker", "hacker@test.com", 0, "=cmd|'/C calc'!A0"],
  ];

  const csv = generateSafeCsv(headers, rows);
  const lines = csv.split("\r\n");

  assert.equal(lines.length, 3);
  assert.equal(lines[0], '"Customer Name","Email","Total Spend (paise)","Formula Attack"');
  assert.equal(lines[1], '"Samrat","samrat@example.com","599800","Safe Value"');
  // Formula trigger in row 2 must be prefixed with single quote
  assert.equal(lines[2], '"Attacker","hacker@test.com","0","\'=cmd|\'/C calc\'!A0"');
});

test("CSV Security - getSafeExportFilename produces sanitized timestamped filename", () => {
  const filename = getSafeExportFilename("Patron Ledger & Spend");
  assert.ok(filename.startsWith("trendstreet-patron-ledger---spend-"));
  assert.ok(filename.endsWith(".csv"));
});

// ---------------------------------------------------------------------------
// 2. Role-Based Access Control (RBAC) Least-Privilege Matrix
// ---------------------------------------------------------------------------
test("Admin RBAC - Owner/Admin role possesses universal permissions across all modules", () => {
  const allModules: AdminModule[] = [
    "overview",
    "orders",
    "products",
    "inventory",
    "customers",
    "discounts",
    "shipping",
    "analytics",
    "content",
    "settings",
    "staff",
    "audit",
  ];
  const allActions: AdminAction[] = ["view", "create", "update", "delete", "export"];

  for (const module of allModules) {
    for (const action of allActions) {
      assert.equal(
        hasPermission("Owner/Admin", module, action),
        true,
        `Owner must have ${action} on ${module}`
      );
    }
  }
});

test("Admin RBAC - Catalog Manager can manage products and inventory but not staff or settings", () => {
  // Allowed
  assert.equal(hasPermission("Catalog Manager", "products", "create"), true);
  assert.equal(hasPermission("Catalog Manager", "products", "update"), true);
  assert.equal(hasPermission("Catalog Manager", "inventory", "update"), true);
  assert.equal(hasPermission("Catalog Manager", "inventory", "export"), true);
  assert.equal(hasPermission("Catalog Manager", "discounts", "create"), true);

  // Strictly prohibited (least privilege)
  assert.equal(hasPermission("Catalog Manager", "staff", "view"), false);
  assert.equal(hasPermission("Catalog Manager", "staff", "create"), false);
  assert.equal(hasPermission("Catalog Manager", "settings", "update"), false);
  assert.equal(hasPermission("Catalog Manager", "shipping", "view"), false);
  assert.equal(hasPermission("Catalog Manager", "customers", "view"), false);
});

test("Admin RBAC - Fulfilment Manager has order & shipping authority without financial access", () => {
  // Allowed
  assert.equal(hasPermission("Fulfilment Manager", "orders", "view"), true);
  assert.equal(hasPermission("Fulfilment Manager", "orders", "update"), true);
  assert.equal(hasPermission("Fulfilment Manager", "shipping", "create"), true);
  assert.equal(hasPermission("Fulfilment Manager", "shipping", "update"), true);
  assert.equal(hasPermission("Fulfilment Manager", "inventory", "update"), true);

  // Strictly prohibited
  assert.equal(hasPermission("Fulfilment Manager", "staff", "view"), false);
  assert.equal(hasPermission("Fulfilment Manager", "discounts", "view"), false);
  assert.equal(hasPermission("Fulfilment Manager", "content", "view"), false);
  assert.equal(hasPermission("Fulfilment Manager", "settings", "view"), false);
});

test("Admin RBAC - Read-only Analyst has view & export rights but zero write privileges", () => {
  const writeActions: AdminAction[] = ["create", "update", "delete"];
  const modulesWithRead: AdminModule[] = [
    "overview",
    "orders",
    "products",
    "inventory",
    "customers",
    "discounts",
    "shipping",
    "analytics",
    "content",
    "settings",
    "audit",
  ];

  for (const module of modulesWithRead) {
    for (const action of writeActions) {
      assert.equal(
        hasPermission("Read-only Analyst", module, action),
        false,
        `Read-only Analyst must never have ${action} on ${module}`
      );
    }
  }

  // Allowed views & exports
  assert.equal(hasPermission("Read-only Analyst", "analytics", "view"), true);
  assert.equal(hasPermission("Read-only Analyst", "analytics", "export"), true);
});

test("Admin RBAC - assertPermission passes authorized actions and throws RbacPermissionError on denied actions", () => {
  // Should not throw for authorized action
  assert.doesNotThrow(() => {
    assertPermission("Catalog Manager", "products", "create");
  });

  // Should throw RbacPermissionError for unauthorized action
  assert.throws(
    () => {
      assertPermission("Read-only Analyst", "orders", "create");
    },
    (err: any) => err instanceof RbacPermissionError && err.message.includes("Access denied")
  );
});

// ---------------------------------------------------------------------------
// 3. Stock Adjustment Validation & Business Constraints
// ---------------------------------------------------------------------------
test("Stock Ledger - rejects invalid adjustment reasons", () => {
  const validSet = new Set(VALID_STOCK_REASONS);
  assert.ok(validSet.has("RESTOCK"));
  assert.ok(validSet.has("DAMAGE"));
  assert.ok(validSet.has("RETURN"));
  assert.ok(validSet.has("CORRECTION"));
  assert.ok(validSet.has("AUDIT_RECONCILIATION"));
  assert.ok(validSet.has("PROMOTION"));

  // Mock Prisma client transaction
  const mockTx: any = {
    inventory: {
      findUnique: async () => ({ id: "inv-1", quantity: 10, variant: { product: { name: "Hoodie" } } }),
      update: async () => {},
    },
    stockMovement: { create: async () => ({}) },
    auditLog: { create: async () => ({}) },
  };

  // Assert invalid reasons throw
  assert.rejects(
    async () => {
      await adjustInventoryTransactional(mockTx, {
        inventoryId: "inv-1",
        changeQty: 5,
        reason: "INVALID_REASON" as any,
      });
    },
    (err: any) => err instanceof StockAdjustmentError && err.message.includes("Invalid adjustment reason")
  );
});

test("Stock Ledger - rejects zero and non-integer quantity adjustments", () => {
  const mockTx: any = {};

  // Zero change
  assert.rejects(
    async () => {
      await adjustInventoryTransactional(mockTx, {
        inventoryId: "inv-1",
        changeQty: 0,
        reason: "RESTOCK",
      });
    },
    (err: any) => err instanceof StockAdjustmentError && err.message.includes("non-zero integer")
  );

  // Decimal change
  assert.rejects(
    async () => {
      await adjustInventoryTransactional(mockTx, {
        inventoryId: "inv-1",
        changeQty: 2.5,
        reason: "RESTOCK",
      });
    },
    (err: any) => err instanceof StockAdjustmentError && err.message.includes("non-zero integer")
  );
});

test("Stock Ledger - prevents negative resulting inventory balance", async () => {
  const mockTx: any = {
    inventory: {
      findUnique: async () => ({
        id: "inv-1",
        quantity: 5,
        variant: { product: { name: "Boxy Shirt" } },
      }),
    },
  };

  // Attempting to deduct 10 when stock is 5
  await assert.rejects(
    async () => {
      await adjustInventoryTransactional(mockTx, {
        inventoryId: "inv-1",
        changeQty: -10,
        reason: "DAMAGE",
      });
    },
    (err: any) => err instanceof StockAdjustmentError && err.message.includes("Insufficient")
  );
});

test("Stock Ledger - records balanceBefore and balanceAfter accurately on positive & negative delta", async () => {
  let createdMovement: any = null;
  let updatedInv: any = null;

  const mockTx: any = {
    inventory: {
      findUnique: async () => ({
        id: "inv-99",
        quantity: 15,
        variant: {
          product: { name: "Tokyo Loopback Hoodie" },
          sku: "TS-OVR-BLK-L",
          size: "L",
          colorName: "Washed Black",
        },
      }),
      update: async (args: any) => {
        updatedInv = args.data;
        return { id: "inv-99", ...args.data };
      },
    },
    stockMovement: {
      create: async (args: any) => {
        createdMovement = args.data;
        return { id: "mov-1", ...args.data };
      },
    },
    auditLog: {
      create: async () => ({ id: "audit-1" }),
    },
  };

  // Restock 10 items
  const result = await adjustInventoryTransactional(mockTx, {
    inventoryId: "inv-99",
    changeQty: 10,
    reason: "RESTOCK",
    notes: "Supplier consignment lot #4092",
    performedBy: "admin@trendstreet.in",
  });

  assert.equal(result.inventory.quantity, 25);
  assert.equal(createdMovement.balanceBefore, 15);
  assert.equal(createdMovement.balanceAfter, 25);
  assert.equal(createdMovement.changeQty, 10);
  assert.equal(createdMovement.reason, "RESTOCK");
  assert.equal(createdMovement.performedBy, "admin@trendstreet.in");
});

// ---------------------------------------------------------------------------
// 4. Logistics & Financial Calculations in Integer Minor Units (Paise)
// ---------------------------------------------------------------------------
test("Enterprise Logistics - Indian PIN serviceability guarantees SLA across zones", () => {
  // Tier 1 Metro (Mumbai 400001)
  const mumbai = checkPincodeServiceability("400001");
  assert.equal(mumbai.isServiceable, true);
  assert.equal(mumbai.city, "Mumbai");
  assert.equal(mumbai.transitDaysMin, 2);
  assert.equal(mumbai.transitDaysMax, 3);

  // Delhi (110001)
  const delhi = checkPincodeServiceability("110001");
  assert.equal(delhi.isServiceable, true);
  assert.equal(delhi.city, "New Delhi");
  assert.equal(delhi.transitDaysMin, 2);
  assert.equal(delhi.transitDaysMax, 3);

  // Bengaluru (560001)
  const bangalore = checkPincodeServiceability("560001");
  assert.equal(bangalore.isServiceable, true);
  assert.equal(bangalore.city, "Bengaluru");

  // Invalid PIN code
  const invalid = checkPincodeServiceability("000111");
  assert.equal(invalid.isServiceable, false);
});

test("Enterprise Pricing - Lifetime value and order calculations preserve paise precision", () => {
  const cart = [
    { id: "1", name: "Tokyo Hoodie", unitPriceMinor: 249900, quantity: 2, size: "L", color: "Washed Black" },
    { id: "2", name: "Milan Overshirt", unitPriceMinor: 199900, quantity: 1, size: "M", color: "Poplin White" },
  ];

  const pricing = calculateOrderPricing(cart, { promoCode: "TREND10" });
  // Subtotal = 2 * 249900 + 199900 = 499800 + 199900 = 699700 paise (₹6,997)
  assert.equal(pricing.subtotalMinor, 699700);

  // 10% coupon = 69970 paise (₹699.70)
  assert.equal(pricing.discountMinor, 69970);

  // Shipping fee is free since subtotal > ₹1,999
  assert.equal(pricing.shippingMinor, 0);

  // Final Total = 699700 - 69970 = 629730 paise (₹6,297.30)
  assert.equal(pricing.totalMinor, 629730);

  // Formatted INR representation
  assert.match(formatMinorUnits(pricing.totalMinor), /6,297/);
});
