/**
 * Orders Status Transitions & Assignment Logic
 * 
 * Handles status updates, driver assignments, and workflow state machines.
 */

import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { drivers } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as queries from "./queries";
import * as validation from "./validation";
import { logActivity, ACTIONS } from "@/lib/activity";
import { NotFoundError, BusinessLogicError, ValidationError } from "@/lib/errors/classes";
import { ERROR_CODES, ERROR_CATEGORIES } from "../../../../cod-shared/errors/codes";
import { shouldTriggerCapiPurchase } from "@/workflows/capi-helpers";
import { sendStatusNotification } from "@/services/notifications";

/**
 * PATCH /orders/:id/status
 * Update order status
 */
export async function updateStatus(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const orderId = c.req.param("id");
  
  if (!orderId) {
    throw new ValidationError("Order ID is required", ERROR_CODES.REQUIRED_FIELD_MISSING);
  }
  
  const body = await c.req.json();
  
  const bodyData: any = (c.req as any).valid?.("json");

  // Validate request body
  const validated = bodyData ?? validation.updateOrderStatusSchema.parse(body);

  // Check if order exists
  const order = await queries.getOrderById(db, storeId, orderId);
  if (!order) {
    throw new NotFoundError("Order", orderId);
  }

  // Get user from context (set by auth middleware)
  const user = c.get("user");

  await queries.updateOrderStatus(db, storeId, orderId, validated.status, user?.id, user?.name ?? undefined);

  // Send notification to customer fire-and-forget — never block the status response.
  void sendStatusNotification(db, orderId, validated.status as any, storeId).catch((err) =>
    console.error("[notification] send failed:", err?.message)
  );

  // Fire CAPI Purchase Workflow fire-and-forget — never block the status response.
  if (shouldTriggerCapiPurchase(validated.status, order.wilayaId)) {
    if (!c.env.CAPI_WORKFLOW) {
      // Binding absent — worker was provisioned before CAPI_WORKFLOW was added.
      // Re-provision the client to activate the binding.
      console.error("[capi-workflow] CAPI_WORKFLOW binding is undefined — worker needs re-provision");
    } else {
      void c.env.CAPI_WORKFLOW.create({
        id: `capi-${orderId}-Purchase`,
        params: {
          orderId,
          eventName: "Purchase",
          triggeredAt: Math.floor(Date.now() / 1000),
          triggerStatus: validated.status,
        },
      }).catch((err: Error) =>
        console.error("[capi-workflow] trigger failed:", err?.message)
      );
    }
  }

  await logActivity(db, user, ACTIONS.ORDER_STATUS_CHANGED, {
    type: "order", id: orderId,
  }, { from: order.status, to: validated.status });

  return c.json({
    success: true,
    message: "Order status updated",
  }, 200);
}

/**
 * PATCH /orders/:id/assign-driver
 * Assign driver to order
 */
export async function assignDriver(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const orderId = c.req.param("id");

  if (!orderId) {
    throw new ValidationError("Order ID is required", ERROR_CODES.REQUIRED_FIELD_MISSING);
  }

  const order = await queries.getOrderById(db, storeId, orderId);
  if (!order) {
    throw new NotFoundError("Order", orderId);
  }

  // Business rule: delivery methods are mutually exclusive.
  // Once dispatched to a company (trackingNumber exists), driver assignment is blocked.
  if (order.trackingNumber) {
    throw new BusinessLogicError(
      `This order is already dispatched to a delivery company (tracking: ${order.trackingNumber}). Driver assignment is not allowed.`,
      ERROR_CODES.ORDER_ALREADY_DISPATCHED,
      { orderId, trackingNumber: order.trackingNumber }
    );
  }

  // Once the delivery method is set to "company" (even before API dispatch), block assignment.
  if (order.deliveryMethod === "company") {
    throw new BusinessLogicError(
      "This order is assigned to a delivery company. Remove the company assignment first.",
      ERROR_CODES.ORDER_ALREADY_DISPATCHED,
      { orderId }
    );
  }

  // Can't assign driver once the order is shipped, completed, or terminal.
  const lockedStatuses = ["shipped", "delivered", "returned", "cancelled"];
  if (lockedStatuses.includes(order.status)) {
    throw new BusinessLogicError(
      `Cannot assign a driver — order is already "${order.status}".`,
      ERROR_CODES.INVALID_STATUS_TRANSITION,
      { orderId, currentStatus: order.status }
    );
  }

  const bodyData: any = (c.req as any).valid?.("json");
  const validated = bodyData ?? validation.assignDriverSchema.parse(await c.req.json());

  // Check if driver exists
  const driver = await db
    .select({ id: drivers.id })
    .from(drivers)
    .where(eq(drivers.id, validated.driverId))
    .get();

  if (!driver) {
    throw new NotFoundError("Driver", validated.driverId);
  }

  await queries.assignDriver(db, storeId, orderId, validated.driverId);

  const actor = c.get("user");
  await logActivity(db, actor, ACTIONS.ORDER_DRIVER_ASSIGNED, {
    type: "order", id: orderId, label: order.orderNumber,
  }, { driverId: validated.driverId });

  return c.json({ success: true, message: "Driver assigned successfully" }, 200);
}

/**
 * PATCH /orders/:id/unassign
 *
 * Remove the driver currently assigned to an order. Clears driverId and
 * driverFee, resets deliveryMethod to "unassigned", and rolls the status
 * back to "confirmed" when applicable.
 *
 * Rejected when:
 *  - order doesn't exist
 *  - order has no driver assigned
 *  - order has already progressed past dispatch (shipped,
 *    delivered, returned, cancelled) — at that point clearing the driver
 *    would erase payroll/handoff history.
 */
export async function unassignDriver(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const orderId = c.req.param("id");

  if (!orderId) {
    throw new ValidationError("Order ID is required", ERROR_CODES.REQUIRED_FIELD_MISSING);
  }

  const order = await queries.getOrderById(db, storeId, orderId);
  if (!order) {
    throw new NotFoundError("Order", orderId);
  }

  if (!order.driverId) {
    throw new BusinessLogicError(
      "Order has no driver assigned.",
      ERROR_CODES.INVALID_STATUS_TRANSITION,
      { orderId }
    );
  }

  const lockedStatuses = ["shipped", "delivered", "returned", "cancelled"];
  if (lockedStatuses.includes(order.status)) {
    throw new BusinessLogicError(
      `Cannot unassign driver — order is already "${order.status}".`,
      ERROR_CODES.INVALID_STATUS_TRANSITION,
      { orderId, currentStatus: order.status }
    );
  }

  const previousDriverId = order.driverId;

  await queries.unassignDriver(db, storeId, orderId);

  const actor = c.get("user");
  await logActivity(db, actor, ACTIONS.ORDER_DRIVER_ASSIGNED, {
    type: "order", id: orderId, label: order.orderNumber,
  }, { driverId: null, previousDriverId });

  return c.json({ success: true, message: "Driver unassigned" }, 200);
}
