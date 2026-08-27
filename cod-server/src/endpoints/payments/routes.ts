import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { requireScope, requireAdmin } from "@/rbac/middleware";
import * as h from "./handlers";
import { ErrorResponseSchema } from "@/openapi/schemas";

const jsonContent = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});
const errorResponse = (description: string) => ({
  description,
  content: jsonContent(ErrorResponseSchema),
});

const listMyPaymentsRoute = createRoute({
  method: "get",
  path: "/",
  middleware: [requireScope(SCOPES.PAYMENTS_READ)],
  tags: ["Payments"],
  summary: "List my store payments",
  operationId: "listMyPayments",
  responses: {
    200: { description: "Payment list" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const getPaymentRoute = createRoute({
  method: "get",
  path: "/{id}",
  middleware: [requireScope(SCOPES.PAYMENTS_READ)],
  tags: ["Payments"],
  summary: "Get payment details",
  operationId: "getPayment",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Payment details" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
    404: errorResponse("Payment not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const submitPaymentRoute = createRoute({
  method: "post",
  path: "/",
  middleware: [requireScope(SCOPES.PAYMENTS_MANAGE)],
  tags: ["Payments"],
  summary: "Submit payment receipt",
  operationId: "submitPayment",
  request: {
    body: {
      required: true,
      content: jsonContent(z.object({
        subscriptionId: z.string(),
        amountDzd: z.number().min(1),
        paymentMethod: z.enum(["ccp", "baridi_mob", "wise", "redotpay"]),
        receiptUrl: z.string().optional(),
        receiptFile: z.string().optional(),
        referenceNumber: z.string().optional(),
      })),
    },
  },
  responses: {
    201: { description: "Payment submitted" },
    400: errorResponse("Validation error"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const listPendingRoute = createRoute({
  method: "get",
  path: "/pending",
  middleware: [requireScope(SCOPES.PAYMENTS_APPROVE)],
  tags: ["Payments"],
  summary: "List pending payments (super admin)",
  operationId: "listPendingPayments",
  responses: {
    200: { description: "Pending payments" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const approveRoute = createRoute({
  method: "post",
  path: "/{id}/approve",
  middleware: [requireScope(SCOPES.PAYMENTS_APPROVE)],
  tags: ["Payments"],
  summary: "Approve payment (super admin)",
  operationId: "approvePayment",
  request: {
    params: z.object({ id: z.string() }),
    body: { required: false, content: jsonContent(z.object({ notes: z.string().optional() })) },
  },
  responses: {
    200: { description: "Payment approved" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
    404: errorResponse("Payment not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const rejectRoute = createRoute({
  method: "post",
  path: "/{id}/reject",
  middleware: [requireScope(SCOPES.PAYMENTS_APPROVE)],
  tags: ["Payments"],
  summary: "Reject payment (super admin)",
  operationId: "rejectPayment",
  request: {
    params: z.object({ id: z.string() }),
    body: { required: false, content: jsonContent(z.object({ notes: z.string().optional() })) },
  },
  responses: {
    200: { description: "Payment rejected" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
    404: errorResponse("Payment not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const router = new OpenAPIHono<AppContext>();
router.openapi(listMyPaymentsRoute, h.listMyPayments);
router.openapi(getPaymentRoute, h.getPayment);
router.openapi(submitPaymentRoute, h.submitPayment);
router.openapi(listPendingRoute, h.listPendingPayments);
router.openapi(approveRoute, h.approvePayment);
router.openapi(rejectRoute, h.rejectPayment);
export default router;
