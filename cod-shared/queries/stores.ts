import { eq } from "drizzle-orm";
import { stores } from "../db/schema";
import type { AppDb } from "../db/client";

type StoreInsert = typeof stores.$inferInsert;
type StoreUpdate = Partial<StoreInsert>;

export async function createStore(db: AppDb, data: {
  id: string;
  name: string;
  domain?: string;
  status?: "active" | "inactive";
}) {
  const now = new Date().toISOString();
  return db.insert(stores).values({
    id: data.id,
    name: data.name,
    domain: data.domain ?? null,
    status: data.status ?? "active",
    createdAt: now,
    updatedAt: now,
  }).returning().get();
}

export async function getStore(db: AppDb, storeId: string) {
  return db.select().from(stores).where(eq(stores.id, storeId)).get();
}

export async function updateStore(db: AppDb, storeId: string, data: StoreUpdate) {
  const now = new Date().toISOString();
  await db
    .update(stores)
    .set({ ...data, updatedAt: now })
    .where(eq(stores.id, storeId))
    .run();
  return db.select().from(stores).where(eq(stores.id, storeId)).get();
}
