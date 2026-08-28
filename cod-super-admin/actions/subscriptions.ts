"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { requireSuperAdmin } from "@/lib/auth";
import { getAllSubscriptions, cancelSubscription } from "../../cod-shared/queries/subscriptions";

export async function listAllSubscriptions() {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  return getAllSubscriptions(db);
}

export async function cancelSubscriptionAction(subscriptionId: string) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const result = await cancelSubscription(db, subscriptionId);

  revalidatePath("/subscriptions");
  return { ok: true as const, data: result };
}
