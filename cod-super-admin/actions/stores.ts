"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
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

export async function createStoreAction(data: { name: string; domain?: string; status?: "active" | "inactive" }) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const store = await db.insert(stores).values({
    id: randomUUID(),
    name: data.name,
    domain: data.domain ?? null,
    status: data.status ?? "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning().get();

  revalidatePath("/stores");
  return { ok: true as const, data: store };
}

export async function updateStoreAction(storeId: string, data: { name?: string; domain?: string; status?: "active" | "inactive" }) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const store = await db.update(stores)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(stores.id, storeId))
    .returning()
    .get();

  revalidatePath("/stores");
  return { ok: true as const, data: store };
}

export async function deleteStoreAction(storeId: string) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  await db.delete(stores).where(eq(stores.id, storeId)).run();

  revalidatePath("/stores");
  return { ok: true as const };
}
