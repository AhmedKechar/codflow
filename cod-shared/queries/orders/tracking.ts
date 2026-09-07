import type { AppDb } from "../../db/client";
import { orders } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export async function syncOrderAfterCarrierUpdate(
  db: AppDb,
  storeId: string,
  orderId: string,
  fields: { customerName?: string; phone?: string; price?: number },
) {
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (fields.customerName !== undefined) patch.customerName = fields.customerName;
  if (fields.phone !== undefined) patch.phone = fields.phone;
  if (fields.price !== undefined) patch.price = fields.price;

  await db.update(orders).set(patch).where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));
}

export async function updateOrderTracking(
  db: AppDb,
  storeId: string,
  orderId: string,
  trackingNumber: string,
  trackingUrl?: string,
  deliveryMethodName?: string,
) {
  await db
    .update(orders)
    .set({
      trackingNumber,
      trackingUrl: trackingUrl ?? null,
      ...(deliveryMethodName ? { deliveryMethodName } : {}),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));
}

export async function clearOrderTracking(db: AppDb, storeId: string, orderId: string) {
  await db
    .update(orders)
    .set({
      trackingNumber: null,
      trackingUrl: null,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));
}
