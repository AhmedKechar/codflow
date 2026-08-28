import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { defineRoute } from "@/lib/route-builder";
import * as h from "./handlers";
import { createDiscountCodeSchema, updateDiscountCodeSchema } from "./validation";

const idParams = z.object({
  id: z.string().openapi({ description: "Discount Code UUID", example: "dc_abc123" }),
});

const listDiscountCodesRoute = defineRoute({
  method: "get",
  path: "/",
  auth: { scope: SCOPES.DISCOUNTS_READ },
  tags: ["Discount Codes"],
  summary: "List discount codes",
  description: "Get all discount codes for the store, ordered by creation date (newest first).",
  operationId: "listDiscountCodes",
  handler: h.listDiscountCodes,
});

const getDiscountCodeRoute = defineRoute({
  method: "get",
  path: "/{id}",
  auth: { scope: SCOPES.DISCOUNTS_READ },
  tags: ["Discount Codes"],
  summary: "Get discount code",
  description: "Get a single discount code by ID.",
  operationId: "getDiscountCode",
  params: idParams,
  handler: h.getDiscountCode,
});

const createDiscountCodeRoute = defineRoute({
  method: "post",
  path: "/",
  auth: { scope: SCOPES.DISCOUNTS_MANAGE },
  tags: ["Discount Codes"],
  summary: "Create discount code",
  description: "Create a new discount code for the store.",
  operationId: "createDiscountCode",
  body: createDiscountCodeSchema,
  handler: h.createDiscountCode,
});

const updateDiscountCodeRoute = defineRoute({
  method: "patch",
  path: "/{id}",
  auth: { scope: SCOPES.DISCOUNTS_MANAGE },
  tags: ["Discount Codes"],
  summary: "Update discount code",
  description: "Partially update a discount code. All fields are optional.",
  operationId: "updateDiscountCode",
  params: idParams,
  body: updateDiscountCodeSchema,
  handler: h.updateDiscountCode,
});

const deleteDiscountCodeRoute = defineRoute({
  method: "delete",
  path: "/{id}",
  auth: { scope: SCOPES.DISCOUNTS_MANAGE },
  tags: ["Discount Codes"],
  summary: "Delete discount code",
  description: "Permanently delete a discount code.",
  operationId: "deleteDiscountCode",
  params: idParams,
  handler: h.deleteDiscountCode,
});

const router = new OpenAPIHono<AppContext>();

router.openapi(listDiscountCodesRoute.route, listDiscountCodesRoute.handler);
router.openapi(getDiscountCodeRoute.route, getDiscountCodeRoute.handler);
router.openapi(createDiscountCodeRoute.route, createDiscountCodeRoute.handler);
router.openapi(updateDiscountCodeRoute.route, updateDiscountCodeRoute.handler);
router.openapi(deleteDiscountCodeRoute.route, deleteDiscountCodeRoute.handler);

export default router;
