import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { defineRoute } from "@/lib/route-builder";
import * as h from "./handlers";

const listPlansRoute = defineRoute({
  method: "get",
  path: "/plans",
  auth: "api-key",
  tags: ["Subscriptions"],
  summary: "List available plans",
  operationId: "listPlans",
  handler: h.listPlans,
});

const getPlanRoute = defineRoute({
  method: "get",
  path: "/plans/{id}",
  auth: "api-key",
  tags: ["Subscriptions"],
  summary: "Get plan details",
  operationId: "getPlan",
  params: z.object({ id: z.string() }),
  handler: h.getPlan,
});

const getMySubscriptionRoute = defineRoute({
  method: "get",
  path: "/current",
  auth: { scope: SCOPES.SUBSCRIPTIONS_READ },
  tags: ["Subscriptions"],
  summary: "Get current subscription",
  operationId: "getMySubscription",
  handler: h.getMySubscription,
});

const getHistoryRoute = defineRoute({
  method: "get",
  path: "/history",
  auth: { scope: SCOPES.SUBSCRIPTIONS_READ },
  tags: ["Subscriptions"],
  summary: "Get subscription history",
  operationId: "getSubscriptionHistory",
  handler: h.getSubscriptionHistory,
});

const upgradeRoute = defineRoute({
  method: "post",
  path: "/upgrade",
  auth: { scope: SCOPES.SUBSCRIPTIONS_MANAGE },
  tags: ["Subscriptions"],
  summary: "Upgrade or change plan",
  operationId: "upgradePlan",
  body: z.object({
    planId: z.string(),
    paymentMethod: z.enum(["ccp", "baridi_mob", "wise", "redotpay"]).optional(),
  }),
  handler: h.upgradePlan,
});

const router = new OpenAPIHono<AppContext>();
router.openapi(listPlansRoute.route, listPlansRoute.handler);
router.openapi(getPlanRoute.route, getPlanRoute.handler);
router.openapi(getMySubscriptionRoute.route, getMySubscriptionRoute.handler);
router.openapi(getHistoryRoute.route, getHistoryRoute.handler);
router.openapi(upgradeRoute.route, upgradeRoute.handler);

export default router;
