/**
 * Notification Settings Routes
 */

import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import * as handlers from "./handlers";
import {
  upsertNotificationSettingSchema,
  bulkUpsertNotificationSettingsSchema,
  NOTIFICATION_STATUSES,
} from "./validation";

const jsonContent = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});

const listSettingsRoute = defineRoute({
  method: "get",
  path: "/",
  auth: { scope: SCOPES.MESSAGING_MANAGE },
  tags: ["Notification Settings"],
  summary: "List notification settings",
  description: "Get all notification settings for the store. Returns defaults for statuses without configured settings.",
  operationId: "listNotificationSettings",
  responses: {
    200: {
      description: "List of notification settings",
      content: jsonContent(z.object({
        success: z.boolean(),
        data: z.array(z.any()),
      })),
    },
  },
  handler: handlers.listNotificationSettings,
});

const getSettingRoute = defineRoute({
  method: "get",
  path: "/{status}",
  auth: { scope: SCOPES.MESSAGING_MANAGE },
  tags: ["Notification Settings"],
  summary: "Get notification setting",
  description: "Get the notification setting for a specific order status.",
  operationId: "getNotificationSetting",
  params: z.object({
    status: z.enum(NOTIFICATION_STATUSES).openapi({ description: "Order status" }),
  }),
  responses: {
    200: {
      description: "Notification setting",
      content: jsonContent(z.object({
        success: z.boolean(),
        data: z.any(),
      })),
    },
    404: {
      description: "Setting not found",
    },
  },
  handler: handlers.getNotificationSetting,
});

const upsertSettingRoute = defineRoute({
  method: "put",
  path: "/",
  auth: { scope: SCOPES.MESSAGING_MANAGE },
  tags: ["Notification Settings"],
  summary: "Upsert notification setting",
  description: "Create or update a notification setting for a specific order status.",
  operationId: "upsertNotificationSetting",
  body: upsertNotificationSettingSchema,
  responses: {
    200: {
      description: "Notification setting updated",
      content: jsonContent(z.object({
        success: z.boolean(),
        data: z.any(),
        message: z.string(),
      })),
    },
  },
  handler: handlers.upsertNotificationSetting,
});

const bulkUpsertRoute = defineRoute({
  method: "put",
  path: "/bulk",
  auth: { scope: SCOPES.MESSAGING_MANAGE },
  tags: ["Notification Settings"],
  summary: "Bulk upsert notification settings",
  description: "Create or update multiple notification settings at once.",
  operationId: "bulkUpsertNotificationSettings",
  body: bulkUpsertNotificationSettingsSchema,
  responses: {
    200: {
      description: "Notification settings updated",
      content: jsonContent(z.object({
        success: z.boolean(),
        data: z.array(z.any()),
        message: z.string(),
      })),
    },
  },
  handler: handlers.bulkUpsertNotificationSettings,
});

const deleteSettingRoute = defineRoute({
  method: "delete",
  path: "/{status}",
  auth: { scope: SCOPES.MESSAGING_MANAGE },
  tags: ["Notification Settings"],
  summary: "Delete notification setting",
  description: "Delete a notification setting for a specific order status.",
  operationId: "deleteNotificationSetting",
  params: z.object({
    status: z.enum(NOTIFICATION_STATUSES).openapi({ description: "Order status" }),
  }),
  responses: {
    200: {
      description: "Setting deleted",
    },
  },
  handler: handlers.deleteNotificationSetting,
});

const router = new OpenAPIHono<AppContext>();

router.openapi(listSettingsRoute.route, listSettingsRoute.handler);
router.openapi(getSettingRoute.route, getSettingRoute.handler);
router.openapi(upsertSettingRoute.route, upsertSettingRoute.handler);
router.openapi(bulkUpsertRoute.route, bulkUpsertRoute.handler);
router.openapi(deleteSettingRoute.route, deleteSettingRoute.handler);

export default router;
