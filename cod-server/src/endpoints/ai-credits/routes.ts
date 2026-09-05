import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import * as h from "./handlers";

const getBalanceRoute = defineRoute({
  method: "get",
  path: "/balance",
  auth: { scope: SCOPES.AI_CREDITS_READ },
  tags: ["AI Credits"],
  summary: "Get AI credit balance",
  operationId: "getBalance",
  handler: h.getBalance,
});

const getUsageRoute = defineRoute({
  method: "get",
  path: "/usage",
  auth: { scope: SCOPES.AI_CREDITS_READ },
  tags: ["AI Credits"],
  summary: "Get AI credit usage history",
  operationId: "getUsageHistory",
  handler: h.getUsageHistory,
});

const router = new OpenAPIHono<AppContext>();
router.openapi(getBalanceRoute.route, getBalanceRoute.handler);
router.openapi(getUsageRoute.route, getUsageRoute.handler);
export default router;
