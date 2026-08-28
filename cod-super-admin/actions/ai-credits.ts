"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { requireSuperAdmin } from "@/lib/auth";
import { aiCredits, stores } from "@/db/schema";

export async function listAllAiCredits() {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const rows = await db.select({
    credits: aiCredits,
    store: { id: stores.id, name: stores.name, domain: stores.domain },
  })
    .from(aiCredits)
    .innerJoin(stores, eq(aiCredits.storeId, stores.id))
    .all();

  return rows;
}

export async function allocateCreditsAction(storeId: string, amount: number) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const now = new Date().toISOString();

  const existing = await db.select().from(aiCredits)
    .where(eq(aiCredits.storeId, storeId))
    .get();

  if (existing) {
    await db.update(aiCredits)
      .set({
        totalCredits: existing.totalCredits + amount,
        updatedAt: now,
      })
      .where(eq(aiCredits.storeId, storeId))
      .run();
  } else {
    await db.insert(aiCredits).values({
      id: `aic_${storeId}`,
      storeId,
      totalCredits: amount,
      usedCredits: 0,
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  revalidatePath("/ai-credits");
  return { ok: true as const };
}
