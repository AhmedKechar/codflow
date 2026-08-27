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

const getBalanceRoute = createRoute({
  method: "get",
  path: "/balance",
  middleware: [requireScope(SCOPES.AI_CREDITS_READ)],
  tags: ["AI Credits"],
  summary: "Get AI credit balance",
  operationId: "getBalance",
  responses: {
    200: { description: "Credit balance with remaining" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const getUsageRoute = createRoute({
  method: "get",
  path: "/usage",
  middleware: [requireScope(SCOPES.AI_CREDITS_READ)],
  tags: ["AI Credits"],
  summary: "Get AI credit usage history",
  operationId: "getUsageHistory",
  responses: {
    200: { description: "Usage history" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const router = new OpenAPIHono<AppContext>();
router.openapi(getBalanceRoute, h.getBalance);
router.openapi(getUsageRoute, h.getUsageHistory);
export default router;
