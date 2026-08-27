import { eq } from "drizzle-orm";
import { stores } from "../db/schema";
import type { AppDb } from "../db/client";

type StoreUpdate = Partial<typeof stores.$inferInsert>;

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
