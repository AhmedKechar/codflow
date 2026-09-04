"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { requirePermission, getUserStoreId } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import {
  getOrderStatusStats,
  getDailyRevenue,
  getDailyOrders,
  getWilayaDistribution,
  getRecentOrders,
  type OrderStatusStat,
  type DailyRevenue,
  type DailyOrders,
  type WilayaStat,
  type RecentOrder,
} from "@/../cod-shared/queries/analytics";

export async function getDashboardStats(): Promise<OrderStatusStat[]> {
  await requirePermission(SCOPES.DASHBOARD_VIEW);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  // Today from 00:00:00.000
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getOrderStatusStats(db, storeId, today.toISOString());
}

export async function getDashboardRevenue(): Promise<DailyRevenue[]> {
  await requirePermission(SCOPES.DASHBOARD_VIEW);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  return getDailyRevenue(db, storeId);
}

export async function getDashboardDailyOrders(): Promise<DailyOrders[]> {
  await requirePermission(SCOPES.DASHBOARD_VIEW);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  return getDailyOrders(db, storeId);
}

export async function getDashboardWilayaStats(): Promise<WilayaStat[]> {
  await requirePermission(SCOPES.DASHBOARD_VIEW);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  return getWilayaDistribution(db, storeId);
}

export async function getDashboardRecentOrders(): Promise<RecentOrder[]> {
  await requirePermission(SCOPES.DASHBOARD_VIEW);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  return getRecentOrders(db, storeId);
}
