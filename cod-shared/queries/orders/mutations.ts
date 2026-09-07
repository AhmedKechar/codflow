import type { AppDb } from "../../db/client";
import {
  orders,
  orderProducts,
  orderStatusHistory,
  customers,
  productVariants,
  products,
  drivers,
  stockMovements,
  companyShipments,
  activityLogs,
} from "../../db/schema";
import type { OrderStatus } from "../../db/schema";
import { eq, and, sql, gte, inArray } from "drizzle-orm";

type DbLike = {
  select(fields?: any): any;
  update(table: any): any;
  insert(table: any): any;
  delete(table: any): any;
};

async function batchFetchTrackInventory(
  db: DbLike,
  productIds: string[],
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (productIds.length === 0) return map;
  const uniqueIds = [...new Set(productIds)];
  const rows = await db
    .select({ id: products.id, trackInventory: products.trackInventory })
    .from(products)
    .where(inArray(products.id, uniqueIds))
    .all();
  for (const row of rows) map.set(row.id, !!row.trackInventory);
  return map;
}

async function batchFetchVariantInventory(
  db: DbLike,
  variantIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (variantIds.length === 0) return map;
  const uniqueIds = [...new Set(variantIds)];
  const rows = await db
    .select({ id: productVariants.id, inventory: productVariants.inventory })
    .from(productVariants)
    .where(inArray(productVariants.id, uniqueIds))
    .all();
  for (const row of rows) map.set(row.id, row.inventory);
  return map;
}

async function batchFetchProductInventory(
  db: DbLike,
  productIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (productIds.length === 0) return map;
  const uniqueIds = [...new Set(productIds)];
  const rows = await db
    .select({ id: products.id, inventory: products.inventory })
    .from(products)
    .where(inArray(products.id, uniqueIds))
    .all();
  for (const row of rows) map.set(row.id, row.inventory);
  return map;
}

export async function createOrder(
  db: AppDb,
  storeId: string,
  orderData: typeof orders.$inferInsert,
  productsData: Array<typeof orderProducts.$inferInsert>,
  actor?: { id: string; name: string } | null,
) {
  return db.transaction(async (tx) => {
    await tx.insert(orders).values({ ...orderData, storeId });

    if (productsData.length > 0) {
      await tx.insert(orderProducts).values(productsData);
    }

    await tx.insert(orderStatusHistory).values({
      id: crypto.randomUUID(),
      storeId,
      orderId: orderData.id!,
      status: orderData.status!,
      timestamp: orderData.createdAt!,
      by: null,
    });

    await tx
      .update(customers)
      .set({
        totalOrders: sql`${customers.totalOrders} + 1`,
        totalSpent: sql`${customers.totalSpent} + ${orderData.price ?? 0}`,
        lastOrderAt: orderData.createdAt,
      })
      .where(eq(customers.id, orderData.customerId));

    const now = orderData.createdAt ?? new Date().toISOString();

    const productIds = productsData.map((p) => p.productId as string);
    const trackMap = await batchFetchTrackInventory(tx, productIds);

    for (const item of productsData) {
      const qty = item.quantity as number;

      if (!trackMap.get(item.productId as string)) continue;

      if (item.variantId) {
        const updated = await tx
          .update(productVariants)
          .set({
            inventory: sql`MAX(0, ${productVariants.inventory} - ${qty})`,
            updatedAt: now,
          })
          .where(
            and(
              eq(productVariants.id, item.variantId),
              gte(productVariants.inventory, qty),
            ),
          )
          .returning({ inventory: productVariants.inventory });

        if (!updated.length) {
          throw new Error(`Insufficient inventory for variant ${item.variantId}`);
        }

        const qtyAfter = updated[0].inventory;
        const qtyBefore = qtyAfter + qty;

        await tx
          .insert(stockMovements)
          .values({
            id: crypto.randomUUID(),
            storeId,
            productId: item.productId,
            variantId: item.variantId,
            type: "ORDER_DEDUCTED",
            delta: -qty,
            qtyBefore,
            qtyAfter,
            reason: null,
            reference: orderData.id ?? null,
            createdBy: actor?.id ?? "system",
            createdByName: actor?.name ?? "النظام",
            createdAt: now,
          });
      } else {
        const updated = await tx
          .update(products)
          .set({
            inventory: sql`MAX(0, ${products.inventory} - ${qty})`,
            updatedAt: now,
          })
          .where(
            and(
              eq(products.id, item.productId),
              gte(products.inventory, qty),
            ),
          )
          .returning({ inventory: products.inventory });

        if (!updated.length) {
          throw new Error(`Insufficient inventory for product ${item.productId}`);
        }

        const qtyAfter = updated[0].inventory;
        const qtyBefore = qtyAfter + qty;

        await tx
          .insert(stockMovements)
          .values({
            id: crypto.randomUUID(),
            storeId,
            productId: item.productId,
            variantId: null,
            type: "ORDER_DEDUCTED",
            delta: -qty,
            qtyBefore,
            qtyAfter,
            reason: null,
            reference: orderData.id ?? null,
            createdBy: actor?.id ?? "system",
            createdByName: actor?.name ?? "النظام",
            createdAt: now,
          });
      }
    }

    return orderData.id;
  });
}

export async function updateOrder(
  db: AppDb,
  orderId: string,
  storeId: string,
  data: {
    customerName?: string;
    phone?: string;
    wilayaId?: number;
    communeId?: string;
    address?: string;
    price?: number;
    deliveryFee?: number;
    deliveryType?: "home" | "stop_desk";
    stationCode?: string;
    notes?: string;
    weight?: number;
    isFragile?: boolean;
    products?: Array<{
      productId: string;
      variantId?: string | null;
      quantity: number;
      pricePerUnit: number;
    }>;
  }
) {
  const existing = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
    .get();

  if (!existing) {
    throw new Error("Order not found");
  }

  const editableStatuses = ["new", "confirmed", "busy", "unreachable"];
  if (!editableStatuses.includes(existing.status)) {
    throw new Error(`Cannot edit order in ${existing.status} status`);
  }

  const now = new Date().toISOString();

  if (data.products && data.products.length > 0) {
    const oldProducts = await db
      .select({
        id: orderProducts.id,
        productId: orderProducts.productId,
        variantId: orderProducts.variantId,
        quantity: orderProducts.quantity,
      })
      .from(orderProducts)
      .where(eq(orderProducts.orderId, orderId))
      .all();

    const oldProductIds = oldProducts.map((p) => p.productId as string);
    const oldVariantIds = oldProducts.filter((p) => p.variantId).map((p) => p.variantId as string);
    const [oldTrackMap, oldVariantInvMap, oldProductInvMap] = await Promise.all([
      batchFetchTrackInventory(db, oldProductIds),
      batchFetchVariantInventory(db, oldVariantIds),
      batchFetchProductInventory(db, oldProductIds),
    ]);

    for (const op of oldProducts) {
      if (!op.productId) continue;
      if (!oldTrackMap.get(op.productId)) continue;

      if (op.variantId) {
        const qtyBefore = oldVariantInvMap.get(op.variantId) ?? 0;
        const qtyAfter = qtyBefore + op.quantity;
        await db
          .update(productVariants)
          .set({ inventory: qtyAfter, updatedAt: now })
          .where(eq(productVariants.id, op.variantId));
      } else {
        const qtyBefore = oldProductInvMap.get(op.productId) ?? 0;
        const qtyAfter = qtyBefore + op.quantity;
        await db
          .update(products)
          .set({ inventory: qtyAfter, updatedAt: now })
          .where(eq(products.id, op.productId));
      }
    }

    await db
      .delete(orderProducts)
      .where(eq(orderProducts.orderId, orderId));

    const newProductIds = data.products.map((p) => p.productId);
    const newVariantIds = data.products.filter((p) => p.variantId).map((p) => p.variantId as string);
    const [newTrackMap, newVariantInvMap, newProductInvMap] = await Promise.all([
      batchFetchTrackInventory(db, newProductIds),
      batchFetchVariantInventory(db, newVariantIds),
      batchFetchProductInventory(db, newProductIds),
    ]);

    for (const item of data.products) {
      const lineTotal = item.pricePerUnit * item.quantity;

      await db.insert(orderProducts).values({
        id: crypto.randomUUID(),
        storeId,
        orderId,
        productId: item.productId,
        productName: "product",
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        lineTotal,
        returnedQuantity: 0,
        createdAt: now,
      });

      if (newTrackMap.get(item.productId)) {
        if (item.variantId) {
          const qtyBefore = newVariantInvMap.get(item.variantId) ?? 0;
          const qtyAfter = Math.max(0, qtyBefore - item.quantity);
          await db
            .update(productVariants)
            .set({ inventory: qtyAfter, updatedAt: now })
            .where(eq(productVariants.id, item.variantId));
        } else {
          const qtyBefore = newProductInvMap.get(item.productId) ?? 0;
          const qtyAfter = Math.max(0, qtyBefore - item.quantity);
          await db
            .update(products)
            .set({ inventory: qtyAfter, updatedAt: now })
            .where(eq(products.id, item.productId));
        }
      }
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: now };

  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.wilayaId !== undefined) updateData.wilayaId = data.wilayaId;
  if (data.communeId !== undefined) updateData.communeId = data.communeId;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.deliveryFee !== undefined) updateData.deliveryFee = data.deliveryFee;
  if (data.deliveryType !== undefined) updateData.deliveryType = data.deliveryType;
  if (data.stationCode !== undefined) updateData.stationCode = data.stationCode;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.isFragile !== undefined) updateData.isFragile = data.isFragile;

  const price = data.price ?? existing.price;
  const deliveryFee = data.deliveryFee ?? existing.deliveryFee;
  updateData.codAmount = price + deliveryFee;

  await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, orderId));

  await db.insert(activityLogs).values({
    id: crypto.randomUUID(),
    storeId,
    actorId: "system",
    actorName: "النظام",
    actorRole: "admin",
    action: "order.updated",
    entityType: "order",
    entityId: orderId,
    entityLabel: existing.orderNumber,
    metadata: JSON.stringify({ changes: Object.keys(updateData) }),
    createdAt: now,
  });

  return await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();
}

export async function updateOrderStatus(
  db: AppDb,
  storeId: string,
  orderId: string,
  newStatus: OrderStatus,
  userId?: string,
  userName?: string,
) {
  const now = new Date().toISOString();

  const order = await db.select({
    id: orders.id,
    status: orders.status,
    price: orders.price,
    customerId: orders.customerId,
    driverId: orders.driverId,
    driverFee: orders.driverFee,
    codAmount: orders.codAmount,
  }).from(orders).where(and(eq(orders.id, orderId), eq(orders.storeId, storeId))).get();

  await db
    .update(orders)
    .set({
      status: newStatus,
      updatedAt: now,
      ...(newStatus === "delivered" ? { deliveryTime: now } : {}),
    })
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));

  await db.insert(orderStatusHistory).values({
    id: crypto.randomUUID(),
    storeId,
    orderId,
    status: newStatus,
    timestamp: now,
    by: userId ?? null,
  });

  if (newStatus === "delivered" && order?.driverId) {
    await db
      .update(drivers)
      .set({
        totalDelivered: sql`${drivers.totalDelivered} + 1`,
        totalEarnings: sql`${drivers.totalEarnings} + ${order.driverFee ?? 0}`,
        pendingCash: sql`${drivers.pendingCash} + ${order.codAmount ?? 0}`,
        updatedAt: now,
      })
      .where(eq(drivers.id, order.driverId));
  }

  const terminalStatuses = ["cancelled", "returned", "fake", "duplicate"];
  const wasAlreadyTerminal = order ? terminalStatuses.includes(order.status) : false;

  if (!wasAlreadyTerminal && (newStatus === "cancelled" || newStatus === "returned")) {
    await db
      .update(customers)
      .set({
        totalSpent: sql`MAX(0, ${customers.totalSpent} - ${order?.price ?? 0})`,
      })
      .where(eq(customers.id, order?.customerId ?? ""));

    const movementType =
      newStatus === "cancelled" ? "ORDER_CANCELLED" : "ORDER_RETURNED";

    const ordProductRows = await db
      .select({
        id: orderProducts.id,
        productId: orderProducts.productId,
        variantId: orderProducts.variantId,
        quantity: orderProducts.quantity,
        returnedQuantity: orderProducts.returnedQuantity,
      })
      .from(orderProducts)
      .where(eq(orderProducts.orderId, orderId))
      .all();

    const cancellableProductIds = ordProductRows.map((r) => r.productId);
    const cancellableVariantIds = ordProductRows.filter((r) => r.variantId).map((r) => r.variantId as string);
    const [cancelTrackMap, cancelVariantInvMap, cancelProductInvMap] = await Promise.all([
      batchFetchTrackInventory(db, cancellableProductIds),
      batchFetchVariantInventory(db, cancellableVariantIds),
      batchFetchProductInventory(db, cancellableProductIds),
    ]);

    for (const op of ordProductRows) {
      const remaining = op.quantity - (op.returnedQuantity ?? 0);
      if (remaining <= 0) continue;
      if (!cancelTrackMap.get(op.productId)) continue;

      if (op.variantId) {
        const qtyBefore = cancelVariantInvMap.get(op.variantId) ?? 0;
        const qtyAfter = qtyBefore + remaining;

        await db
          .update(productVariants)
          .set({ inventory: qtyAfter, updatedAt: now })
          .where(eq(productVariants.id, op.variantId));

        await db
          .insert(stockMovements)
          .values({
            id: crypto.randomUUID(),
            storeId,
            productId: op.productId,
            variantId: op.variantId,
            type: movementType,
            delta: remaining,
            qtyBefore,
            qtyAfter,
            reason: null,
            reference: orderId,
            createdBy: userId ?? "system",
            createdByName: userName ?? "النظام",
            createdAt: now,
          })
          .catch((err) =>
            console.error("[stock] Failed to log", movementType, "movement:", err),
          );
      } else {
        const qtyBefore = cancelProductInvMap.get(op.productId) ?? 0;
        const qtyAfter = qtyBefore + remaining;

        await db
          .update(products)
          .set({ inventory: qtyAfter, updatedAt: now })
          .where(eq(products.id, op.productId));

        await db
          .insert(stockMovements)
          .values({
            id: crypto.randomUUID(),
            storeId,
            productId: op.productId,
            variantId: null,
            type: movementType,
            delta: remaining,
            qtyBefore,
            qtyAfter,
            reason: null,
            reference: orderId,
            createdBy: userId ?? "system",
            createdByName: userName ?? "النظام",
            createdAt: now,
          })
          .catch((err) =>
            console.error("[stock] Failed to log", movementType, "movement:", err),
          );
      }

      await db
        .update(orderProducts)
        .set({ status: "returned", returnedQuantity: op.quantity })
        .where(eq(orderProducts.id, op.id));
    }
  }

  return true;
}

export async function setOrderProductReturn(
  db: AppDb,
  storeId: string,
  orderId: string,
  productLineId: string,
  newReturnedQty: number,
  userId?: string,
  userName?: string,
): Promise<{
  id: string;
  status: "fulfilled" | "partially_returned" | "returned";
  returnedQuantity: number;
  quantity: number;
}> {
  const now = new Date().toISOString();

  const line = await db
    .select()
    .from(orderProducts)
    .where(and(eq(orderProducts.id, productLineId), eq(orderProducts.orderId, orderId)))
    .get();

  if (!line) {
    throw new Error(`Order line ${productLineId} not found on order ${orderId}`);
  }

  if (newReturnedQty < 0 || newReturnedQty > line.quantity) {
    throw new Error(
      `returnedQuantity must be between 0 and ${line.quantity} (got ${newReturnedQty})`,
    );
  }

  const currentReturned = line.returnedQuantity ?? 0;
  const delta = newReturnedQty - currentReturned;

  if (delta !== 0) {
    const productRow = await db
      .select({ trackInventory: products.trackInventory })
      .from(products)
      .where(eq(products.id, line.productId))
      .get();

    if (productRow?.trackInventory) {
      if (line.variantId) {
        const variantRow = await db
          .select({ inventory: productVariants.inventory })
          .from(productVariants)
          .where(eq(productVariants.id, line.variantId))
          .get();

        const qtyBefore = variantRow?.inventory ?? 0;
        const qtyAfter = Math.max(0, qtyBefore + delta);

        await db
          .update(productVariants)
          .set({ inventory: qtyAfter, updatedAt: now })
          .where(eq(productVariants.id, line.variantId));

        await db
          .insert(stockMovements)
          .values({
            id: crypto.randomUUID(),
            storeId,
            productId: line.productId,
            variantId: line.variantId,
            type: "ORDER_RETURNED",
            delta,
            qtyBefore,
            qtyAfter,
            reason: null,
            reference: orderId,
            createdBy: userId ?? "system",
            createdByName: userName ?? "النظام",
            createdAt: now,
          })
          .catch((err) =>
            console.error("[stock] Failed to log ORDER_RETURNED movement:", err),
          );
      } else {
        const productInventoryRow = await db
          .select({ inventory: products.inventory })
          .from(products)
          .where(eq(products.id, line.productId))
          .get();

        const qtyBefore = productInventoryRow?.inventory ?? 0;
        const qtyAfter = Math.max(0, qtyBefore + delta);

        await db
          .update(products)
          .set({ inventory: qtyAfter, updatedAt: now })
          .where(eq(products.id, line.productId));

        await db
          .insert(stockMovements)
          .values({
            id: crypto.randomUUID(),
            storeId,
            productId: line.productId,
            variantId: null,
            type: "ORDER_RETURNED",
            delta,
            qtyBefore,
            qtyAfter,
            reason: null,
            reference: orderId,
            createdBy: userId ?? "system",
            createdByName: userName ?? "النظام",
            createdAt: now,
          })
          .catch((err) =>
            console.error("[stock] Failed to log ORDER_RETURNED movement:", err),
          );
      }
    }
  }

  const newStatus: "fulfilled" | "partially_returned" | "returned" =
    newReturnedQty === 0
      ? "fulfilled"
      : newReturnedQty === line.quantity
        ? "returned"
        : "partially_returned";

  await db
    .update(orderProducts)
    .set({ status: newStatus, returnedQuantity: newReturnedQty })
    .where(eq(orderProducts.id, productLineId));

  return {
    id: line.id,
    status: newStatus,
    returnedQuantity: newReturnedQty,
    quantity: line.quantity,
  };
}

export async function deleteOrder(db: AppDb, storeId: string, orderId: string) {
  const now = new Date().toISOString();

  const order = await db.select({
    id: orders.id,
    status: orders.status,
    price: orders.price,
    customerId: orders.customerId,
    driverId: orders.driverId,
    driverFee: orders.driverFee,
    codAmount: orders.codAmount,
    deliveryMethod: orders.deliveryMethod,
  }).from(orders).where(and(eq(orders.id, orderId), eq(orders.storeId, storeId))).get();

  const orderProductsList = await db
    .select()
    .from(orderProducts)
    .where(eq(orderProducts.orderId, orderId))
    .all();

  if (order) {
    await db
      .update(customers)
      .set({
        totalOrders: sql`MAX(0, ${customers.totalOrders} - 1)`,
        totalSpent: sql`MAX(0, ${customers.totalSpent} - ${order.price ?? 0})`,
      })
      .where(eq(customers.id, order.customerId));
  }

  const delProductIds = orderProductsList.map((op) => op.productId);
  const delVariantIds = orderProductsList.filter((op) => op.variantId).map((op) => op.variantId as string);
  const [delTrackMap, delVariantInvMap, delProductInvMap] = await Promise.all([
    batchFetchTrackInventory(db, delProductIds),
    batchFetchVariantInventory(db, delVariantIds),
    batchFetchProductInventory(db, delProductIds),
  ]);

  for (const op of orderProductsList) {
    const remaining = op.quantity - (op.returnedQuantity ?? 0);
    if (remaining <= 0) continue;
    if (!delTrackMap.get(op.productId)) continue;

    if (op.variantId) {
      const qtyBefore = delVariantInvMap.get(op.variantId) ?? 0;
      const qtyAfter = qtyBefore + remaining;

      await db
        .update(productVariants)
        .set({ inventory: qtyAfter, updatedAt: now })
        .where(eq(productVariants.id, op.variantId));

      await db
        .insert(stockMovements)
        .values({
          id: crypto.randomUUID(),
          storeId,
          productId: op.productId,
          variantId: op.variantId,
          type: "ORDER_CANCELLED",
          delta: remaining,
          qtyBefore,
          qtyAfter,
          reason: "Order deleted - inventory restored",
          reference: orderId,
          createdBy: "system",
          createdByName: "النظام",
          createdAt: now,
        })
        .catch((err) =>
          console.error("[stock] Failed to log ORDER_CANCELLED movement:", err),
        );
    } else {
      const qtyBefore = delProductInvMap.get(op.productId) ?? 0;
      const qtyAfter = qtyBefore + remaining;

      await db
        .update(products)
        .set({ inventory: qtyAfter, updatedAt: now })
        .where(eq(products.id, op.productId));

      await db
        .insert(stockMovements)
        .values({
          id: crypto.randomUUID(),
          storeId,
          productId: op.productId,
          variantId: null,
          type: "ORDER_CANCELLED",
          delta: remaining,
          qtyBefore,
          qtyAfter,
          reason: "Order deleted - inventory restored",
          reference: orderId,
          createdBy: "system",
          createdByName: "النظام",
          createdAt: now,
        })
        .catch((err) =>
          console.error("[stock] Failed to log ORDER_CANCELLED movement:", err),
        );
    }
  }

  await db.delete(companyShipments).where(eq(companyShipments.orderId, orderId));
  await db.delete(orderProducts).where(eq(orderProducts.orderId, orderId));
  await db.delete(orders).where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));
}

const STATUS_RANK: Record<string, number> = {
  new: 0,
  confirmed: 1,
  unreachable: 2,
  busy: 2,
  postponed: 3,
  shipped: 4,
  delivered: 5,
  returned: 5,
  cancelled: 5,
  fake: 5,
  duplicate: 5,
};

export async function updateOrderStatusWebhook(
  db: AppDb,
  storeId: string,
  orderId: string,
  newStatus: OrderStatus,
  source: string,
): Promise<{ updated: boolean }> {
  const now = new Date().toISOString();

  const order = await db.select({
    id: orders.id,
    status: orders.status,
    price: orders.price,
    customerId: orders.customerId,
    driverId: orders.driverId,
    driverFee: orders.driverFee,
    codAmount: orders.codAmount,
  }).from(orders).where(and(eq(orders.id, orderId), eq(orders.storeId, storeId))).get();

  if (!order) return { updated: false };

  const currentRank = STATUS_RANK[order.status] ?? 0;
  const newRank = STATUS_RANK[newStatus] ?? 0;

  if (newRank <= currentRank) {
    return { updated: false };
  }

  const updateFields: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now,
  };
  if (newStatus === "delivered") {
    updateFields.deliveryTime = now;
  }

  await db.update(orders).set(updateFields).where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));

  await db.insert(orderStatusHistory).values({
    id: crypto.randomUUID(),
    storeId,
    orderId,
    status: newStatus,
    timestamp: now,
    by: source,
  });

  if (newStatus === "delivered" && order.driverId) {
    await db
      .update(drivers)
      .set({
        totalDelivered: sql`${drivers.totalDelivered} + 1`,
        totalEarnings: sql`${drivers.totalEarnings} + ${order.driverFee ?? 0}`,
        pendingCash: sql`${drivers.pendingCash} + ${order.codAmount ?? 0}`,
        updatedAt: now,
      })
      .where(eq(drivers.id, order.driverId));
  }

  if (newStatus === "cancelled" || newStatus === "returned") {
    await db
      .update(customers)
      .set({
        totalSpent: sql`MAX(0, ${customers.totalSpent} - ${order.price ?? 0})`,
      })
      .where(eq(customers.id, order.customerId));

    const movementType =
      newStatus === "cancelled" ? "ORDER_CANCELLED" : "ORDER_RETURNED";

    const ordProductRows = await db
      .select({
        id: orderProducts.id,
        productId: orderProducts.productId,
        variantId: orderProducts.variantId,
        quantity: orderProducts.quantity,
        returnedQuantity: orderProducts.returnedQuantity,
      })
      .from(orderProducts)
      .where(eq(orderProducts.orderId, orderId))
      .all();

    const whProductIds = ordProductRows.map((r) => r.productId);
    const whVariantIds = ordProductRows.filter((r) => r.variantId).map((r) => r.variantId as string);
    const [whTrackMap, whVariantInvMap, whProductInvMap] = await Promise.all([
      batchFetchTrackInventory(db, whProductIds),
      batchFetchVariantInventory(db, whVariantIds),
      batchFetchProductInventory(db, whProductIds),
    ]);

    for (const op of ordProductRows) {
      const remaining = op.quantity - (op.returnedQuantity ?? 0);
      if (remaining <= 0) continue;
      if (!whTrackMap.get(op.productId)) continue;

      if (op.variantId) {
        const qtyBefore = whVariantInvMap.get(op.variantId) ?? 0;
        const qtyAfter = qtyBefore + remaining;

        await db
          .update(productVariants)
          .set({ inventory: qtyAfter, updatedAt: now })
          .where(eq(productVariants.id, op.variantId));

        await db
          .insert(stockMovements)
          .values({
            id: crypto.randomUUID(),
            storeId,
            productId: op.productId,
            variantId: op.variantId,
            type: movementType,
            delta: remaining,
            qtyBefore,
            qtyAfter,
            reason: null,
            reference: orderId,
            createdBy: source,
            createdByName: source,
            createdAt: now,
          })
          .catch((err) =>
            console.error(
              "[webhook][stock] Failed to log",
              movementType,
              "movement:",
              err,
            ),
          );
      } else {
        const qtyBefore = whProductInvMap.get(op.productId) ?? 0;
        const qtyAfter = qtyBefore + remaining;

        await db
          .update(products)
          .set({ inventory: qtyAfter, updatedAt: now })
          .where(eq(products.id, op.productId));

        await db
          .insert(stockMovements)
          .values({
            id: crypto.randomUUID(),
            storeId,
            productId: op.productId,
            variantId: null,
            type: movementType,
            delta: remaining,
            qtyBefore,
            qtyAfter,
            reason: null,
            reference: orderId,
            createdBy: source,
            createdByName: source,
            createdAt: now,
          })
          .catch((err) =>
            console.error(
              "[webhook][stock] Failed to log",
              movementType,
              "movement:",
              err,
            ),
          );
      }

      await db
        .update(orderProducts)
        .set({ status: "returned", returnedQuantity: op.quantity })
        .where(eq(orderProducts.id, op.id));
    }
  }

  return { updated: true };
}

export async function incrementDeliveryAttempts(
  db: AppDb,
  storeId: string,
  orderId: string,
): Promise<void> {
  await db
    .update(orders)
    .set({
      deliveryAttempts: sql`${orders.deliveryAttempts} + 1`,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));
}
