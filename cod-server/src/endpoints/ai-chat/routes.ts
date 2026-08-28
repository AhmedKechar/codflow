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

const chatRoute = createRoute({
  method: "post",
  path: "/",
  middleware: [requireScope(SCOPES.AI_CREDITS_READ)],
  tags: ["AI Chat"],
  summary: "Send a chat message and stream the AI response",
  operationId: "chat",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            messages: z.array(
              z.object({
                role: z.enum(["user", "assistant", "system"]),
                content: z.string(),
              }),
            ),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "SSE stream of AI response chunks" },
    400: errorResponse("Invalid request body"),
    402: errorResponse("Insufficient AI credits"),
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Insufficient scope"),
    500: errorResponse("AI service not configured"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const router = new OpenAPIHono<AppContext>();
router.openapi(chatRoute, h.handleChat);
export default router;
