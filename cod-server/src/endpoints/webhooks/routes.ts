/**
 * Webhook Routes
 *
 * Public router — NO auth middleware anywhere in this file.
 * Authentication is handled internally by each handler via signature
 * verification (Svix HMAC-SHA256 for ZR Express).
 *
 * Mount order in index.ts:
 *   app.route("/webhooks", webhooksRouter)  ← BEFORE app.use("/api/*", authMiddleware)
 *
 * Migrated to defineRoute() from @/lib/route-builder — route definitions below
 * are the single source of truth for validation and the OpenAPI spec.
 * Handlers enforce their own specific error codes.
 */

import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import {
  handleYalidineChallenge,
  handleYalidineWebhook,
  handleZrWebhook,
} from "./handlers";

const jsonContent = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});

const receivedResponse = {
  description: "Event received (always 200 — carriers retry on non-200)",
  content: jsonContent(
    z.object({
      received: z.boolean().openapi({ example: true }),
    })
  ),
};

const errorSchema = z.object({
  error: z.string(),
  code: z.string().openapi({ example: "INVALID_WEBHOOK_PAYLOAD" }),
  category: z.string().openapi({ example: "VALIDATION" }),
  context: z.record(z.string(), z.unknown()).optional(),
});

const yalidineChallengeRoute = defineRoute({
  method: "get",
  path: "/yalidine",
  auth: "none",
  tags: ["Webhooks"],
  summary: "Yalidine CRC challenge",
  description:
    "Yalidine sends a GET request with ?subscribe=…&crc_token=<value> to validate the endpoint " +
    "at creation, edit, and periodically. The endpoint echoes the crc_token as plain text. " +
    "If this fails, Yalidine disables the webhook automatically.",
  operationId: "yalidineChallenge",
  query: z.object({
    subscribe: z.string().optional().openapi({
      description: "Sent by Yalidine to initiate the CRC challenge",
    }),
    crc_token: z.string().optional().openapi({
      description: "Token echoed back in the (plain-text) response body",
    }),
  }),
  responses: {
    200: {
      description: "CRC token echoed as plain text",
      content: {
        "text/plain": {
          schema: z.string().openapi({ example: "abc123token" }),
        },
      },
    },
  },
  handler: handleYalidineChallenge as never,
});

const yalidineWebhookRoute = defineRoute({
  method: "post",
  path: "/yalidine",
  auth: "none",
  tags: ["Webhooks"],
  summary: "Yalidine event delivery",
  description: `Receives webhook event batches from Yalidine. One event type per request, multiple events per batch. Each event carries its own idempotency key (\`event_id\`). Always returns 200 — errors are logged internally.

**Payload:** \`{ type: "parcel_created" | "parcel_edited" | "parcel_deleted" | "parcel_status_updated" | "parcel_payment_updated", events: [{ event_id, occurred_at, data }] }\`

Invalid payloads are rejected with \`400 INVALID_WEBHOOK_PAYLOAD\`; processing failures surface as \`502 EXTERNAL_API_FAILURE\`.`,
  operationId: "yalidineWebhook",
  responses: {
    200: receivedResponse,
    400: {
      description: "Invalid webhook payload (INVALID_WEBHOOK_PAYLOAD)",
      content: jsonContent(errorSchema),
    },
    502: {
      description: "Webhook processing failed (EXTERNAL_API_FAILURE)",
      content: jsonContent(
        errorSchema.extend({
          code: z.string().openapi({ example: "EXTERNAL_API_FAILURE" }),
          category: z.string().openapi({ example: "SYSTEM" }),
        })
      ),
    },
  },
  handler: handleYalidineWebhook,
});

const zrWebhookRoute = defineRoute({
  method: "post",
  path: "/zr_express",
  auth: "none",
  tags: ["Webhooks"],
  summary: "ZR Express event delivery",
  description: `Receives webhook events from ZR Express via Svix. Signature is verified using HMAC-SHA256 with the stored whsec_ secret over the RAW request bytes. Idempotency key is the \`svix-id\` header. Always returns 200.

**Payload:** \`{ eventType: "parcel.state.updated" | "parcel.state.situation.created" | "parcel.isReturn.updated", occurredAt, data: ParcelWebhookDto }\`

Signature/payload failures are rejected with \`400 INVALID_WEBHOOK_PAYLOAD\`; processing failures surface as \`502 EXTERNAL_API_FAILURE\`.`,
  operationId: "zrExpressWebhook",
  headers: z.object({
    "svix-id": z.string().openapi({ description: "Svix idempotency key" }),
    "svix-timestamp": z.string().openapi({ description: "Svix signed timestamp" }),
    "svix-signature": z.string().openapi({ description: "Svix HMAC-SHA256 signature" }),
  }),
  responses: {
    200: receivedResponse,
    400: {
      description: "Invalid webhook payload or signature (INVALID_WEBHOOK_PAYLOAD)",
      content: jsonContent(errorSchema),
    },
    502: {
      description: "Webhook processing failed (EXTERNAL_API_FAILURE)",
      content: jsonContent(
        errorSchema.extend({
          code: z.string().openapi({ example: "EXTERNAL_API_FAILURE" }),
          category: z.string().openapi({ example: "SYSTEM" }),
        })
      ),
    },
  },
  handler: handleZrWebhook,
});

const webhooksRouter = new OpenAPIHono<AppContext>();

webhooksRouter.openapi(yalidineChallengeRoute.route, yalidineChallengeRoute.handler);
webhooksRouter.openapi(yalidineWebhookRoute.route, yalidineWebhookRoute.handler);
webhooksRouter.openapi(zrWebhookRoute.route, zrWebhookRoute.handler);

export default webhooksRouter;
