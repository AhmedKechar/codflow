import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { defineRoute } from "@/lib/route-builder";
import * as h from "./handlers";
import { createGiftCardSchema, updateGiftCardSchema } from "./validation";

const idParams = z.object({
  id: z.string().openapi({ description: "Gift Card UUID", example: "gc_abc123" }),
});

const listGiftCardsRoute = defineRoute({
  method: "get",
  path: "/",
  auth: { scope: SCOPES.GIFT_CARDS_READ },
  tags: ["Gift Cards"],
  summary: "List gift cards",
  description: "Get all gift cards for the store, ordered by creation date (newest first).",
  operationId: "listGiftCards",
  handler: h.listGiftCards,
});

const getGiftCardRoute = defineRoute({
  method: "get",
  path: "/{id}",
  auth: { scope: SCOPES.GIFT_CARDS_READ },
  tags: ["Gift Cards"],
  summary: "Get gift card",
  description: "Get a single gift card by ID.",
  operationId: "getGiftCard",
  params: idParams,
  handler: h.getGiftCard,
});

const createGiftCardRoute = defineRoute({
  method: "post",
  path: "/",
  auth: { scope: SCOPES.GIFT_CARDS_MANAGE },
  tags: ["Gift Cards"],
  summary: "Create gift card",
  description: "Create a new gift card for the store. Code is auto-generated if not provided.",
  operationId: "createGiftCard",
  body: createGiftCardSchema,
  handler: h.createGiftCard,
});

const updateGiftCardRoute = defineRoute({
  method: "patch",
  path: "/{id}",
  auth: { scope: SCOPES.GIFT_CARDS_MANAGE },
  tags: ["Gift Cards"],
  summary: "Update gift card",
  description: "Partially update a gift card. All fields are optional.",
  operationId: "updateGiftCard",
  params: idParams,
  body: updateGiftCardSchema,
  handler: h.updateGiftCard,
});

const deleteGiftCardRoute = defineRoute({
  method: "delete",
  path: "/{id}",
  auth: { scope: SCOPES.GIFT_CARDS_MANAGE },
  tags: ["Gift Cards"],
  summary: "Delete gift card",
  description: "Permanently delete a gift card.",
  operationId: "deleteGiftCard",
  params: idParams,
  handler: h.deleteGiftCard,
});

const router = new OpenAPIHono<AppContext>();

router.openapi(listGiftCardsRoute.route, listGiftCardsRoute.handler);
router.openapi(getGiftCardRoute.route, getGiftCardRoute.handler);
router.openapi(createGiftCardRoute.route, createGiftCardRoute.handler);
router.openapi(updateGiftCardRoute.route, updateGiftCardRoute.handler);
router.openapi(deleteGiftCardRoute.route, deleteGiftCardRoute.handler);

export default router;
