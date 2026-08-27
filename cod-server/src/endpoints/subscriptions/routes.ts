import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { requireScope } from "@/rbac/middleware";
import * as h from "./handlers";
import { ErrorResponseSchema } from "@/openapi/schemas";

const jsonContent = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});

const errorResponse = (description: string) => ({
  description,
  content: jsonContent(ErrorResponseSchema),
});

const listPlansRoute = createRoute({
  method: "get",
  path: "/plans",
  tags: ["Subscriptions"],
  summary: "List available plans",
  operationId: "listPlans",
  responses: {
    200: { description: "List of active plans" },
    401: errorResponse("Missing or invalid API key"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const getPlanRoute = createRoute({
  method: "get",
  path: "/plans/{id}",
  tags: ["Subscriptions"],
  summary: "Get plan details",
  operationId: "getPlan",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: { description: "Plan details" },
    401: errorResponse("Missing or invalid API key"),
    404: errorResponse("Plan not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const getMySubscriptionRoute = createRoute({
  method: "get",
  path: "/current",
  middleware: [requireScope(SCOPES.SUBSCRIPTIONS_READ)],
  tags: ["Subscriptions"],
  summary: "Get current subscription",
  operationId: "getMySubscription",
  responses: {
    200: { description: "Current subscription with plan details" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const getHistoryRoute = createRoute({
  method: "get",
  path: "/history",
  middleware: [requireScope(SCOPES.SUBSCRIPTIONS_READ)],
  tags: ["Subscriptions"],
  summary: "Get subscription history",
  operationId: "getSubscriptionHistory",
  responses: {
    200: { description: "Subscription history" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const upgradeRoute = createRoute({
  method: "post",
  path: "/upgrade",
  middleware: [requireScope(SCOPES.SUBSCRIPTIONS_MANAGE)],
  tags: ["Subscriptions"],
  summary: "Upgrade or change plan",
  operationId: "upgradePlan",
  request: {
    body: {
      required: true,
      content: jsonContent(z.object({
        planId: z.string(),
        paymentMethod: z.enum(["ccp", "baridi_mob", "wise", "redotpay"]).optional(),
      })),
    },
  },
  responses: {
    200: { description: "Subscription updated" },
    400: errorResponse("Validation error"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
    404: errorResponse("Plan not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const router = new OpenAPIHono<AppContext>();
router.openapi(listPlansRoute, h.listPlans);
router.openapi(getPlanRoute, h.getPlan);
router.openapi(getMySubscriptionRoute, h.getMySubscription);
router.openapi(getHistoryRoute, h.getSubscriptionHistory);
router.openapi(upgradeRoute, h.upgradePlan);

export default router;
