import type { AppDb } from "../../db/client";
import { orders, drivers, driverCompensations } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export async function assignDriver(db: AppDb, storeId: string, orderId: string, driverId: string) {
  const now = new Date().toISOString();

  const order = await db
    .select({ wilayaId: orders.wilayaId, status: orders.status })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
    .get();

  const driver = await db
    .select({ firstName: drivers.firstName, lastName: drivers.lastName })
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .get();
  const driverFullName = driver ? `${driver.firstName} ${driver.lastName}` : null;

  let driverFee = 0;
  if (order?.wilayaId) {
    const comp = await db
      .select({ feePerDelivery: driverCompensations.feePerDelivery })
      .from(driverCompensations)
      .where(
        and(
          eq(driverCompensations.driverId, driverId),
          eq(driverCompensations.wilayaId, order.wilayaId),
        ),
      )
      .get();

    if (comp) {
      driverFee = comp.feePerDelivery;
    }
  }

  const PRE_DISPATCH_STATUSES = ["new", "confirmed", "unreachable", "busy", "postponed"];

  await db
    .update(orders)
    .set({
      driverId,
      driverFee,
      deliveryMethod: "driver",
      deliveryMethodName: driverFullName,
      ...(order && PRE_DISPATCH_STATUSES.includes(order.status) ? { status: "shipped" as const } : {}),
      updatedAt: now,
    })
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));

  return true;
}

export async function unassignDriver(db: AppDb, storeId: string, orderId: string) {
  const now = new Date().toISOString();

  await db
    .update(orders)
    .set({
      driverId: null,
      driverFee: 0,
      deliveryMethod: "unassigned",
      updatedAt: now,
    })
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));

  return true;
}

export async function assignCompany(db: AppDb, storeId: string, orderId: string, companyId: string) {
  await db
    .update(orders)
    .set({
      companyId,
      deliveryMethod: "company",
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)));
}
