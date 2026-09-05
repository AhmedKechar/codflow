import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import * as h from "./handlers";

const chatRoute = defineRoute({
  method: "post",
  path: "/",
  auth: { scope: SCOPES.AI_CREDITS_READ },
  tags: ["AI Chat"],
  summary: "Send a chat message and stream the AI response",
  operationId: "chat",
  body: z.object({
    messages: z.array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    ),
  }),
  handler: h.handleChat,
});

const router = new OpenAPIHono<AppContext>();
router.openapi(chatRoute.route, chatRoute.handler);
export default router;
