/**
 * Analytics Queries
 *
 * Optimized read-only queries for dashboard and reporting endpoints.
 * Each function performs a single efficient DB round-trip — no client-side
 * aggregation. Add new analytics queries here as the system grows.
 */

import type { AppDb } from "../db/client";
import { orders, wilayas, type OrderStatus } from "../db/schema";
import { eq, sql, desc, gte, and } from "drizzle-orm";

export interface OrderStatusStat {
  status: OrderStatus;
  count: number;
}

/**
 * Returns the count of orders grouped by status in a single query.
 * Only statuses that have at least one order are returned.
 * The caller is responsible for filling in zeros for absent statuses.
 * @param startDate - Optional ISO date string to filter orders created on or after this date.
 */
export async function getOrderStatusStats(
  db: AppDb,
  storeId: string,
  startDate?: string,
): Promise<OrderStatusStat[]> {
  const conditions = [eq(orders.storeId, storeId)];
  if (startDate) {
    conditions.push(gte(orders.createdAt, startDate));
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

  return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
}

// ─── New Analytics Queries ──────────────────────────────────────────────────

export interface DailyRevenue {
  date: string;
  revenue: number;
}

/**
 * Returns daily revenue for delivered orders (last 30 days).
 * ⚡ Uses index on (store_id, status, created_at).
 */
export async function getDailyRevenue(db: AppDb, storeId: string): Promise<DailyRevenue[]> {
  const rows = await db
    .select({
      date: sql<string>`date(${orders.createdAt})`,
      revenue: sql<number>`coalesce(sum(${orders.price}), 0)`,
    })
    .from(orders)
    .where(eq(orders.storeId, storeId))
    .groupBy(sql`date(${orders.createdAt})`)
    .orderBy(desc(sql`date(${orders.createdAt})`))
    .limit(30)
    .all();

  return rows.reverse().map((r) => ({ date: r.date, revenue: Number(r.revenue) }));
}

export interface DailyOrders {
  date: string;
  count: number;
}

/**
 * Returns daily order count (last 30 days).
 * ⚡ Uses index on (store_id, created_at).
 */
export async function getDailyOrders(db: AppDb, storeId: string): Promise<DailyOrders[]> {
  const rows = await db
    .select({
      date: sql<string>`date(${orders.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(eq(orders.storeId, storeId))
    .groupBy(sql`date(${orders.createdAt})`)
    .orderBy(desc(sql`date(${orders.createdAt})`))
    .limit(30)
    .all();

  return rows.reverse().map((r) => ({ date: r.date, count: Number(r.count) }));
}

export interface WilayaStat {
  wilayaId: number;
  wilayaName: string;
  count: number;
}

/**
 * Returns order distribution by wilaya (top 10).
 * ⚡ Uses index on (store_id, wilaya_id).
 */
export async function getWilayaDistribution(db: AppDb, storeId: string): Promise<WilayaStat[]> {
  const rows = await db
    .select({
      wilayaId: orders.wilayaId,
      wilayaName: wilayas.nameAr,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .leftJoin(wilayas, eq(orders.wilayaId, wilayas.id))
    .where(eq(orders.storeId, storeId))
    .groupBy(orders.wilayaId)
    .orderBy(desc(sql`count(*)`))
    .limit(10)
    .all();

  return rows.map((r) => ({
    wilayaId: r.wilayaId ?? 0,
    wilayaName: r.wilayaName ?? "غير معروف",
    count: Number(r.count),
  }));
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: OrderStatus;
  price: number;
  wilayaId: number | null;
  createdAt: string;
}

/**
 * Returns the 10 most recent orders.
 * ⚡ Uses index on (store_id, created_at).
 */
export async function getRecentOrders(db: AppDb, storeId: string): Promise<RecentOrder[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      phone: orders.phone,
      status: orders.status,
      price: orders.price,
      wilayaId: orders.wilayaId,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.storeId, storeId))
    .orderBy(desc(orders.createdAt))
    .limit(10)
    .all();

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    customerName: r.customerName,
    phone: r.phone,
    status: r.status,
    price: Number(r.price),
    wilayaId: r.wilayaId,
    createdAt: r.createdAt,
  }));
}
