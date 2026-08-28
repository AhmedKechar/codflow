import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { defineRoute } from "@/lib/route-builder";
import * as h from "./handlers";
import {
  createCustomDomainSchema,
  updateCustomDomainSchema,
} from "./validation";

const idParams = z.object({
  id: z
    .string()
    .openapi({ description: "Custom Domain UUID", example: "cd_abc123" }),
});

const listCustomDomainsRoute = defineRoute({
  method: "get",
  path: "/",
  auth: { scope: SCOPES.CUSTOM_DOMAINS_READ },
  tags: ["Custom Domains"],
  summary: "List custom domains",
  description: "Get all custom domains for the store, ordered by creation date (newest first).",
  operationId: "listCustomDomains",
  handler: h.listCustomDomains,
});

const getCustomDomainRoute = defineRoute({
  method: "get",
  path: "/{id}",
  auth: { scope: SCOPES.CUSTOM_DOMAINS_READ },
  tags: ["Custom Domains"],
  summary: "Get custom domain",
  description: "Get a single custom domain by ID.",
  operationId: "getCustomDomain",
  params: idParams,
  handler: h.getCustomDomain,
});

const createCustomDomainRoute = defineRoute({
  method: "post",
  path: "/",
  auth: { scope: SCOPES.CUSTOM_DOMAINS_MANAGE },
  tags: ["Custom Domains"],
  summary: "Add custom domain",
  description: "Add a new custom domain for the store.",
  operationId: "createCustomDomain",
  body: createCustomDomainSchema,
  handler: h.createCustomDomain,
});

const updateCustomDomainRoute = defineRoute({
  method: "patch",
  path: "/{id}",
  auth: { scope: SCOPES.CUSTOM_DOMAINS_MANAGE },
  tags: ["Custom Domains"],
  summary: "Update custom domain",
  description: "Partially update a custom domain. All fields are optional.",
  operationId: "updateCustomDomain",
  params: idParams,
  body: updateCustomDomainSchema,
  handler: h.updateCustomDomain,
});

const deleteCustomDomainRoute = defineRoute({
  method: "delete",
  path: "/{id}",
  auth: { scope: SCOPES.CUSTOM_DOMAINS_MANAGE },
  tags: ["Custom Domains"],
  summary: "Delete custom domain",
  description: "Permanently delete a custom domain.",
  operationId: "deleteCustomDomain",
  params: idParams,
  handler: h.deleteCustomDomain,
});

const verifyCustomDomainRoute = defineRoute({
  method: "post",
  path: "/{id}/verify",
  auth: { scope: SCOPES.CUSTOM_DOMAINS_MANAGE },
  tags: ["Custom Domains"],
  summary: "Verify custom domain",
  description: "Trigger verification for a custom domain. Mock verification returns success after a short delay.",
  operationId: "verifyCustomDomain",
  params: idParams,
  handler: h.verifyCustomDomain,
});

const router = new OpenAPIHono<AppContext>();

router.openapi(listCustomDomainsRoute.route, listCustomDomainsRoute.handler);
router.openapi(getCustomDomainRoute.route, getCustomDomainRoute.handler);
router.openapi(createCustomDomainRoute.route, createCustomDomainRoute.handler);
router.openapi(updateCustomDomainRoute.route, updateCustomDomainRoute.handler);
router.openapi(deleteCustomDomainRoute.route, deleteCustomDomainRoute.handler);
router.openapi(verifyCustomDomainRoute.route, verifyCustomDomainRoute.handler);

export default router;
