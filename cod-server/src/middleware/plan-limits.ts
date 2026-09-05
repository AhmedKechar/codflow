/**
 * Plan Limits Middleware
 *
 * Checks if a store has exceeded its subscription plan limits
 * before allowing create/mutation operations.
 * Denormalized: reads plan limits + counts current usage.
 */

import { Context, Next } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { subscriptions, plans, orders, products, drivers, customers, storeMembers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

type Resource = "orders" | "products" | "drivers" | "customers" | "team_members";

const TABLE_MAP: Record<Resource, any> = {
  orders,
  products,
  drivers,
  customers,
  team_members: storeMembers,
};

const LIMIT_FIELD_MAP: Record<Resource, keyof typeof plans.$inferInsert> = {
  orders: "maxOrders",
  products: "maxProducts",
  drivers: "maxDrivers",
  customers: "maxCustomers",
  team_members: "maxTeamMembers",
};

/**
 * Middleware factory: enforces plan limit for a given resource.
 * Apply to POST/create endpoints only.
 */
export function requireWithinPlanLimit(resource: Resource) {
  return async (c: Context<AppContext>, next: Next) => {
    const storeId = c.get("storeId");
    if (!storeId) return next();

    const user = c.get("user");
    if (user?.role === "admin") return next();

    try {
      const db = getDb(c.env.DB);

      const sub = await db.select({ planId: subscriptions.planId })
        .from(subscriptions)
        .where(and(
          eq(subscriptions.storeId, storeId),
          sql`${subscriptions.status} IN ('active', 'trialing')`
        ))
        .limit(1)
        .get();

      if (!sub) return next();

      const plan = await db.select().from(plans).where(eq(plans.id, sub.planId)).get();
      if (!plan) return next();

      const limitValue = plan[LIMIT_FIELD_MAP[resource]] as number;
      if (limitValue === -1) return next();

      const table = TABLE_MAP[resource];
      const storeIdCol = resource === "team_members" ? storeMembers.storeId : table.storeId;
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(table)
        .where(eq(storeIdCol, storeId))
        .get();

      const current = countResult?.count ?? 0;

      if (current >= limitValue) {
        return c.json({
          error: `Plan limit reached for ${resource}`,
          code: "PLAN_LIMIT_EXCEEDED",
          detail: { resource, current, limit: limitValue, plan: plan.name },
          upgradeUrl: "/billing",
        }, 403);
      }

      await next();
    } catch (err) {
      console.error("[plan-limits] Error:", err);
      // Fail-closed: reject request on error to prevent plan limit bypass
      return c.json({
        error: "Plan limit check failed",
        code: "PLAN_LIMIT_CHECK_FAILED",
      }, 500);
    }
  };
}
