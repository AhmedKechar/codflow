/**
 * Orders Shipment Operations
 * 
 * Handles post-dispatch shipment operations: update, cancel, remarks, tracking, and label retrieval.
 * These operations interact with carrier APIs after initial dispatch.
 */

import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { communes } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as queries from "./queries";
import { clearOrderTracking, syncOrderAfterCarrierUpdate } from "./queries";
import { logActivity, ACTIONS } from "@/lib/activity";
import { getProvider, isEcotrackCompany } from "@/endpoints/delivery-companies/providers/registry";
import { ZrExpressProvider } from "@/endpoints/delivery-companies/providers/zr_express/adapter";
import { getDeliveryCompanyRaw } from "@/endpoints/delivery-companies/queries";
import { setShipmentValidated, getShipmentByOrder, logApiCall } from "@/endpoints/delivery-companies/providers/shipments";
import { NotFoundError, BusinessLogicError, ValidationError, ExternalApiError } from "@/lib/errors/classes";
import { ERROR_CODES } from "../../../../cod-shared/errors/codes";
import { DEFERRED_LABEL_MARKER } from "./dispatch";
import { upsertCarrierTracking } from "../../../../cod-shared/queries/carrier-tracking";
import { mapNoestCarrierStatus, mapNoestEventKey, shouldAutoUpdateNoestStatus } from "../webhooks/noest-status-mapper";
import { mapEcotrackCarrierStatus, mapEcotrackStatus, shouldAutoUpdateEcotrackStatus } from "../webhooks/ecotrack-status-mapper";
import type { OrderStatus } from "../../../../cod-shared/db/schema";
import { sendCarrierTrackingNotification } from "@/services/notifications";

/**
 * PATCH /orders/:id/update-shipment
 * Update an existing shipment at the carrier API (before validation only).
 * Updates customer info / amount at the carrier. Does not change DB order fields.
 * Supported providers: ecotrack (Packers). Others return OPERATION_NOT_SUPPORTED.
 */
export async function updateShipmentInfo(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const orderId = c.req.param("id")!;

  const order = await queries.getOrderById(db, storeId, orderId);
  if (!order) throw new NotFoundError("Order", orderId);

  if (!order.trackingNumber) {
    throw new BusinessLogicError(
      "Order has no tracking number — dispatch it first",
      ERROR_CODES.REQUIRED_FIELD_MISSING,
      { orderId }
    );
  }

  if (!order.companyId) throw new ValidationError("Order has no delivery company assigned", ERROR_CODES.REQUIRED_FIELD_MISSING);

  const company = await getDeliveryCompanyRaw(db, storeId, order.companyId);
  if (!company) throw new NotFoundError("Delivery company", order.companyId);

  let provider;
  try {
    provider = getProvider(company);
  } catch (err) {
    throw new BusinessLogicError(err instanceof Error ? err.message : "Provider not available", ERROR_CODES.PROVIDER_NOT_SUPPORTED, { companyId: order.companyId });
  }

  if (typeof provider.updateShipment !== "function") {
    throw new BusinessLogicError(
      `The ${company.code} provider does not support updating shipments`,
      ERROR_CODES.OPERATION_NOT_SUPPORTED,
      { provider: company.code }
    );
  }

  // EcoTrack platform (all company codes — ecotrack, packers_ecotrack, etc.) silently returns
  // success=true on validated orders but does NOT apply changes. Tested 2026-04-18 on Packers:
  // update after valid/order → success=true but recipientName unchanged.
  // Guard: only allow update while status is "shipped" (= created but not yet validated).
  // This prevents DB desync where our DB would reflect new values but EcoTrack still has old ones.
  if (isEcotrackCompany(company.code) && order.status !== "shipped") {
    throw new BusinessLogicError(
      `EcoTrack orders can only be updated before validation. This order is already validated (status: ${order.status}).`,
      ERROR_CODES.OPERATION_NOT_SUPPORTED,
      { orderId, status: order.status }
    );
  }

  // Resolve French commune name — required by Packers on every update call.
  const communeRow = order.communeId
    ? await db.select({ name: communes.name }).from(communes).where(eq(communes.id, order.communeId)).get()
    : null;

  const bodyData: any = (c.req as any).valid?.("json");
  const body = bodyData ?? (await c.req.json().catch(() => ({})) as Record<string, unknown>);

  // Packers requires ALL of these fields on every update call — even if only one field changes.
  // We pre-fill from the order record and let the body override individual fields.
  const input = {
    customerName: (body.customerName as string | undefined) ?? order.customerName,
    phone:        (body.phone        as string | undefined) ?? order.phone,
    phone2:       (body.phone2       as string | undefined) ?? undefined,
    address:      (body.address      as string | undefined) ?? order.address ?? "",
    commune:      (body.commune      as string | undefined) ?? communeRow?.name ?? "",
    wilayaId:     body.wilayaId != null ? Number(body.wilayaId) : (order.wilayaId ?? undefined),
    amount:       body.amount   != null ? Number(body.amount)   : (order.price ?? undefined),
    remarks:      body.remarks  as string | undefined,
    fragile:      body.fragile  != null ? Boolean(body.fragile) : undefined,
    weight:       body.weight   != null ? Number(body.weight)   : undefined,
  };

  // ZR Express addresses parcels by UUID, not by tracking number.
  // The UUID was captured in companyShipments.rawResponse.parcelId at dispatch time.
  let identifier = order.trackingNumber;
  if (company.code === "zr_express") {
    const shipment = await getShipmentByOrder(db, orderId);
    let parcelId: string | undefined;
    if (shipment?.rawResponse) {
      try {
        const raw = JSON.parse(shipment.rawResponse) as { parcelId?: string };
        parcelId = raw.parcelId;
      } catch {
        // ignore — parcelId stays undefined
      }
    }
    if (!parcelId) {
      throw new BusinessLogicError(
        "ZR Express: parcelId not available for this order. Re-dispatch may be required.",
        ERROR_CODES.OPERATION_NOT_SUPPORTED,
        { orderId, trackingNumber: order.trackingNumber }
      );
    }
    identifier = parcelId;
  }

  const startMs = Date.now();
  try {
    await provider.updateShipment(identifier, input);
    const durationMs = Date.now() - startMs;

    // Sync changed fields back to our DB so the order record stays in sync with the carrier.
    await syncOrderAfterCarrierUpdate(db, storeId, orderId, {
      customerName: input.customerName !== order.customerName ? input.customerName : undefined,
      phone:        input.phone        !== order.phone        ? input.phone        : undefined,
      price:        input.amount       !== order.price        ? input.amount       : undefined,
    });

    await logApiCall(db, {
      companyId: company.id,
      orderId,
      action: "update_shipment",
      method: "POST",
      endpoint: `/api/v1/update/order`,
      httpStatus: 200,
      requestBody: input,
      success: true,
      durationMs,
    });

    const actor = c.get("user");
    console.info(`[shipment] updated order=${orderId} tracking=${order.trackingNumber} via ${company.code}`);
    await logActivity(db, actor, ACTIONS.ORDER_STATUS_CHANGED, {
      type: "order", id: orderId, label: order.orderNumber,
    }, { action: "update_shipment", trackingNumber: order.trackingNumber });

    return c.json({ success: true, message: "Shipment updated successfully" }, 200);
  } catch (err) {
    const durationMs = Date.now() - startMs;
    const errorMessage = err instanceof Error ? err.message : String(err);
    await logApiCall(db, {
      companyId: company.id,
      orderId,
      action: "update_shipment",
      method: "POST",
      endpoint: `/api/v1/update/order`,
      success: false,
      errorMessage,
      durationMs,
    });
    throw new ExternalApiError(company.code, errorMessage, { orderId });
  }
}

/**
 * POST /orders/:id/cancel-shipment
 * Delete/cancel a shipment at the carrier API (before validation only).
 * On success: clears trackingNumber from order, resets status to "confirmed".
 * Supported providers: ecotrack (Packers). Others return OPERATION_NOT_SUPPORTED.
 *
 * Uses POST (not DELETE) to avoid routing ambiguity with DELETE /orders/:id.
 */
export async function cancelShipment(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const orderId = c.req.param("id")!;

  const order = await queries.getOrderById(db, storeId, orderId);
  if (!order) throw new NotFoundError("Order", orderId);

  if (!order.trackingNumber) {
    throw new BusinessLogicError(
      "Order has no tracking number — nothing to cancel at the carrier",
      ERROR_CODES.REQUIRED_FIELD_MISSING,
      { orderId }
    );
  }

  if (!order.companyId) throw new ValidationError("Order has no delivery company assigned", ERROR_CODES.REQUIRED_FIELD_MISSING);

  const company = await getDeliveryCompanyRaw(db, storeId, order.companyId);
  if (!company) throw new NotFoundError("Delivery company", order.companyId);

  let provider;
  try {
    provider = getProvider(company);
  } catch (err) {
    throw new BusinessLogicError(err instanceof Error ? err.message : "Provider not available", ERROR_CODES.PROVIDER_NOT_SUPPORTED, { companyId: order.companyId });
  }

  if (typeof provider.deleteShipment !== "function") {
    throw new BusinessLogicError(
      `The ${company.code} provider does not support cancelling shipments`,
      ERROR_CODES.OPERATION_NOT_SUPPORTED,
      { provider: company.code }
    );
  }

  const startMs = Date.now();
  try {
    await provider.deleteShipment(order.trackingNumber);
    const durationMs = Date.now() - startMs;

    await logApiCall(db, {
      companyId: company.id,
      orderId,
      action: "cancel_shipment",
      method: "DELETE",
      endpoint: `/api/v1/delete/order`,
      httpStatus: 200,
      success: true,
      durationMs,
    });

    // Clear tracking from order and reset to "confirmed" so it can be re-dispatched.
    // The old shipment row loses its validated flag; orders.status carries the cancel state.
    const shipment = await getShipmentByOrder(db, orderId);
    if (shipment) await setShipmentValidated(db, shipment.id, false);

    await clearOrderTracking(db, storeId, orderId);

    const actor = c.get("user");
    const PRE_DISPATCH_STATUSES = ["new", "confirmed", "unreachable", "busy", "postponed"];
    if (PRE_DISPATCH_STATUSES.includes(order.status)) {
      await queries.updateOrderStatus(db, storeId, orderId, "confirmed", actor?.id, actor?.name ?? undefined);
    }

    await logActivity(db, actor, ACTIONS.ORDER_STATUS_CHANGED, {
      type: "order", id: orderId, label: order.orderNumber,
    }, { action: "cancel_shipment", trackingNumber: order.trackingNumber });

    console.info(`[shipment] cancelled order=${orderId} tracking=${order.trackingNumber} via ${company.code}`);
    return c.json({ success: true, message: "Shipment cancelled — order reset to confirmed" }, 200);
  } catch (err) {
    const durationMs = Date.now() - startMs;
    const errorMessage = err instanceof Error ? err.message : String(err);
    await logApiCall(db, {
      companyId: company.id,
      orderId,
      action: "cancel_shipment",
      method: "DELETE",
      endpoint: `/api/v1/delete/order`,
      success: false,
      errorMessage,
      durationMs,
    });
    throw new ExternalApiError(company.code, errorMessage, { orderId });
  }
}

/**
 * POST /orders/:id/add-remark
 * Add a remark/note to the shipment at the carrier API.
 * Works at any time after dispatch. Visible to carrier and sender.
 * Supported providers: ecotrack (Packers). Others return OPERATION_NOT_SUPPORTED.
 */
export async function addShipmentRemark(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const orderId = c.req.param("id")!;

  const order = await queries.getOrderById(db, storeId, orderId);
  if (!order) throw new NotFoundError("Order", orderId);

  if (!order.trackingNumber) {
    throw new BusinessLogicError("Order has no tracking number", ERROR_CODES.REQUIRED_FIELD_MISSING, { orderId });
  }

  if (!order.companyId) throw new ValidationError("Order has no delivery company assigned", ERROR_CODES.REQUIRED_FIELD_MISSING);

  const company = await getDeliveryCompanyRaw(db, storeId, order.companyId);
  if (!company) throw new NotFoundError("Delivery company", order.companyId);

  let provider;
  try {
    provider = getProvider(company);
  } catch (err) {
    throw new BusinessLogicError(err instanceof Error ? err.message : "Provider not available", ERROR_CODES.PROVIDER_NOT_SUPPORTED, { companyId: order.companyId });
  }

  if (typeof provider.addRemark !== "function") {
    throw new BusinessLogicError(
      `The ${company.code} provider does not support adding remarks`,
      ERROR_CODES.OPERATION_NOT_SUPPORTED,
      { provider: company.code }
    );
  }

  const bodyData: any = (c.req as any).valid?.("json");
  const body = bodyData ?? (await c.req.json().catch(() => ({})) as { content?: string });
  if (!body.content?.trim()) {
    throw new ValidationError("Remark content is required", ERROR_CODES.REQUIRED_FIELD_MISSING);
  }

  const startMs = Date.now();
  try {
    await provider.addRemark(order.trackingNumber, body.content.trim());
    const durationMs = Date.now() - startMs;

    await logApiCall(db, {
      companyId: company.id,
      orderId,
      action: "add_remark",
      method: "POST",
      endpoint: `/api/v1/add/maj`,
      httpStatus: 200,
      requestBody: { content: body.content.trim() },
      success: true,
      durationMs,
    });

    return c.json({ success: true, message: "Remark added" }, 200);
  } catch (err) {
    const durationMs = Date.now() - startMs;
    const errorMessage = err instanceof Error ? err.message : String(err);
    await logApiCall(db, {
      companyId: company.id,
      orderId,
      action: "add_remark",
      method: "POST",
      endpoint: `/api/v1/add/maj`,
      success: false,
      errorMessage,
      durationMs,
    });
    throw new ExternalApiError(company.code, errorMessage, { orderId });
  }
}

/**
 * GET /orders/:id/remarks
 * Fetch the list of remarks/notes for a shipment from the carrier API.
 * Returns entries from both sender and courier.
 * Supported providers: ecotrack (Packers). Others return OPERATION_NOT_SUPPORTED.
 */
export async function getShipmentRemarks(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const orderId = c.req.param("id")!;

  const order = await queries.getOrderById(db, storeId, orderId);
  if (!order) throw new NotFoundError("Order", orderId);

  if (!order.trackingNumber) {
    throw new BusinessLogicError("Order has no tracking number", ERROR_CODES.REQUIRED_FIELD_MISSING, { orderId });
  }

  if (!order.companyId) throw new ValidationError("Order has no delivery company assigned", ERROR_CODES.REQUIRED_FIELD_MISSING);

  const company = await getDeliveryCompanyRaw(db, storeId, order.companyId);
  if (!company) throw new NotFoundError("Delivery company", order.companyId);

  let provider;
  try {
    provider = getProvider(company);
  } catch (err) {
    throw new BusinessLogicError(err instanceof Error ? err.message : "Provider not available", ERROR_CODES.PROVIDER_NOT_SUPPORTED, { companyId: order.companyId });
  }

  if (typeof provider.getRemarks !== "function") {
    throw new BusinessLogicError(
      `The ${company.code} provider does not support fetching remarks`,
      ERROR_CODES.OPERATION_NOT_SUPPORTED,
      { provider: company.code }
    );
  }

  const remarks = await provider.getRemarks(order.trackingNumber);
  return c.json({ success: true, data: remarks }, 200);
}

/**
 * GET /orders/:id/tracking-events
 * Fetch the full tracking history for a shipment from the carrier API.
 * Returns chronological events (pickup, hub reception, delivery attempts, etc.).
 * Supported providers: all (ecotrack, noest, zr_express, yalidine).
 */
export async function getShipmentTracking(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const orderId = c.req.param("id")!;

  const order = await queries.getOrderById(db, storeId, orderId);
  if (!order) throw new NotFoundError("Order", orderId);

  if (!order.trackingNumber) {
    throw new BusinessLogicError("Order has no tracking number", ERROR_CODES.REQUIRED_FIELD_MISSING, { orderId });
  }

  if (!order.companyId) throw new ValidationError("Order has no delivery company assigned", ERROR_CODES.REQUIRED_FIELD_MISSING);

  const company = await getDeliveryCompanyRaw(db, storeId, order.companyId);
  if (!company) throw new NotFoundError("Delivery company", order.companyId);

  let provider;
  try {
    provider = getProvider(company);
  } catch (err) {
    throw new BusinessLogicError(err instanceof Error ? err.message : "Provider not available", ERROR_CODES.PROVIDER_NOT_SUPPORTED, { companyId: order.companyId });
  }

  if (typeof provider.getTrackingInfo !== "function") {
    throw new BusinessLogicError(
      `The ${company.code} provider does not support live tracking`,
      ERROR_CODES.OPERATION_NOT_SUPPORTED,
      { provider: company.code }
    );
  }

  const events = await provider.getTrackingInfo(order.trackingNumber);

  // Save tracking events to carrier_tracking table
  let latestCarrierStatus: string | null = null;
  let latestOrderStatus: OrderStatus | null = null;
  let latestEventKey: string | null = null;

  if (Array.isArray(events) && events.length > 0) {
    const carrierCode = company.code;
    for (const event of events) {
      // Map carrier status to our 6-status model based on carrier type
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
        // Yalidine uses French status strings — map to carrier status
        const status = (eventKey ?? "").toLowerCase();
        if (status.includes("livr")) { carrierStatus = "delivered"; orderStatus = "delivered"; }
        else if (status.includes("retour")) { carrierStatus = "returned"; orderStatus = "returned"; }
        else if (status.includes("livraison")) { carrierStatus = "with_driver"; orderStatus = "shipped"; }
        else if (status.includes("transit")) { carrierStatus = "in_transit"; orderStatus = "shipped"; }
        else if (status.includes("tri") || status.includes("hub")) { carrierStatus = "at_office"; orderStatus = "shipped"; }
        else { carrierStatus = "received"; orderStatus = "confirmed"; }
      } else if (carrierCode === "zr_express") {
        // ZR Express uses state names
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
        trackingNumber: order.trackingNumber,
        status: carrierStatus ?? "received",
        statusRaw: eventKey ?? undefined,
        statusAr: event.description ?? undefined,
        location: undefined,
        eventTime: event.date ?? new Date().toISOString(),
        rawData: JSON.stringify(event),
      });

      // Track the latest event for potential auto-update
      if (event.date) {
        latestCarrierStatus = carrierStatus;
        latestOrderStatus = orderStatus;
        latestEventKey = eventKey;
      }
    }
  }

  // Auto-update order status from pull tracking (with regression guard)
  if (latestOrderStatus && latestEventKey) {
    const carrierCode = company.code;
    let shouldUpdate = false;

    if (isEcotrackCompany(carrierCode)) {
      shouldUpdate = shouldAutoUpdateEcotrackStatus(latestEventKey);
    } else if (carrierCode === "noest") {
      shouldUpdate = shouldAutoUpdateNoestStatus(latestEventKey);
    } else {
      // For Yalidine/ZR, always update (they have webhooks for most updates)
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      // Regression guard: only update if new status is "ahead" of current
      const STATUS_RANK: Record<string, number> = {
        "new": 0, "confirmed": 1, "unreachable": 2, "busy": 2, "postponed": 2,
        "shipped": 3, "delivered": 4, "cancelled": 5, "fake": 5, "duplicate": 5, "returned": 5,
      };
      const currentRank = STATUS_RANK[order.status] ?? 0;
      const newRank = STATUS_RANK[latestOrderStatus] ?? 0;

      // Allow update if new status is higher rank, or same rank (for idempotency)
      // But never go backward (e.g., delivered → shipped)
      if (newRank >= currentRank && latestOrderStatus !== order.status) {
        const dispatchUser = c.get("user");
        await queries.updateOrderStatus(db, storeId, order.id, latestOrderStatus, dispatchUser?.id, dispatchUser?.name ?? undefined);
        await logActivity(db, dispatchUser, ACTIONS.ORDER_STATUS_CHANGED, {
          type: "order", id: order.id, label: order.orderNumber,
        }, { from: order.status, to: latestOrderStatus, source: "pull_tracking" });
      }
    }
  }

  // Send carrier tracking notification to merchant (fire-and-forget)
  if (latestCarrierStatus) {
    void sendCarrierTrackingNotification(db, order.id, latestCarrierStatus, storeId).catch((err) =>
      console.warn("[shipment-operations] Failed to send carrier tracking notification:", err)
    );
  }

  return c.json({ success: true, data: events }, 200);
}

/**
 * GET /orders/:id/label
 * Proxy the shipment label PDF from the carrier API.
 *
 * EcoTrack label URLs require a Bearer token — they are not publicly accessible.
 * This endpoint fetches the PDF server-side and streams it to the client so the
 * browser never needs to hold the API token.
 *
 * Returns: application/pdf with Content-Disposition: inline (opens in browser tab)
 */
export async function proxyShipmentLabel(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const orderId = c.req.param("id")!;

  const order = await queries.getOrderById(db, storeId, orderId);
  if (!order) throw new NotFoundError("Order", orderId);

  if (!order.trackingNumber) {
    throw new BusinessLogicError("Order has no tracking number", ERROR_CODES.REQUIRED_FIELD_MISSING, { orderId });
  }

  if (!order.companyId) throw new ValidationError("Order has no delivery company assigned", ERROR_CODES.REQUIRED_FIELD_MISSING);

  const company = await getDeliveryCompanyRaw(db, storeId, order.companyId);
  if (!company) throw new NotFoundError("Delivery company", order.companyId);

  if (!company.apiToken) {
    throw new BusinessLogicError("Delivery company has no API token configured", ERROR_CODES.MISSING_API_CREDENTIALS, { companyId: order.companyId });
  }

  // ZR Express: label URLs are time-limited SAS tokens generated on demand by
  // POST /parcels/labels/individual/pdf. The stored labelUrl is the DEFERRED_LABEL_MARKER
  // sentinel (just signaling availability to the UI), so always re-resolve here.
  if (company.code === "zr_express") {
    const provider = getProvider(company);
    if (!(provider instanceof ZrExpressProvider)) {
      throw new BusinessLogicError("Provider mismatch for zr_express", ERROR_CODES.PROVIDER_NOT_SUPPORTED, { companyId: order.companyId });
    }
    const sasUrl = await provider.getLabelUrl(order.trackingNumber);
    if (!sasUrl) {
      throw new ExternalApiError(company.code, "Label not yet available from carrier", { orderId, trackingNumber: order.trackingNumber });
    }
    try {
      // SAS URLs are pre-signed — no Authorization header.
      const pdfRes = await fetch(sasUrl, { redirect: "follow" });
      if (!pdfRes.ok) {
        throw new Error(`Carrier returned HTTP ${pdfRes.status}`);
      }
      return new Response(pdfRes.body, {
        status: 200,
        headers: {
          "Content-Type": pdfRes.headers.get("Content-Type") ?? "application/pdf",
          "Content-Disposition": `inline; filename="label-${order.trackingNumber}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ExternalApiError(company.code, `Failed to fetch label: ${msg}`, { orderId, trackingNumber: order.trackingNumber });
    }
  }

  // Other providers (ecotrack, noest, yalidine): label URL points at the carrier
  // and requires the bearer token. Use the stored labelUrl if it matches the
  // current tracking number (guards against stale records from re-dispatches).
  const shipment = await getShipmentByOrder(db, orderId);
  const labelUrl = (shipment?.trackingNumber === order.trackingNumber && shipment?.labelUrl && shipment.labelUrl !== DEFERRED_LABEL_MARKER)
    ? shipment.labelUrl
    : `${company.apiEndpoint}/api/v1/get/order/label?tracking=${encodeURIComponent(order.trackingNumber)}`;

  try {
    const pdfRes = await fetch(labelUrl, {
      headers: { Authorization: `Bearer ${company.apiToken}` },
      redirect: "follow",
    });

    if (!pdfRes.ok) {
      throw new Error(`Carrier returned HTTP ${pdfRes.status}`);
    }

    return new Response(pdfRes.body, {
      status: 200,
      headers: {
        "Content-Type": pdfRes.headers.get("Content-Type") ?? "application/pdf",
        "Content-Disposition": `inline; filename="label-${order.trackingNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ExternalApiError(company.code, `Failed to fetch label: ${msg}`, { orderId, trackingNumber: order.trackingNumber });
  }
}
