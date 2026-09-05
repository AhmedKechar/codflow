import { eq, and, sql, gte } from "drizzle-orm";
import { products, productVariants, stockMovements } from "../db/schema";

type DbLike = { select(fields?: any): any; update(table: any): any; insert(table: any): any };

export interface AdjustInventoryParams {
  db: DbLike;
  storeId: string;
  productId: string;
  variantId: string | null;
  delta: number;
  movementType: string;
  reference: string | null;
  actorId: string;
  actorName: string;
  createdAt: string;
}

export async function adjustInventory(params: AdjustInventoryParams): Promise<{
  qtyBefore: number;
  qtyAfter: number;
} | null> {
  const { db, storeId, productId, variantId, delta, movementType, reference, actorId, actorName, createdAt } = params;

  if (delta === 0) return null;

  if (variantId) {
    const updated = await db
      .update(productVariants)
      .set({ inventory: sql`MAX(0, ${productVariants.inventory} + ${delta})` })
      .where(
        delta > 0
          ? eq(productVariants.id, variantId)
          : and(eq(productVariants.id, variantId), gte(productVariants.inventory, Math.abs(delta))),
      )
      .returning({ inventory: productVariants.inventory });

    if (!updated.length) return null;

    const qtyAfter = updated[0].inventory;
    const qtyBefore = qtyAfter - delta;

    await db.insert(stockMovements).values({
      id: crypto.randomUUID(),
      storeId,
      productId,
      variantId,
      type: movementType as any,
      delta,
      qtyBefore,
      qtyAfter,
      reason: null,
      reference,
      createdBy: actorId,
      createdByName: actorName,
      createdAt,
    });

    return { qtyBefore, qtyAfter };
  } else {
    const updated = await db
      .update(products)
      .set({ inventory: sql`MAX(0, ${products.inventory} + ${delta})` })
      .where(
        delta > 0
          ? eq(products.id, productId)
          : and(eq(products.id, productId), gte(products.inventory, Math.abs(delta))),
      )
      .returning({ inventory: products.inventory });

    if (!updated.length) return null;

    const qtyAfter = updated[0].inventory;
    const qtyBefore = qtyAfter - delta;

    await db.insert(stockMovements).values({
      id: crypto.randomUUID(),
      storeId,
      productId,
      variantId: null,
      type: movementType as any,
      delta,
      qtyBefore,
      qtyAfter,
      reason: null,
      reference,
      createdBy: actorId,
      createdByName: actorName,
      createdAt,
    });

    return { qtyBefore, qtyAfter };
  }
}
