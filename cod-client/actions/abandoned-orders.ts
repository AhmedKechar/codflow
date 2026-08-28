"use server";

/// <reference path="../cloudflare-env.d.ts" />

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { requirePermission, getUserStoreId } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import {
  listAbandonedOrders,
  getAbandonedOrderStats,
  updateAbandonedOrderStatus,
  deleteAbandonedOrder,
  type AbandonedOrderFilters,
} from "@/../cod-shared/queries/abandoned-orders";

export interface AbandonedOrder {
  id: string;
  storeId: string;
  sessionId: string;
  customerName: string;
  phone: string;
  wilayaId: number | null;
  communeId: string | null;
  wilayaName: string | null;
  communeName: string | null;
  productId: string | null;
  productName: string | null;
  variantId: string | null;
  variantLabel: string | null;
  price: number | null;
  deliveryType: "home" | "stop_desk" | null;
  status: "pending" | "abandoned" | "contacted" | "converted";
  convertedOrderId: string | null;
  convertedOrderNumber: string | null;
  recoveryAttempts: number;
  lastRecoveryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AbandonedOrderStats {
  totalAbandoned: number;
  totalConverted: number;
  conversionRate: number;
  estimatedLostRevenue: number;
}

export async function getAbandonedOrders(
  filters: AbandonedOrderFilters = {}
): Promise<{ rows: AbandonedOrder[]; total: number }> {
  await requirePermission(SCOPES.ABANDONED_ORDERS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  return listAbandonedOrders(db, await getUserStoreId(), filters) as Promise<{
    rows: AbandonedOrder[];
    total: number;
  }>;
}

export async function getAbandonedOrderStatsAction(): Promise<AbandonedOrderStats> {
  await requirePermission(SCOPES.ABANDONED_ORDERS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  return getAbandonedOrderStats(db, await getUserStoreId()) as Promise<AbandonedOrderStats>;
}

export async function updateAbandonedOrderStatusAction(
  id: string,
  status: "pending" | "abandoned" | "contacted" | "converted"
): Promise<{ success: boolean; error?: string }> {
  await requirePermission(SCOPES.ABANDONED_ORDERS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  try {
    await updateAbandonedOrderStatus(db, await getUserStoreId(), id, status);
    revalidatePath("/orders/abandoned");
    return { success: true };
  } catch (error) {
    console.error("[Abandoned Orders Action Error]", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteAbandonedOrderAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission(SCOPES.ABANDONED_ORDERS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  try {
    await deleteAbandonedOrder(db, await getUserStoreId(), id);
    revalidatePath("/orders/abandoned");
    return { success: true };
  } catch (error) {
    console.error("[Abandoned Orders Action Error]", error);
    return { success: false, error: "Failed to delete order" };
  }
}
