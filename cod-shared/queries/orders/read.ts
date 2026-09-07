import type { AppDb } from "../../db/client";
import {
  orders,
  orderProducts,
  orderStatusHistory,
  drivers,
  users,
  wilayas,
  communes,
  companyShipments,
} from "../../db/schema";
import {
  eq,
  desc,
  and,
  like,
  or,
  sql,
  aliasedTable,
  gte,
  lte,
  inArray,
} from "drizzle-orm";

const driversAlias = aliasedTable(drivers, "d");

export interface OrderFilters {
  status?: (typeof orders.$inferSelect)["status"] | "all";
  statuses?: (typeof orders.$inferSelect)["status"][];
  wilayaId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export type OrderListItem = {
  id: string;
  storeId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  phone: string;
  wilayaId: number | null;
  communeId: string | null;
  price: number;
  status: (typeof orders.$inferSelect)["status"];
  orderType: string | null;
  deliveryMethod: string | null;
  driverId: string | null;
  companyId: string | null;
  deliveryType: string | null;
  deliveryFee: number | null;
  driverFee: number | null;
  codAmount: number | null;
  trackingNumber: string | null;
  deliveryMethodName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  wilaya: string | null;
  commune: string | null;
  driverName: string | null;
  hasReview: number;
  lastUpdatedBy: string | null;
  firstProductName: string | null;
  firstProductImage: string | null;
};

export interface OrdersResult {
  rows: ReturnType<typeof getAllOrders> extends Promise<infer R> ? R : never;
  total: number;
}

export async function getAllOrders(db: AppDb, storeId: string, filters: OrderFilters = {}): Promise<OrderListItem[]> {
  const conditions = [eq(orders.storeId, storeId)];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(orders.status, filters.status));
  }

  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(orders.status, filters.statuses));
  }

  if (filters.wilayaId) {
    conditions.push(eq(orders.wilayaId, filters.wilayaId));
  }

  if (filters.search) {
    const search = filters.search.trim();
    if (search.startsWith("ORD-") || /^\d{8}-\d{4}$/.test(search)) {
      conditions.push(like(orders.orderNumber, `${search}%`));
    } else {
      const searchConditions = or(
        like(orders.customerName, `%${search}%`),
        like(orders.phone, `%${search}%`),
      );
      if (searchConditions) conditions.push(searchConditions);
    }
  }

  if (filters.startDate) {
    conditions.push(gte(orders.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(orders.createdAt, end.toISOString()));
  }

  const rows = await db
    .select({
      id: orders.id,
      storeId: orders.storeId,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: orders.customerName,
      phone: orders.phone,
      wilayaId: orders.wilayaId,
      communeId: orders.communeId,
      price: orders.price,
      status: orders.status,
      orderType: orders.orderType,
      deliveryMethod: orders.deliveryMethod,
      driverId: orders.driverId,
      companyId: orders.companyId,
      deliveryType: orders.deliveryType,
      deliveryFee: orders.deliveryFee,
      driverFee: orders.driverFee,
      codAmount: orders.codAmount,
      trackingNumber: orders.trackingNumber,
      deliveryMethodName: orders.deliveryMethodName,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      wilaya: wilayas.nameAr,
      commune: communes.nameAr,
      driverName: sql<
        string | null
      >`CASE WHEN ${driversAlias.firstName} IS NOT NULL THEN ${driversAlias.firstName} || ' ' || ${driversAlias.lastName} ELSE NULL END`,
    })
    .from(orders)
    .leftJoin(wilayas, eq(orders.wilayaId, wilayas.id))
    .leftJoin(communes, eq(orders.communeId, communes.id))
    .leftJoin(driversAlias, eq(orders.driverId, driversAlias.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0)
    .all();

  if (rows.length === 0) return rows as OrderListItem[];

  const orderIds = rows.map((r) => r.id);

  const [reviewCounts, lastStatuses, firstProducts, firstImages] =
    await Promise.all([
      db
        .select({
          orderId: sql<string>`order_id`,
          cnt: sql<number>`count(*)`,
        })
        .from(sql`reviews`)
        .where(sql`order_id IN (${sql.join(orderIds.map((id) => sql`${id}`), sql`,`)})`)
        .groupBy(sql`order_id`)
        .all(),
      db
        .select({
          orderId: orderStatusHistory.orderId,
          by: orderStatusHistory.by,
        })
        .from(orderStatusHistory)
        .where(inArray(orderStatusHistory.orderId, orderIds))
        .orderBy(desc(orderStatusHistory.timestamp))
        .all(),
      db
        .select({
          orderId: orderProducts.orderId,
          productName: orderProducts.productName,
        })
        .from(orderProducts)
        .where(inArray(orderProducts.orderId, orderIds))
        .orderBy(orderProducts.createdAt)
        .all(),
      db
        .select({
          orderId: sql<string>`op.order_id`,
          src: sql<string | null>`pi.src`,
        })
        .from(sql`order_products op`)
        .innerJoin(sql`product_images pi`, sql`pi.product_id = op.product_id`)
        .where(sql`op.order_id IN (${sql.join(orderIds.map((id) => sql`${id}`), sql`,`)})`)
        .orderBy(sql`op.created_at, pi.position`)
        .all(),
    ]);

  const reviewCountMap = new Map(reviewCounts.map((r) => [r.orderId, r.cnt]));
  const lastStatusMap = new Map(
    lastStatuses.map((s) => [s.orderId, s.by]),
  );
  const firstProductMap = new Map(
    firstProducts.map((p) => [p.orderId, p.productName]),
  );
  const firstImageMap = new Map(firstImages.map((i) => [i.orderId, i.src]));

  for (const row of rows) {
    (row as OrderListItem).hasReview = reviewCountMap.get(row.id) ?? 0;
    (row as OrderListItem).lastUpdatedBy = lastStatusMap.get(row.id) ?? null;
    (row as OrderListItem).firstProductName = firstProductMap.get(row.id) ?? null;
    (row as OrderListItem).firstProductImage = firstImageMap.get(row.id) ?? null;
  }

  return rows as OrderListItem[];
}

export async function getOrdersCount(
  db: AppDb,
  storeId: string,
  filters: Pick<OrderFilters, "status" | "statuses" | "wilayaId" | "search" | "startDate" | "endDate">
): Promise<number> {
  const conditions = [eq(orders.storeId, storeId)];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(orders.status, filters.status));
  }

  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(orders.status, filters.statuses));
  }

  if (filters.wilayaId) {
    conditions.push(eq(orders.wilayaId, filters.wilayaId));
  }

  if (filters.search) {
    const search = filters.search.trim();
    if (search.startsWith("ORD-") || /^\d{8}-\d{4}$/.test(search)) {
      conditions.push(like(orders.orderNumber, `${search}%`));
    } else {
      const searchConditions = or(
        like(orders.customerName, `%${search}%`),
        like(orders.phone, `%${search}%`),
      );
      if (searchConditions) conditions.push(searchConditions);
    }
  }

  if (filters.startDate) {
    conditions.push(gte(orders.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(orders.createdAt, end.toISOString()));
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(...conditions))
    .get();

  return result?.count ?? 0;
}

export async function getOrderStatusCounts(
  db: AppDb,
  storeId: string,
  filters: Pick<OrderFilters, "wilayaId" | "search" | "startDate" | "endDate">
): Promise<Record<string, number>> {
  const conditions = [eq(orders.storeId, storeId)];

  if (filters.wilayaId) {
    conditions.push(eq(orders.wilayaId, filters.wilayaId));
  }

  if (filters.search) {
    const search = filters.search.trim();
    if (search.startsWith("ORD-") || /^\d{8}-\d{4}$/.test(search)) {
      conditions.push(like(orders.orderNumber, `${search}%`));
    } else {
      const searchConditions = or(
        like(orders.customerName, `%${search}%`),
        like(orders.phone, `%${search}%`),
      );
      if (searchConditions) conditions.push(searchConditions);
    }
  }

  if (filters.startDate) {
    conditions.push(gte(orders.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(orders.createdAt, end.toISOString()));
  }

  const rows = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(and(...conditions))
    .groupBy(orders.status)
    .all();

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status] = Number(row.count);
  }
  return counts;
}

export async function getOrdersPaginated(
  db: AppDb,
  storeId: string,
  filters: OrderFilters = {}
): Promise<OrdersResult> {
  const [rows, total] = await Promise.all([
    getAllOrders(db, storeId, filters),
    getOrdersCount(db, storeId, filters),
  ]);
  return { rows, total };
}

export async function getOrderById(db: AppDb, storeId: string, orderId: string) {
  const orderRow = await db
    .select({
      id: orders.id,
      storeId: orders.storeId,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: orders.customerName,
      phone: orders.phone,
      wilayaId: orders.wilayaId,
      communeId: orders.communeId,
      address: orders.address,
      price: orders.price,
      status: orders.status,
      orderType: orders.orderType,
      deliveryMethod: orders.deliveryMethod,
      driverId: orders.driverId,
      companyId: orders.companyId,
      deliveryType: orders.deliveryType,
      deliveryFee: orders.deliveryFee,
      driverFee: orders.driverFee,
      codAmount: orders.codAmount,
      trackingNumber: orders.trackingNumber,
      deliveryMethodName: orders.deliveryMethodName,
      notes: orders.notes,
      weight: orders.weight,
      isFragile: orders.isFragile,
      stationCode: orders.stationCode,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      wilaya: wilayas.nameAr,
      commune: communes.nameAr,
      driverName: sql<string | null>`CASE WHEN ${drivers.firstName} IS NOT NULL THEN ${drivers.firstName} || ' ' || ${drivers.lastName} ELSE NULL END`,
    })
    .from(orders)
    .leftJoin(wilayas, eq(orders.wilayaId, wilayas.id))
    .leftJoin(communes, eq(orders.communeId, communes.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
    .get();

  if (!orderRow) return null;

  const [orderProductsList, historyRows, shipmentRow] = await Promise.all([
    db.select().from(orderProducts).where(eq(orderProducts.orderId, orderId)).all(),
    db
      .select({
        id: orderStatusHistory.id,
        orderId: orderStatusHistory.orderId,
        status: orderStatusHistory.status,
        timestamp: orderStatusHistory.timestamp,
        by: orderStatusHistory.by,
        byName: users.name,
      })
      .from(orderStatusHistory)
      .leftJoin(users, eq(orderStatusHistory.by, users.id))
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.timestamp))
      .all(),
    db
      .select({ labelUrl: companyShipments.labelUrl })
      .from(companyShipments)
      .where(eq(companyShipments.orderId, orderId))
      .get(),
  ]);

  return {
    ...orderRow,
    labelUrl: shipmentRow?.labelUrl ?? null,
    products: orderProductsList,
    statusHistory: historyRows.map((h) => ({
      id: h.id,
      orderId: h.orderId,
      status: h.status,
      timestamp: h.timestamp,
      by: h.by,
      byName: h.byName ?? null,
    })),
  };
}
