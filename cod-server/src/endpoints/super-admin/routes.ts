import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import { getDb } from "@/db";
import * as planQueries from "../../../../cod-shared/queries/plans";
import * as providerKeyQueries from "../../../../cod-shared/queries/provider-api-keys";
import { NotFoundError } from "@/lib/errors/classes";

// ─── Plans Management (super admin) ──────────────────────────────────────────

const listAllPlansRoute = defineRoute({
  method: "get",
  path: "/plans",
  auth: "super-admin",
  tags: ["Super Admin - Plans"],
  summary: "List all plans (including inactive)",
  operationId: "listAllPlans",
  handler: async (c) => {
    const db = getDb(c.env.DB);
    const data = await planQueries.getAllPlans(db);
    return c.json({ success: true, data, count: data.length }, 200);
  },
});

const createPlanRoute = defineRoute({
  method: "post",
  path: "/plans",
  auth: "super-admin",
  tags: ["Super Admin - Plans"],
  summary: "Create a new plan",
  operationId: "createPlan",
  body: z.object({
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
  }),
  handler: async (c) => {
    const db = getDb(c.env.DB);
    const body = await c.req.json();
    const data = await planQueries.createPlan(db, body);
    return c.json({ success: true, data }, 201);
  },
});

const updatePlanRoute = defineRoute({
  method: "patch",
  path: "/plans/{id}",
  auth: "super-admin",
  tags: ["Super Admin - Plans"],
  summary: "Update a plan",
  operationId: "updatePlan",
  params: z.object({ id: z.string() }),
  body: z.object({
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
  }),
  handler: async (c) => {
    const db = getDb(c.env.DB);
    const id = c.req.param("id")!;
    const body = await c.req.json();
    const existing = await planQueries.getPlanById(db, id);
    if (!existing) throw new NotFoundError("Plan", id);
    const data = await planQueries.updatePlan(db, id, body);
    return c.json({ success: true, data }, 200);
  },
});

// ─── Provider API Keys (super admin) ─────────────────────────────────────────

const listProviderKeysRoute = defineRoute({
  method: "get",
  path: "/provider-keys",
  auth: "super-admin",
  tags: ["Super Admin - Provider Keys"],
  summary: "List all provider API keys",
  operationId: "listProviderKeys",
  handler: async (c) => {
    const db = getDb(c.env.DB);
    const data = await providerKeyQueries.getAllProviderKeys(db);
    return c.json({ success: true, data, count: data.length }, 200);
  },
});

const createProviderKeyRoute = defineRoute({
  method: "post",
  path: "/provider-keys",
  auth: "super-admin",
  tags: ["Super Admin - Provider Keys"],
  summary: "Create provider API key",
  operationId: "createProviderKey",
  body: z.object({
    id: z.string(),
    provider: z.string(),
    keyName: z.string(),
    keyValue: z.string(),
    expiresAt: z.string().optional(),
  }),
  handler: async (c) => {
    const db = getDb(c.env.DB);
    const body = await c.req.json();
    const data = await providerKeyQueries.createProviderKey(db, body);
    return c.json({ success: true, data }, 201);
  },
});

const deleteProviderKeyRoute = defineRoute({
  method: "delete",
  path: "/provider-keys/{id}",
  auth: "super-admin",
  tags: ["Super Admin - Provider Keys"],
  summary: "Delete provider API key",
  operationId: "deleteProviderKey",
  params: z.object({ id: z.string() }),
  handler: async (c) => {
    const db = getDb(c.env.DB);
    const id = c.req.param("id")!;
    const existing = await providerKeyQueries.getProviderKeyById(db, id);
    if (!existing) throw new NotFoundError("Provider Key", id);
    await providerKeyQueries.deleteProviderKey(db, id);
    return c.json({ success: true }, 200);
  },
});

const router = new OpenAPIHono<AppContext>();

// Plans
router.openapi(listAllPlansRoute.route, listAllPlansRoute.handler);
router.openapi(createPlanRoute.route, createPlanRoute.handler);
router.openapi(updatePlanRoute.route, updatePlanRoute.handler);

// Provider Keys
router.openapi(listProviderKeysRoute.route, listProviderKeysRoute.handler);
router.openapi(createProviderKeyRoute.route, createProviderKeyRoute.handler);
router.openapi(deleteProviderKeyRoute.route, deleteProviderKeyRoute.handler);

export default router;
