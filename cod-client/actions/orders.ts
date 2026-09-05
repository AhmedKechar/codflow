"use server";

/**
 * Server Actions for Orders API
 * 
 * These actions securely call the Cloudflare Workers API using the user's stored API key.
 * All actions include proper error handling and type safety.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getDb } from "@/db";
import { getUserApiKey, requirePermission, getUserStoreId } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { getAllOrders, getOrdersPaginated as getOrdersPaginatedQuery, getOrderById, getOrderStatusCounts as getOrderStatusCountsQuery, type OrderFilters } from "@/../cod-shared/queries/orders";
import { mapError } from "@/lib/errors/mapper";
import { getLocale, type Locale } from "@/lib/locale";
import type { Order, OrderStatus } from "@/types/order.types";

// Translated status labels used in transition error messages
const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    new: "New", confirmed: "Confirmed", unreachable: "Unreachable",
    busy: "Busy", postponed: "Postponed", shipped: "Shipped",
    delivered: "Delivered", returned: "Returned", cancelled: "Cancelled",
    fake: "Fake", duplicate: "Duplicate",
  },
  ar: {
    new: "جديد", confirmed: "تم التأكيد", unreachable: "لا يرد",
    busy: "الخط مشغول", postponed: "مؤجل",     shipped: "قيد التوصيل",
    delivered: "تم التسليم", returned: "مرتجع", cancelled: "ملغي",
    fake: "مزيف", duplicate: "مكرر",
  },
  fr: {
    new: "Nouveau", confirmed: "Confirmé", unreachable: "Injoignable",
    busy: "Occupé", postponed: "Reporté", shipped: "Expédié",
    delivered: "Livré", returned: "Retourné", cancelled: "Annulé",
    fake: "Faux", duplicate: "Doublon",
  },
};

function buildTransitionErrorMessage(
  locale: Locale,
  currentStatus: string,
  targetStatus: string,
  allowedTransitions: string[]
): string {
  const labels = STATUS_LABELS[locale] ?? STATUS_LABELS.en;
  const from = labels[currentStatus] ?? currentStatus;

  // Terminal status — nothing is allowed
  if (allowedTransitions.length === 0) {
    if (locale === "ar") return `"${from}" حالة نهائية ولا يمكن تغييرها`;
    if (locale === "fr") return `"${from}" est un statut final et ne peut pas être modifié`;
    return `"${from}" is a final status and cannot be changed`;
  }

  const to = labels[targetStatus] ?? targetStatus;
  const allowedLabels = allowedTransitions
    .map((s) => labels[s] ?? s)
    .join(locale === "ar" ? "، " : ", ");

  if (locale === "ar") {
    return `لا يمكن الانتقال من "${from}" إلى "${to}". المسموح به: ${allowedLabels}`;
  }
  if (locale === "fr") {
    return `Impossible de passer de "${from}" à "${to}". Autorisé: ${allowedLabels}`;
  }
  return `Cannot change from "${from}" to "${to}". Allowed: ${allowedLabels}`;
}

/**
 * API Response types
 */
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Get all orders (backward compatible - returns array only)
 */
export async function getOrders(filters: OrderFilters = {}): Promise<Order[]> {
  await requirePermission(SCOPES.ORDERS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  const rows = await getAllOrders(db, storeId, filters);
  return rows as unknown as Order[];
}

export interface PaginatedOrders {
  data: Order[];
  count: number;
  total: number;
}

/**
 * Get orders with pagination metadata.
 * ⚡ New function - keeps getOrders() backward compatible.
 */
export async function getOrdersPaginated(filters: OrderFilters = {}): Promise<PaginatedOrders> {
  await requirePermission(SCOPES.ORDERS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  const result = await getOrdersPaginatedQuery(db, storeId, filters);
  return {
    data: result.rows as unknown as Order[],
    count: result.rows.length,
    total: result.total,
  };
}

/**
 * Get order counts grouped by status (for filter chips).
 * Applies all filters EXCEPT status so counts are always complete.
 */
export async function getOrderStatusCounts(
  filters: Pick<OrderFilters, "wilayaId" | "search" | "startDate" | "endDate">
): Promise<Record<string, number>> {
  await requirePermission(SCOPES.ORDERS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  return getOrderStatusCountsQuery(db, storeId, filters);
}

/**
 * Get single order by ID
 */
export async function getOrder(id: string): Promise<Order | null> {
  await requirePermission(SCOPES.ORDERS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  const row = await getOrderById(db, storeId, id);
  return (row as unknown as Order | null) ?? null;
}

/**
 * Create new order
 */
export async function createOrder(orderData: {
  customerId: string;
  customerName: string;
  phone: string;
  wilayaId: number;
  communeId?: string | null;
  city?: string | null;
  address?: string | null;
  price: number;
  notes?: string;
  orderType: "online" | "offline";
  deliveryType: "home" | "stop_desk";
  deliveryFee: number;
  companyId?: string | null;
  weight?: number | null;
  isFragile?: boolean | null;
  products: Array<{
    productId: string;
    productName: string;
    variantId?: string | null;
    variantLabel?: string | null;
    quantity: number;
    pricePerUnit: number;
    lineTotal: number;
  }>;
}): Promise<Order> {
  await requirePermission(SCOPES.ORDERS_CREATE);
  
  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const response = await apiClient.post<ApiResponse<Order>>("/api/orders", apiKey, orderData);

    if (!response.data) {
      throw new Error("No order data returned from API");
    }

    // Revalidate orders page
      revalidatePath("/orders");
    revalidatePath("/delivery");

    return response.data!;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);
      
      console.error("[Orders Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
      });
      
      throw new Error(userMessage);
    }
    throw error;
  }
}

/**
 * Result wrapper for status changes — returned object instead of thrown error.
 *
 * Why not just throw a clean message? Next.js scrubs server-action error
 * messages in production builds and replaces them with a generic
 * "specific message is omitted" string, leaving only an opaque `digest`.
 * That security feature blocks us from surfacing a translated, user-actionable
 * message ("you can't go from delivered back to ready") in the toast — which
 * is exactly what the dashboard needs.
 *
 * Returning a discriminated union sidesteps the scrub entirely: the message
 * lives in the response payload, not in a thrown Error. Callers do
 * `if (!res.ok) toast.error(res.error)` and the real text reaches the user
 * in both dev and prod, identically.
 *
 * Auth/permission failures still THROW (redirect, requirePermission), since
 * those are intentional flow-control signals Next.js handles separately.
 */
export type StatusUpdateResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Update order status. See StatusUpdateResult for why this returns instead
 * of throws.
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<StatusUpdateResult> {
  await requirePermission(SCOPES.ORDERS_UPDATE);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    await apiClient.patch<ApiResponse>(`/api/orders/${id}/status`, apiKey, { status });

    // Revalidate relevant pages
    revalidatePath("/orders");
    revalidatePath("/dashboard");
    revalidatePath("/delivery");
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiClientError) {
      const locale = await getLocale();

      console.error("[Orders Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
        orderId: id,
        status,
      });

      // Translated message for invalid status transitions
      if (error.code === "INVALID_STATUS_TRANSITION") {
        const ctx = error.context ?? {};
        return {
          ok: false,
          error: buildTransitionErrorMessage(
            locale,
            ctx.currentStatus ?? "",
            ctx.targetStatus ?? status,
            ctx.allowedTransitions ?? [],
          ),
        };
      }

      if (error.code) {
        return { ok: false, error: mapError(error.code, locale, error.context) };
      }
    }
    // Last-resort: surface whatever the carrier/API said. Better to show
    // a raw upstream message than the prod-scrubbed Next.js placeholder.
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

/**
 * Update order details (not status). Returns the updated order or an error.
 */
export async function updateOrder(
  id: string,
  data: Record<string, unknown>,
): Promise<{ ok: true; data: Order } | { ok: false; error: string }> {
  await requirePermission(SCOPES.ORDERS_UPDATE);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const result = await apiClient.patch<{ success: boolean; data: Order }>(`/api/orders/${id}`, apiKey, data);

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    return { ok: true, data: result.data };
  } catch (error) {
    const locale = await getLocale();
    if (error instanceof ApiClientError) {
      if (error.code) {
        return { ok: false, error: mapError(error.code, locale, error.context) };
      }
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update order",
    };
  }
}

/**
 * Assign driver to order
 */
export async function assignDriverToOrder(id: string, driverId: string): Promise<void> {
  await requirePermission(SCOPES.ORDERS_ASSIGN);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    await apiClient.patch<ApiResponse>(`/api/orders/${id}/assign-driver`, apiKey, { driverId });

    // Revalidate relevant pages
    revalidatePath("/orders");
    revalidatePath("/delivery");
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);
      
      console.error("[Orders Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
        orderId: id,
        driverId,
      });
      
      throw new Error(userMessage);
    }
    throw error;
  }
}

/**
 * Delete order
 */
export async function deleteOrder(id: string): Promise<void> {
  await requirePermission(SCOPES.ORDERS_DELETE);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    await apiClient.delete<ApiResponse>(`/api/orders/${id}`, apiKey);

    // Revalidate relevant pages
    revalidatePath("/orders");
    revalidatePath("/dashboard");

  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);
      
      console.error("[Orders Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
        orderId: id,
      });
      
      throw new Error(userMessage);
    }
    throw error;
  }
}

/**
 * Dispatch order to delivery company API (creates shipment via NOEST etc.)
 */
export async function dispatchOrder(
  id: string,
  options?: { companyId?: string; stationCode?: string; remarks?: string; weight?: number; fragile?: boolean }
): Promise<{ trackingNumber: string; shipmentId: string; labelUrl: string | null }> {
  await requirePermission(SCOPES.DELIVERY_DISPATCH);

  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");

  try {
    const response = await apiClient.post<ApiResponse<{ trackingNumber: string; shipmentId: string; labelUrl: string | null }>>(
      `/api/orders/${id}/dispatch`,
      apiKey,
      options ?? {}
    );

    if (!response.data) throw new Error("No dispatch data returned");

    revalidatePath("/orders");
    revalidatePath("/delivery");

    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);
      
      console.error("[Orders Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
        orderId: id,
        companyId: options?.companyId,
      });

      throw new Error(userMessage);
    }
    throw error;
  }
}

/**
 * Bulk dispatch multiple orders to a delivery company
 */
export async function bulkDispatchOrders(
  companyId: string,
  orderIds: string[]
): Promise<{
  success: boolean;
  message: string;
  results: Array<{
    orderId: string;
    orderNumber: string;
    trackingNumber?: string;
    error?: string;
  }>;
}> {
  await requirePermission(SCOPES.DELIVERY_DISPATCH);

  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");

  try {
    const response = await apiClient.post<ApiResponse<{
      success: boolean;
      message: string;
      results: Array<{
        orderId: string;
        orderNumber: string;
        trackingNumber?: string;
        error?: string;
      }>;
    }>>(
      "/api/orders/bulk-dispatch",
      apiKey,
      { companyId, orderIds }
    );

    if (!response.data) {
      throw new Error("No dispatch data returned from API");
    }

    revalidatePath("/orders");
    revalidatePath("/delivery");

    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);
      throw new Error(userMessage);
    }
    throw error;
  }
}

// ─── Shipment Management Actions ─────────────────────────────────────────────

/**
 * Update customer info / amount at the carrier API (before validation only).
 * Only supported by providers that implement updateShipment (e.g. ecotrack/Packers).
 */
export async function updateShipment(
  id: string,
  input: {
    customerName?: string;
    phone?: string;
    phone2?: string;
    address?: string;
    commune?: string;
    wilayaId?: number;
    amount?: number;
    remarks?: string;
    fragile?: boolean;
    weight?: number;
  }
): Promise<void> {
  await requirePermission(SCOPES.DELIVERY_DISPATCH);
  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");
  try {
    await apiClient.patch<{ success: boolean }>(`/api/orders/${id}/update-shipment`, apiKey, input);
    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      throw new Error(mapError(error.code, locale, error.context));
    }
    throw error;
  }
}

/**
 * Cancel/delete a shipment at the carrier API (before validation only).
 * On success: clears tracking number from order, resets status to "ready".
 * Only supported by providers that implement deleteShipment (e.g. ecotrack/Packers).
 */
export async function cancelShipment(id: string): Promise<void> {
  await requirePermission(SCOPES.DELIVERY_DISPATCH);
  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");
  try {
    await apiClient.post<{ success: boolean }>(`/api/orders/${id}/cancel-shipment`, apiKey, {});
    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    revalidatePath("/delivery");
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      throw new Error(mapError(error.code, locale, error.context));
    }
    throw error;
  }
}

/**
 * Add a remark/note to the shipment at the carrier API.
 * Works at any time after dispatch. Visible to carrier and sender.
 * Only supported by providers that implement addRemark (e.g. ecotrack/Packers).
 */
export async function addShipmentRemark(id: string, content: string): Promise<void> {
  await requirePermission(SCOPES.DELIVERY_DISPATCH);
  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");
  try {
    await apiClient.post<{ success: boolean }>(`/api/orders/${id}/add-remark`, apiKey, { content });
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      throw new Error(mapError(error.code, locale, error.context));
    }
    throw error;
  }
}

/**
 * Fetch the full tracking history for a shipment from the carrier API.
 * Returns chronological events (pickup, hub, delivery attempts, etc.).
 * Only supported by providers that implement getTrackingInfo (e.g. ecotrack/Packers).
 */
export async function getShipmentTracking(
  id: string
): Promise<Array<{ activity: string; description?: string; date?: string }>> {
  await requirePermission(SCOPES.ORDERS_READ);
  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");
  try {
    const res = await apiClient.get<ApiResponse<Array<{ activity: string; description?: string; date?: string }>>>(
      `/api/orders/${id}/tracking-events`,
      apiKey
    );
    return res.data ?? [];
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      throw new Error(mapError(error.code, locale, error.context));
    }
    throw error;
  }
}

export async function validateShipment(id: string): Promise<void> {
  await requirePermission(SCOPES.DELIVERY_DISPATCH);

  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");

  try {
    await apiClient.post<{ success: boolean }>(
      `/api/orders/${id}/validate-shipment`,
      apiKey,
      {}
    );

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    revalidatePath("/delivery");
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);
      throw new Error(userMessage);
    }
    throw error;
  }
}

// ─── Reconcile Orders ─────────────────────────────────────────────────────────

interface ReconcileResult {
  total: number;
  updated: number;
  failed: number;
  results: Array<{
    orderId: string;
    orderNumber: string;
    trackingNumber: string;
    previousStatus: string;
    newStatus: string | null;
    updated: boolean;
    error?: string;
  }>;
}

export async function reconcileOrders(): Promise<ReconcileResult> {
  await requirePermission(SCOPES.ORDERS_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");

  try {
    const response = await apiClient.post<ApiResponse<ReconcileResult>>(
      "/api/orders/reconcile",
      apiKey,
      {}
    );
    revalidatePath("/orders");
    return response.data ?? { total: 0, updated: 0, failed: 0, results: [] };
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);
      throw new Error(userMessage);
    }
    throw error;
  }
}