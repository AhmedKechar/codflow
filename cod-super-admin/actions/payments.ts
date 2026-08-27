"use server";

import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { getUser, requireSuperAdmin } from "@/lib/auth";
import { stores } from "@/db/schema";
import {
  getPendingPayments,
  approvePayment,
  rejectPayment,
} from "../../cod-shared/queries/payments";

export async function listPendingPayments() {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const payments = await getPendingPayments(db);

  const storeIds = [...new Set(payments.map((p) => p.storeId))];
  let storeMap = new Map<string, { name: string; domain: string | null }>();
  if (storeIds.length > 0) {
    const rows = await db
      .select({ id: stores.id, name: stores.name, domain: stores.domain })
      .from(stores)
      .where(inArray(stores.id, storeIds))
      .all();
    storeMap = new Map(rows.map((r) => [r.id, { name: r.name, domain: r.domain }]));
  }

  return payments.map((p) => ({
    ...p,
    storeName: storeMap.get(p.storeId)?.name ?? p.storeId,
    storeDomain: storeMap.get(p.storeId)?.domain ?? null,
  }));
}

export async function approvePaymentAction(paymentId: string, notes?: string) {
  await requireSuperAdmin();
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const payment = await approvePayment(db, paymentId, user.id, notes);
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { ok: true as const, data: payment };
}

export async function rejectPaymentAction(paymentId: string, notes?: string) {
  await requireSuperAdmin();
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const payment = await rejectPayment(db, paymentId, user.id, notes);
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { ok: true as const, data: payment };
}
