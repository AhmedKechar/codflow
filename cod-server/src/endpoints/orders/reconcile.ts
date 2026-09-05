/**
 * Orders Reconciliation
 *
 * Batch-synchronizes order statuses with carrier APIs.
 * Pulls tracking info for all active dispatched orders and updates
 * local statuses based on the latest carrier events.
 */

import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { eq, and, inArray } from "drizzle-orm";
import { orders as ordersTable } from "@/db/schema";
import { getProvider, isEcotrackCompany } from "@/endpoints/delivery-companies/providers/registry";
import { getDeliveryCompanyRaw } from "@/endpoints/delivery-companies/queries";
import { upsertCarrierTracking } from "../../../../cod-shared/queries/carrier-tracking";
import { mapNoestCarrierStatus, mapNoestEventKey, shouldAutoUpdateNoestStatus } from "../webhooks/noest-status-mapper";
import { mapEcotrackCarrierStatus, mapEcotrackStatus, shouldAutoUpdateEcotrackStatus } from "../webhooks/ecotrack-status-mapper";
import type { OrderStatus } from "../../../../cod-shared/db/schema";

const STATUS_RANK: Record<string, number> = {
  "new": 0, "confirmed": 1, "unreachable": 2, "busy": 2, "postponed": 2,
  "shipped": 3, "delivered": 4, "cancelled": 5, "fake": 5, "duplicate": 5, "returned": 5,
};

interface ReconcileResult {
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus | null;
  updated: boolean;
  error?: string;
}

/**
 * POST /orders/reconcile
 * Batch-reconcile all active dispatched orders with their carrier APIs.
 */
export async function reconcileOrders(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;

  // Find all orders that are dispatched (shipped) with a tracking number and company
  const activeOrders = await db
    .select({
      id: ordersTable.id,
      orderNumber: ordersTable.orderNumber,
      trackingNumber: ordersTable.trackingNumber,
      companyId: ordersTable.companyId,
      status: ordersTable.status,
    })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.storeId, storeId),
        eq(ordersTable.status, "shipped"),
      )
    );

  // Filter to only orders with tracking numbers and companies
  const dispatchableOrders = activeOrders.filter(
    (o) => o.trackingNumber && o.companyId
  );

  if (dispatchableOrders.length === 0) {
    return c.json({
      success: true,
      data: { total: 0, updated: 0, failed: 0, results: [] },
    }, 200);
  }

  // Group orders by company to minimize provider instantiation
  const ordersByCompany = new Map<string, typeof dispatchableOrders>();
  for (const order of dispatchableOrders) {
    const key = order.companyId!;
    if (!ordersByCompany.has(key)) ordersByCompany.set(key, []);
    ordersByCompany.get(key)!.push(order);
  }

  const results: ReconcileResult[] = [];
  let updatedCount = 0;
  let failedCount = 0;

  for (const [companyId, companyOrders] of ordersByCompany) {
    // Get company credentials once per company
    const company = await getDeliveryCompanyRaw(db, storeId, companyId);
    if (!company) {
      for (const order of companyOrders) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber!,
          previousStatus: order.status as OrderStatus,
          newStatus: null,
          updated: false,
          error: "Company not found",
        });
        failedCount++;
      }
      continue;
    }

    let provider;
    try {
      provider = getProvider(company);
    } catch (err) {
      for (const order of companyOrders) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber!,
          previousStatus: order.status as OrderStatus,
          newStatus: null,
          updated: false,
          error: err instanceof Error ? err.message : "Provider not available",
        });
        failedCount++;
      }
      continue;
    }

    if (typeof provider.getTrackingInfo !== "function") {
      for (const order of companyOrders) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber!,
          previousStatus: order.status as OrderStatus,
          newStatus: null,
          updated: false,
          error: `Provider ${company.code} does not support tracking`,
        });
        failedCount++;
      }
      continue;
    }

    // Process each order for this company
    for (const order of companyOrders) {
      try {
        const events = await provider.getTrackingInfo(order.trackingNumber!);

        let latestOrderStatus: OrderStatus | null = null;
        let latestEventKey: string | null = null;

        if (Array.isArray(events) && events.length > 0) {
          const carrierCode = company.code;
          for (const event of events) {
            let carrierStatus: string | null = null;
            let orderStatus: OrderStatus | null = null;
            const eventKey = event.activity;

            if (isEcotrackCompany(carrierCode)) {
              carrierStatus = mapEcotrackCarrierStatus(eventKey);
              orderStatus = mapEcotrackStatus(eventKey);
            } else if (carrierCode === "noest") {
              carrierStatus = mapNoestCarrierStatus(eventKey);
              orderStatus = mapNoestEventKey(eventKey);
            } else if (carrierCode === "yalidine") {
              const status = (eventKey ?? "").toLowerCase();
              if (status.includes("livr")) { carrierStatus = "delivered"; orderStatus = "delivered"; }
              else if (status.includes("retour")) { carrierStatus = "returned"; orderStatus = "returned"; }
              else if (status.includes("livraison")) { carrierStatus = "with_driver"; orderStatus = "shipped"; }
              else if (status.includes("transit")) { carrierStatus = "in_transit"; orderStatus = "shipped"; }
              else if (status.includes("tri") || status.includes("hub")) { carrierStatus = "at_office"; orderStatus = "shipped"; }
              else { carrierStatus = "received"; orderStatus = "confirmed"; }
            } else if (carrierCode === "zr_express") {
              const state = (eventKey ?? "").toLowerCase();
              if (state.includes("deliver")) { carrierStatus = "delivered"; orderStatus = "delivered"; }
              else if (state.includes("return")) { carrierStatus = "returned"; orderStatus = "returned"; }
              else if (state.includes("driver") || state.includes("out")) { carrierStatus = "with_driver"; orderStatus = "shipped"; }
              else if (state.includes("transit") || state.includes("hub")) { carrierStatus = "in_transit"; orderStatus = "shipped"; }
              else { carrierStatus = "received"; orderStatus = "confirmed"; }
            }

            await upsertCarrierTracking(db, {
              orderId: order.id,
              storeId,
              companyId: company.id,
              trackingNumber: order.trackingNumber!,
              status: carrierStatus ?? "received",
              statusRaw: eventKey ?? undefined,
              statusAr: event.description ?? undefined,
              location: undefined,
              eventTime: event.date ?? new Date().toISOString(),
              rawData: JSON.stringify(event),
            });

            if (event.date) {
              latestOrderStatus = orderStatus;
              latestEventKey = eventKey;
            }
          }
        }

        // Apply regression guard and auto-update logic
        if (latestOrderStatus && latestEventKey) {
          const carrierCode = company.code;
          let shouldUpdate = false;

          if (isEcotrackCompany(carrierCode)) {
            shouldUpdate = shouldAutoUpdateEcotrackStatus(latestEventKey);
          } else if (carrierCode === "noest") {
            shouldUpdate = shouldAutoUpdateNoestStatus(latestEventKey);
          } else {
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            const currentRank = STATUS_RANK[order.status] ?? 0;
            const newRank = STATUS_RANK[latestOrderStatus] ?? 0;

            if (newRank >= currentRank && latestOrderStatus !== order.status) {
              await db
                .update(ordersTable)
                .set({ status: latestOrderStatus })
                .where(eq(ordersTable.id, order.id));

              results.push({
                orderId: order.id,
                orderNumber: order.orderNumber,
                trackingNumber: order.trackingNumber!,
                previousStatus: order.status as OrderStatus,
                newStatus: latestOrderStatus,
                updated: true,
              });
              updatedCount++;
              continue;
            }
          }
        }

        // No status change needed
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber!,
          previousStatus: order.status as OrderStatus,
          newStatus: null,
          updated: false,
        });
      } catch (err) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber!,
          previousStatus: order.status as OrderStatus,
          newStatus: null,
          updated: false,
          error: err instanceof Error ? err.message : "Tracking fetch failed",
        });
        failedCount++;
      }
    }
  }

  console.info(`[reconcile] store=${storeId} total=${dispatchableOrders.length} updated=${updatedCount} failed=${failedCount}`);

  return c.json({
    success: true,
    data: {
      total: dispatchableOrders.length,
      updated: updatedCount,
      failed: failedCount,
      results,
    },
  }, 200);
}
