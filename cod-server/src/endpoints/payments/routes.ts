import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { defineRoute } from "@/lib/route-builder";
import * as h from "./handlers";

const listMyPaymentsRoute = defineRoute({
  method: "get",
  path: "/",
  auth: { scope: SCOPES.PAYMENTS_READ },
  tags: ["Payments"],
  summary: "List my store payments",
  operationId: "listMyPayments",
  handler: h.listMyPayments,
});

const getPaymentRoute = defineRoute({
  method: "get",
  path: "/{id}",
  auth: { scope: SCOPES.PAYMENTS_READ },
  tags: ["Payments"],
  summary: "Get payment details",
  operationId: "getPayment",
  params: z.object({ id: z.string() }),
  handler: h.getPayment,
});

const submitPaymentRoute = defineRoute({
  method: "post",
  path: "/",
  auth: { scope: SCOPES.PAYMENTS_MANAGE },
  tags: ["Payments"],
  summary: "Submit payment receipt",
  operationId: "submitPayment",
  body: z.object({
    subscriptionId: z.string(),
    amountDzd: z.number().min(1),
    paymentMethod: z.enum(["ccp", "baridi_mob", "wise", "redotpay"]),
    receiptUrl: z.string().optional(),
    receiptFile: z.string().optional(),
    referenceNumber: z.string().optional(),
  }),
  handler: h.submitPayment,
});

const listPendingRoute = defineRoute({
  method: "get",
  path: "/pending",
  auth: { scope: SCOPES.PAYMENTS_APPROVE },
  tags: ["Payments"],
  summary: "List pending payments (super admin)",
  operationId: "listPendingPayments",
  handler: h.listPendingPayments,
});

const approveRoute = defineRoute({
  method: "post",
  path: "/{id}/approve",
  auth: { scope: SCOPES.PAYMENTS_APPROVE },
  tags: ["Payments"],
  summary: "Approve payment (super admin)",
  operationId: "approvePayment",
  params: z.object({ id: z.string() }),
  body: z.object({ notes: z.string().optional() }),
  responses: {
    200: { description: "Payment approved" },
    401: { description: "Missing or invalid API key" },
    403: { description: "Insufficient scope" },
    404: { description: "Payment not found" },
  },
  handler: h.approvePayment,
});

const rejectRoute = defineRoute({
  method: "post",
  path: "/{id}/reject",
  auth: { scope: SCOPES.PAYMENTS_APPROVE },
  tags: ["Payments"],
  summary: "Reject payment (super admin)",
  operationId: "rejectPayment",
  params: z.object({ id: z.string() }),
  body: z.object({ notes: z.string().optional() }),
  responses: {
    200: { description: "Payment rejected" },
    401: { description: "Missing or invalid API key" },
    403: { description: "Insufficient scope" },
    404: { description: "Payment not found" },
  },
  handler: h.rejectPayment,
});

const router = new OpenAPIHono<AppContext>();
router.openapi(listMyPaymentsRoute.route, listMyPaymentsRoute.handler);
router.openapi(getPaymentRoute.route, getPaymentRoute.handler);
router.openapi(submitPaymentRoute.route, submitPaymentRoute.handler);
router.openapi(listPendingRoute.route, listPendingRoute.handler);
router.openapi(approveRoute.route, approveRoute.handler);
router.openapi(rejectRoute.route, rejectRoute.handler);
export default router;
