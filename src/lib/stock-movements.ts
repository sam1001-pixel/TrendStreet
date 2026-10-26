/**
 * Trend Street — Transactional Stock Adjustment & Movement Ledger Helper
 */
import { Prisma } from "@prisma/client";

export const VALID_STOCK_REASONS = [
  "RESTOCK",
  "DAMAGE",
  "RETURN",
  "CORRECTION",
  "AUDIT_RECONCILIATION",
  "PROMOTION",
] as const;

export type StockAdjustmentReason = typeof VALID_STOCK_REASONS[number];

export interface StockAdjustmentInput {
  inventoryId: string;
  changeQty: number; // positive or negative integer
  reason: StockAdjustmentReason;
  notes?: string;
  performedBy?: string;
  ipAddress?: string;
}

export class StockAdjustmentError extends Error {}

/**
 * Adjusts inventory quantity atomically and records an immutable StockMovement entry.
 * Can be run within an existing Prisma transaction or standalone.
 */
export async function adjustInventoryTransactional(
  tx: Prisma.TransactionClient,
  input: StockAdjustmentInput
) {
  const { inventoryId, changeQty, reason, notes, performedBy, ipAddress } = input;

  if (!Number.isInteger(changeQty) || changeQty === 0) {
    throw new StockAdjustmentError("Adjustment quantity must be a non-zero integer.");
  }

  if (!VALID_STOCK_REASONS.includes(reason)) {
    throw new StockAdjustmentError(`Invalid adjustment reason. Must be one of: ${VALID_STOCK_REASONS.join(", ")}`);
  }

  // 1. Fetch current inventory record
  const currentInv = await tx.inventory.findUnique({
    where: { id: inventoryId },
    include: { variant: { include: { product: true } } },
  });

  if (!currentInv) {
    throw new StockAdjustmentError("Inventory record not found.");
  }

  const balanceBefore = currentInv.quantity;
  const balanceAfter = balanceBefore + changeQty;

  const reserved = (currentInv as any).reservedQty || 0;
  if (balanceAfter < reserved) {
    throw new StockAdjustmentError(
      `Insufficient available stock: current quantity is ${balanceBefore} with ${reserved} reserved for pending checkouts.`
    );
  }

  // 2. Atomic update to prevent lost updates under concurrency
  const updatedInv = await tx.inventory.update({
    where: { id: inventoryId },
    data: {
      quantity: changeQty > 0 ? { increment: changeQty } : { decrement: Math.abs(changeQty) },
    },
  });

  // 3. Create immutable StockMovement record
  const movement = await tx.stockMovement.create({
    data: {
      inventoryId,
      changeQty,
      balanceBefore,
      balanceAfter,
      reason,
      notes: notes?.trim() || null,
      performedBy: performedBy || "admin",
    },
  });

  // 4. Create AuditLog entry
  await tx.auditLog.create({
    data: {
      action: "STOCK_ADJUSTMENT",
      entityType: "Inventory",
      entityId: inventoryId,
      ipAddress: ipAddress || null,
      metadata: {
        productName: currentInv.variant.product.name,
        sku: currentInv.variant.sku,
        size: currentInv.variant.size,
        color: currentInv.variant.colorName,
        changeQty,
        balanceBefore,
        balanceAfter,
        reason,
        notes,
        performedBy,
      },
    },
  });

  return { inventory: { ...updatedInv, quantity: balanceAfter }, movement };
}
