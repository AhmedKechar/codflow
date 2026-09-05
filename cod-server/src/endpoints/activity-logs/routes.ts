/**
 * Activity Logs Routes
 *
 * All routes are admin-only — activity logs are never visible to staff.
 */

import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import { listActivityLogs, getUserActivityLogs } from "./handlers";

const activityLogsQuerySchema = z.object({
  actorId: z.string().optional().openapi({
    description: "Filter by actor (user) ID",
  }),
  entityType: z
    .string()
    .optional()
    .openapi({
      description:
        "Filter by entity type. Valid values: `order`, `customer`, `customer_group`, `customer_tag`, `driver`, `product`, `stock`, `user`, `review`",
    }),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(50)
    .openapi({ description: "Maximum number of logs to return" }),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .openapi({ description: "Number of logs to skip" }),
});

const userLogsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(30)
    .openapi({ description: "Maximum number of logs to return" }),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .openapi({ description: "Number of logs to skip" }),
});

const listLogs = defineRoute({
  method: "get",
  path: "/",
  auth: "admin",
  tags: ["Activity Logs"],
  summary: "List activity logs",
  description: "Get audit trail of all system actions (admin only)",
  operationId: "listActivityLogs",
  query: activityLogsQuerySchema,
  handler: listActivityLogs,
});

const getUserLogs = defineRoute({
  method: "get",
  path: "/users/{userId}",
  auth: "admin",
  tags: ["Activity Logs"],
  summary: "Get user activity logs",
  description: "Get activity logs for a specific user (admin only)",
  operationId: "getUserActivityLogs",
  params: z.object({
    userId: z.string().openapi({ description: "User ID to filter logs for" }),
  }),
  query: userLogsQuerySchema,
  handler: getUserActivityLogs,
});

const router = new OpenAPIHono<AppContext>();
router.openapi(listLogs.route, listLogs.handler);
router.openapi(getUserLogs.route, getUserLogs.handler);
export default router;
