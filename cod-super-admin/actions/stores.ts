"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { requireSuperAdmin } from "@/lib/auth";
import { stores, subscriptions, plans } from "@/db/schema";

export async function listStores() {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const rows = await db
    .select({
      store: stores,
      plan: plans,
    })
    .from(stores)
    .leftJoin(
      subscriptions,
      and(
        eq(subscriptions.storeId, stores.id),
        sql`${subscriptions.status} IN ('active', 'trialing', 'past_due')`
      )
    )
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .orderBy(desc(stores.createdAt))
    .all();

  return rows;
}
