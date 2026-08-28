import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import * as handlers from "./handlers";

const jsonContent = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});

const listMessagesRoute = defineRoute({
  method: "get",
  path: "/messages",
  auth: { scope: SCOPES.MESSAGING_READ },
  tags: ["SMS"],
  summary: "List SMS messages",
  description: "Get all SMS messages for the store with optional filters.",
  operationId: "listSmsMessages",
  query: z.object({
    messageType: z.enum(["order_update", "marketing", "support", "automated"]).optional(),
    status: z.enum(["pending", "sent", "delivered", "failed"]).optional(),
    orderId: z.string().optional(),
    customerId: z.string().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),
  responses: {
    200: {
      description: "List of SMS messages",
      content: jsonContent(z.object({
        success: z.boolean(),
        data: z.array(z.any()),
        count: z.number(),
      })),
    },
  },
  handler: handlers.listMessages,
});

const sendMessageRoute = defineRoute({
  method: "post",
  path: "/send",
  auth: { scope: SCOPES.MESSAGING_SEND },
  tags: ["SMS"],
  summary: "Send SMS message",
  description: "Send an SMS message to a phone number. Creates a message record and sends via SMS provider.",
  operationId: "sendSmsMessage",
  body: z.object({
    phoneNumber: z.string().min(1).openapi({ description: "Recipient phone number" }),
    messageType: z.enum(["order_update", "marketing", "support", "automated"]).openapi({ description: "Message type" }),
    content: z.string().optional().openapi({ description: "Message content (auto-generated from template if omitted)" }),
    orderId: z.string().optional().openapi({ description: "Associated order ID" }),
    customerId: z.string().optional().openapi({ description: "Associated customer ID" }),
    templateData: z.record(z.string(), z.string()).optional().openapi({ description: "Template variables for auto-generated content" }),
  }),
  responses: {
    201: {
      description: "Message sent successfully",
      content: jsonContent(z.object({
        success: z.boolean(),
        data: z.object({
          id: z.string(),
          status: z.string(),
          messageId: z.string().optional(),
        }),
        message: z.string(),
      })),
    },
  },
  handler: handlers.sendMessage,
});

const router = new OpenAPIHono<AppContext>();

router.openapi(listMessagesRoute.route, listMessagesRoute.handler);
router.openapi(sendMessageRoute.route, sendMessageRoute.handler);

export default router;
