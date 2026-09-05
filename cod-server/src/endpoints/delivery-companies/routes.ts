/**
 * Delivery Companies Routes
 *
 * CRUD endpoints for third-party delivery company management.
 *
 * Migrated to defineRoute() — route definitions below are the single
 * source of truth for validation and the OpenAPI spec. Handlers are
 * unchanged and remain independently mountable/testable.
 */

import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import * as handlers from "./handlers";
import * as webhookHandlers from "./webhook-handlers";
import {
  DeliveryCompanySchema,
  StopDeskSchema,
  SuccessResponseSchema,
  ListResponseSchema,
} from "@/openapi/schemas";

const jsonContent = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});

// ── Route Definitions ─────────────────────────────────────────────────────────

const listRoute = defineRoute({
  method: "get",
  path: "/",
  auth: { scope: SCOPES.DELIVERY_READ },
  tags: ["Delivery Companies"],
  summary: "List delivery companies",
  description: "List all delivery companies with optional filters",
  operationId: "listDeliveryCompanies",
  query: z.object({
    active: z.enum(["true", "false"]).optional().openapi({
      description: "Filter by active status",
      example: "true",
    }),
    search: z.string().optional().openapi({
      description: "Search in company name (EN/AR) and code",
    }),
    limit: z.coerce.number().int().positive().max(100).default(50).openapi({
      description: "Maximum number of results",
      example: 50,
    }),
    offset: z.coerce.number().int().min(0).default(0).openapi({
      description: "Pagination offset",
      example: 0,
    }),
  }),
  responses: {
    200: {
      description: "List of delivery companies",
      content: jsonContent(ListResponseSchema(DeliveryCompanySchema)),
    },
  },
  handler: handlers.listDeliveryCompanies,
});

const getRoute = defineRoute({
  method: "get",
  path: "/{id}",
  auth: { scope: SCOPES.DELIVERY_READ },
  tags: ["Delivery Companies"],
  summary: "Get delivery company",
  description: "Get a single delivery company by ID",
  operationId: "getDeliveryCompany",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  responses: {
    200: {
      description: "Delivery company details",
      content: jsonContent(SuccessResponseSchema(DeliveryCompanySchema)),
    },
  },
  handler: handlers.getDeliveryCompany,
});

const createRoute = defineRoute({
  method: "post",
  path: "/",
  auth: { scope: SCOPES.DELIVERY_READ },
  tags: ["Delivery Companies"],
  summary: "Create delivery company",
  description: "Create a new delivery company integration",
  operationId: "createDeliveryCompany",
  body: z.object({
    name: z.string().min(1).openapi({ example: "Yalidine" }),
    nameAr: z.string().min(1).openapi({ example: "ياليدين" }),
    code: z
      .string()
      .min(1)
      .regex(/^[a-z0-9_]+$/)
      .openapi({ example: "yalidine", description: "Lowercase alphanumeric with underscores" }),
    website: z.string().url().optional().nullable().openapi({ example: "https://www.yalidine.com" }),
    active: z.boolean().default(true).openapi({ example: true }),
    apiEndpoint: z.string().url().optional().nullable().openapi({ example: "https://api.yalidine.app/v1" }),
    apiToken: z.string().optional().nullable().openapi({ description: "API authentication token" }),
    apiUserGuid: z.string().optional().nullable().openapi({ description: "Tenant/user GUID for ZR Express" }),
    supportsHomeDelivery: z.boolean().default(true),
    supportsStopDesk: z.boolean().default(true),
    supportsTracking: z.boolean().default(false),
    autoValidate: z.boolean().optional().openapi({
      description:
        "When true, orders are auto-validated on dispatch (locked at carrier). " +
        "When false, orders stay editable. If omitted, a safe default is derived per provider.",
    }),
    notes: z.string().optional().nullable(),
  }),
  responses: {
    201: {
      description: "Delivery company created",
      content: jsonContent(SuccessResponseSchema(DeliveryCompanySchema)),
    },
    409: { description: "Duplicate company code" },
  },
  handler: handlers.createDeliveryCompany,
});

const updateRoute = defineRoute({
  method: "patch",
  path: "/{id}",
  auth: { scope: SCOPES.DELIVERY_MANAGE },
  tags: ["Delivery Companies"],
  summary: "Update delivery company",
  description: "Update an existing delivery company",
  operationId: "updateDeliveryCompany",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().min(1).optional(),
    code: z
      .string()
      .min(1)
      .regex(/^[a-z0-9_]+$/)
      .optional(),
    website: z.string().url().optional().nullable(),
    active: z.boolean().optional(),
    apiEndpoint: z.string().url().optional().nullable(),
    apiToken: z.string().optional().nullable(),
    apiUserGuid: z.string().optional().nullable(),
    supportsHomeDelivery: z.boolean().optional(),
    supportsStopDesk: z.boolean().optional(),
    supportsTracking: z.boolean().optional(),
    autoValidate: z.boolean().optional(),
    notes: z.string().optional().nullable(),
  }),
  responses: {
    200: {
      description: "Delivery company updated",
      content: jsonContent(SuccessResponseSchema(DeliveryCompanySchema)),
    },
    409: { description: "Duplicate company code" },
  },
  handler: handlers.updateDeliveryCompany,
});

const deleteRoute = defineRoute({
  method: "delete",
  path: "/{id}",
  auth: { scope: SCOPES.DELIVERY_MANAGE },
  tags: ["Delivery Companies"],
  summary: "Delete delivery company",
  description: "Delete a delivery company",
  operationId: "deleteDeliveryCompany",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  responses: {
    200: {
      description: "Delivery company deleted",
      content: jsonContent(z.object({ success: z.boolean() })),
    },
  },
  handler: handlers.deleteDeliveryCompany,
});

const getStopDesksRoute = defineRoute({
  method: "get",
  path: "/{id}/stop-desks",
  auth: { scope: SCOPES.DELIVERY_READ },
  tags: ["Delivery Companies"],
  summary: "Get company stop desks",
  description: "Read stop desks from DB (no live API call). Admin must sync first via POST .../sync-stop-desks",
  operationId: "getCompanyStopDesks",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  query: z.object({
    wilayaId: z.coerce.number().int().optional().openapi({
      description: "Filter by wilaya ID",
      example: 16,
    }),
    activeOnly: z.enum(["true", "false"]).default("true").openapi({
      description: "Filter by active flag (default true)",
      example: "true",
    }),
  }),
  responses: {
    200: {
      description: "Stop desks list",
      content: jsonContent(
        z.object({
          success: z.boolean(),
          data: z.object({
            stopDesks: z.array(StopDeskSchema),
            total: z.number().int(),
            company: z.object({
              id: z.string(),
              name: z.string(),
              code: z.string(),
            }),
          }),
        })
      ),
    },
  },
  handler: handlers.fetchCompanyStopDesks,
});

const syncStopDesksRoute = defineRoute({
  method: "post",
  path: "/{id}/sync-stop-desks",
  auth: { scope: SCOPES.DELIVERY_MANAGE },
  tags: ["Delivery Companies"],
  summary: "Sync stop desks",
  description: "Fetch stop desks from carrier API and upsert into DB. Active flag is preserved.",
  operationId: "syncCompanyStopDesks",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  responses: {
    200: {
      description: "Stop desks synced",
      content: jsonContent(
        z.object({
          success: z.boolean(),
          data: z.object({
            total: z.number().int().openapi({ description: "Total desks upserted", example: 1359 }),
            removed: z.number().int().openapi({ description: "Stale desks removed", example: 3 }),
            syncedAt: z.string().datetime(),
          }),
        })
      ),
    },
    422: {
      description: "Company not connected or provider does not support stop desks",
    },
    502: { description: "External API failure" },
  },
  handler: handlers.syncCompanyStopDesks,
});

const toggleStopDeskRoute = defineRoute({
  method: "patch",
  path: "/{id}/stop-desks/{code}/toggle",
  auth: { scope: SCOPES.DELIVERY_MANAGE },
  tags: ["Delivery Companies"],
  summary: "Toggle stop desk active flag",
  description: "Toggle the active flag on a single stop desk. Admin can deactivate stop desks that can't be serviced.",
  operationId: "toggleCompanyStopDesk",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
    code: z.string().openapi({ description: "Stop desk code", example: "16A" }),
  }),
  responses: {
    200: {
      description: "Stop desk toggled",
      content: jsonContent(
        z.object({
          success: z.boolean(),
          data: z.object({
            code: z.string(),
            active: z.boolean(),
          }),
        })
      ),
    },
  },
  handler: handlers.toggleCompanyStopDesk,
});

const registerWebhookRoute = defineRoute({
  method: "post",
  path: "/{id}/webhook/register",
  auth: { scope: SCOPES.DELIVERY_MANAGE },
  tags: ["Delivery Companies"],
  summary: "Register ZR Express webhook",
  description: "Registers a webhook endpoint with ZR Express via their API. Stores the endpointId and signing secret.",
  operationId: "registerZrWebhook",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  responses: {
    200: {
      description: "Webhook registered",
      content: jsonContent(
        z.object({
          success: z.boolean(),
          webhookUrl: z.string().url().openapi({ example: "https://your-worker.workers.dev/webhooks/zr_express" }),
          endpointId: z.string().openapi({ example: "ep_1234567890" }),
        })
      ),
    },
  },
  handler: webhookHandlers.registerZrWebhook,
});

const unregisterWebhookRoute = defineRoute({
  method: "delete",
  path: "/{id}/webhook/register",
  auth: { scope: SCOPES.DELIVERY_MANAGE },
  tags: ["Delivery Companies"],
  summary: "Unregister ZR Express webhook",
  description: "Deletes the registered webhook endpoint from ZR Express and clears the DB fields.",
  operationId: "unregisterZrWebhook",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  responses: {
    200: {
      description: "Webhook unregistered",
      content: jsonContent(z.object({ success: z.boolean() })),
    },
  },
  handler: webhookHandlers.unregisterZrWebhook,
});

const saveYalidineSecretRoute = defineRoute({
  method: "patch",
  path: "/{id}/webhook/secret",
  auth: { scope: SCOPES.DELIVERY_MANAGE },
  tags: ["Delivery Companies"],
  summary: "Save Yalidine webhook secret",
  description: "Stores the Yalidine webhook secret key (entered manually after setting up webhook in Yalidine dashboard).",
  operationId: "saveYalidineSecret",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  body: z.object({
    secret: z.string().min(1).openapi({ description: "Webhook secret key from Yalidine dashboard" }),
  }),
  responses: {
    200: {
      description: "Secret saved",
      content: jsonContent(z.object({ success: z.boolean() })),
    },
  },
  handler: webhookHandlers.saveYalidineSecret,
});

const saveZrMappingRoute = defineRoute({
  method: "patch",
  path: "/{id}/webhook/mapping",
  auth: { scope: SCOPES.DELIVERY_MANAGE },
  tags: ["Delivery Companies"],
  summary: "Save ZR status mapping",
  description: "Saves the custom ZR state name → our status mapping for this company.",
  operationId: "saveZrStatusMapping",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  body: z.object({
    mapping: z.record(z.string(), z.array(z.string())).openapi({
      description:
        "Keys must be valid our-status strings (new, preparing, assigned, out_for_delivery, delivered, returned, cancelled). " +
        "Values are arrays of ZR state names.",
      example: {
        delivered: ["Livré", "Delivered"],
        returned: ["Retourné", "Returned"],
      },
    }),
  }),
  responses: {
    200: {
      description: "Mapping saved",
      content: jsonContent(z.object({ success: z.boolean() })),
    },
  },
  handler: webhookHandlers.saveZrStatusMapping,
});

const testConnectionRoute = defineRoute({
  method: "post",
  path: "/{id}/test-connection",
  auth: { scope: SCOPES.DELIVERY_READ },
  tags: ["Delivery Companies"],
  summary: "Test connection",
  description: "Verify that stored API credentials are valid by making a lightweight call to the carrier API",
  operationId: "testConnection",
  params: z.object({
    id: z.string().openapi({ description: "Delivery company ID", example: "comp_abc123" }),
  }),
  responses: {
    200: {
      description: "Connection test result",
      content: jsonContent(
        z.object({
          success: z.boolean(),
          data: z.object({
            connected: z.boolean(),
            provider: z.string(),
            message: z.string(),
            latencyMs: z.number().int(),
          }),
        })
      ),
    },
  },
  handler: handlers.testConnection,
});

// ── Router ───────────────────────────────────────────────────────────────────

const deliveryCompaniesRouter = new OpenAPIHono<AppContext>();

deliveryCompaniesRouter.openapi(listRoute.route, listRoute.handler);
deliveryCompaniesRouter.openapi(getRoute.route, getRoute.handler);
deliveryCompaniesRouter.openapi(createRoute.route, createRoute.handler);
deliveryCompaniesRouter.openapi(updateRoute.route, updateRoute.handler);
deliveryCompaniesRouter.openapi(deleteRoute.route, deleteRoute.handler);
deliveryCompaniesRouter.openapi(getStopDesksRoute.route, getStopDesksRoute.handler);
deliveryCompaniesRouter.openapi(syncStopDesksRoute.route, syncStopDesksRoute.handler);
deliveryCompaniesRouter.openapi(toggleStopDeskRoute.route, toggleStopDeskRoute.handler);
deliveryCompaniesRouter.openapi(registerWebhookRoute.route, registerWebhookRoute.handler);
deliveryCompaniesRouter.openapi(unregisterWebhookRoute.route, unregisterWebhookRoute.handler);
deliveryCompaniesRouter.openapi(saveYalidineSecretRoute.route, saveYalidineSecretRoute.handler);
deliveryCompaniesRouter.openapi(saveZrMappingRoute.route, saveZrMappingRoute.handler);
deliveryCompaniesRouter.openapi(testConnectionRoute.route, testConnectionRoute.handler);

export default deliveryCompaniesRouter;
