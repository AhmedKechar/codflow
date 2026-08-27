import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { requireAdmin } from "@/rbac/middleware";
import { getDb } from "@/db";
import * as planQueries from "../../../../cod-shared/queries/plans";
import * as paymentQueries from "../../../../cod-shared/queries/payments";
import * as providerKeyQueries from "../../../../cod-shared/queries/provider-api-keys";
import { NotFoundError } from "@/lib/errors/classes";
import { ErrorResponseSchema } from "@/openapi/schemas";

const jsonContent = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});
const errorResponse = (description: string) => ({
  description,
  content: jsonContent(ErrorResponseSchema),
});

// ─── Plans Management (super admin) ──────────────────────────────────────────

const listAllPlansRoute = createRoute({
  method: "get",
  path: "/plans",
  middleware: [requireAdmin()],
  tags: ["Super Admin - Plans"],
  summary: "List all plans (including inactive)",
  operationId: "listAllPlans",
  responses: {
    200: { description: "All plans" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Admin access required"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const createPlanRoute = createRoute({
  method: "post",
  path: "/plans",
  middleware: [requireAdmin()],
  tags: ["Super Admin - Plans"],
  summary: "Create a new plan",
  operationId: "createPlan",
  request: {
    body: {
      required: true,
      content: jsonContent(z.object({
        id: z.string(),
        name: z.string(),
        nameAr: z.string(),
        nameFr: z.string(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        descriptionFr: z.string().optional(),
        priceDzd: z.number().min(0),
        billingCycle: z.enum(["monthly", "yearly"]).optional(),
        trialDays: z.number().optional(),
        maxOrders: z.number().optional(),
        maxProducts: z.number().optional(),
        maxDrivers: z.number().optional(),
        maxCustomers: z.number().optional(),
        maxTeamMembers: z.number().optional(),
        maxAiCredits: z.number().optional(),
        features: z.string().optional(),
        sortOrder: z.number().optional(),
      })),
    },
  },
  responses: {
    201: { description: "Plan created" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Admin access required"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const updatePlanRoute = createRoute({
  method: "patch",
  path: "/plans/{id}",
  middleware: [requireAdmin()],
  tags: ["Super Admin - Plans"],
  summary: "Update a plan",
  operationId: "updatePlan",
  request: {
    params: z.object({ id: z.string() }),
    body: {
      required: true,
      content: jsonContent(z.object({
        name: z.string().optional(),
        nameAr: z.string().optional(),
        nameFr: z.string().optional(),
        description: z.string().optional(),
        priceDzd: z.number().optional(),
        maxOrders: z.number().optional(),
        maxProducts: z.number().optional(),
        maxDrivers: z.number().optional(),
        maxCustomers: z.number().optional(),
        maxTeamMembers: z.number().optional(),
        maxAiCredits: z.number().optional(),
        isActive: z.boolean().optional(),
      })),
    },
  },
  responses: {
    200: { description: "Plan updated" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Admin access required"),
    404: errorResponse("Plan not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

// ─── Provider API Keys (super admin) ─────────────────────────────────────────

const listProviderKeysRoute = createRoute({
  method: "get",
  path: "/provider-keys",
  middleware: [requireAdmin()],
  tags: ["Super Admin - Provider Keys"],
  summary: "List all provider API keys",
  operationId: "listProviderKeys",
  responses: {
    200: { description: "Provider keys list" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Admin access required"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const createProviderKeyRoute = createRoute({
  method: "post",
  path: "/provider-keys",
  middleware: [requireAdmin()],
  tags: ["Super Admin - Provider Keys"],
  summary: "Create provider API key",
  operationId: "createProviderKey",
  request: {
    body: {
      required: true,
      content: jsonContent(z.object({
        id: z.string(),
        provider: z.string(),
        keyName: z.string(),
        keyValue: z.string(),
        expiresAt: z.string().optional(),
      })),
    },
  },
  responses: {
    201: { description: "Key created" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Admin access required"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const deleteProviderKeyRoute = createRoute({
  method: "delete",
  path: "/provider-keys/{id}",
  middleware: [requireAdmin()],
  tags: ["Super Admin - Provider Keys"],
  summary: "Delete provider API key",
  operationId: "deleteProviderKey",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Key deleted" },
    401: errorResponse("Missing or invalid API key"),
    403: errorResponse("Admin access required"),
    404: errorResponse("Key not found"),
  },
  security: [{ ApiKeyAuth: [] }],
});

const router = new OpenAPIHono<AppContext>();

// Plans
router.openapi(listAllPlansRoute, async (c) => {
  const db = getDb(c.env.DB);
  const data = await planQueries.getAllPlans(db);
  return c.json({ success: true, data, count: data.length }, 200);
});

router.openapi(createPlanRoute, async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json();
  const data = await planQueries.createPlan(db, body);
  return c.json({ success: true, data }, 201);
});

router.openapi(updatePlanRoute, async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const existing = await planQueries.getPlanById(db, id);
  if (!existing) throw new NotFoundError("Plan", id);
  const data = await planQueries.updatePlan(db, id, body);
  return c.json({ success: true, data }, 200);
});

// Provider Keys
router.openapi(listProviderKeysRoute, async (c) => {
  const db = getDb(c.env.DB);
  const data = await providerKeyQueries.getAllProviderKeys(db);
  return c.json({ success: true, data, count: data.length }, 200);
});

router.openapi(createProviderKeyRoute, async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json();
  const data = await providerKeyQueries.createProviderKey(db, body);
  return c.json({ success: true, data }, 201);
});

router.openapi(deleteProviderKeyRoute, async (c) => {
  const db = getDb(c.env.DB);
  const id = c.req.param("id")!;
  const existing = await providerKeyQueries.getProviderKeyById(db, id);
  if (!existing) throw new NotFoundError("Provider Key", id);
  await providerKeyQueries.deleteProviderKey(db, id);
  return c.json({ success: true }, 200);
});

export default router;
