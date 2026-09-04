/**
 * Orders Validation Schemas
 * 
 * Zod schemas for request validation.
 */

import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  phone: z.string().regex(/^0[5-7]\d{8}$/, "Invalid Algerian phone number"),
  wilayaId: z.number().int().min(1).max(58),
  communeId: z.string().min(1, "Commune is required"),
  city: z.string().nullish(),
  address: z.string().nullish(),
  price: z.number().positive(),
  notes: z.string().nullish(),
  orderType: z.enum(["online", "offline"]).default("online"),
  deliveryType: z.enum(["home", "stop_desk"]).default("home"),
  /** Optional explicit fee — for offline/dashboard orders. Online orders ignore this and auto-resolve from shipping profile. */
  deliveryFee: z.number().min(0).optional(),
  companyId: z.string().min(1).nullish(),
  products: z.array(
    z.object({
      productId: z.string().min(1),
      productName: z.string(),
      variantId: z.string().min(1).nullish(),
      variantLabel: z.string().nullish(),
      quantity: z.number().int().positive(),
      pricePerUnit: z.number().positive(),
      lineTotal: z.number().positive(),
    })
  ).min(1, "At least one product is required"),
}).superRefine((data, ctx) => {
  if (data.deliveryType === "home" && !data.address?.trim()) {
    ctx.addIssue({ code: "custom", path: ["address"], message: "Address is required for home delivery" });
  }
});

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "unreachable",
  "busy",
  "postponed",
  "shipped",
  "delivered",
  "cancelled",
  "fake",
  "duplicate",
  "returned",
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const assignDriverSchema = z.object({
  driverId: z.string().min(1),
});

/**
 * PATCH /orders/:id/products/:productLineId/return
 * Records how many units on a single order line the customer refused at the door.
 * Server computes status ("fulfilled" | "partially_returned" | "returned") from
 * the ratio of returnedQuantity to the line's original quantity.
 */
export const returnOrderProductSchema = z.object({
  returnedQuantity: z.number().int().min(0),
});

export const orderFiltersSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  wilayaId: z.coerce.number().int().min(1).max(58).optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * POST /orders/bulk-dispatch — dispatch multiple existing orders to a delivery company.
 * Uses the provider's bulk creation API (up to 100 orders per request).
 */
export const bulkDispatchSchema = z.object({
  companyId: z.string().min(1),
  orderIds: z.array(z.string().min(1)).min(1).max(100, "Maximum 100 orders per bulk dispatch"),
});

export type BulkDispatchInput = z.infer<typeof bulkDispatchSchema>;

/**
 * PATCH /orders/:id — Edit an existing order after creation.
 * All fields optional; only changed fields are applied.
 */
export const updateOrderSchema = z.object({
  customerName: z.string().min(1).optional(),
  phone: z.string().regex(/^0[5-7]\d{8}$/, "Invalid Algerian phone number").optional(),
  wilayaId: z.number().int().min(1).max(58).optional(),
  communeId: z.string().optional(),
  address: z.string().optional(),
  price: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  deliveryType: z.enum(["home", "stop_desk"]).optional(),
  stationCode: z.string().optional(),
  notes: z.string().optional(),
  weight: z.number().min(0).optional(),
  isFragile: z.boolean().optional(),
  products: z.array(
    z.object({
      productId: z.string().min(1),
      productName: z.string(),
      variantId: z.string().min(1).nullish(),
      variantLabel: z.string().nullish(),
      quantity: z.number().int().positive(),
      pricePerUnit: z.number().positive(),
      lineTotal: z.number().positive(),
    })
  ).min(1, "At least one product is required").optional(),
}).superRefine((data, ctx) => {
  if (data.deliveryType === "home" && data.address !== undefined && !data.address?.trim()) {
    ctx.addIssue({ code: "custom", path: ["address"], message: "Address is required for home delivery" });
  }
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
export type OrderFiltersInput = z.infer<typeof orderFiltersSchema>;
export type ReturnOrderProductInput = z.infer<typeof returnOrderProductSchema>;
