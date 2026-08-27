"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { requireSuperAdmin } from "@/lib/auth";
import {
  getAllProviderKeys,
  createProviderKey,
  updateProviderKey,
  deleteProviderKey,
} from "../../cod-shared/queries/provider-api-keys";

export async function listProviderKeys() {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  return getAllProviderKeys(db);
}

export interface ProviderKeyInput {
  provider: string;
  keyName: string;
  keyValue: string;
  expiresAt?: string | null;
}

export async function createProviderKeyAction(data: ProviderKeyInput) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const key = await createProviderKey(db, {
    id: randomUUID(),
    provider: data.provider,
    keyName: data.keyName,
    keyValue: data.keyValue,
    expiresAt: data.expiresAt ?? null,
  });

  revalidatePath("/provider-keys");
  return { ok: true as const, data: key };
}

export async function toggleProviderKeyAction(keyId: string, isActive: boolean) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const key = await updateProviderKey(db, keyId, { isActive });
  revalidatePath("/provider-keys");
  return { ok: true as const, data: key };
}

export async function deleteProviderKeyAction(keyId: string) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const key = await deleteProviderKey(db, keyId);
  revalidatePath("/provider-keys");
  return { ok: true as const, data: key };
}
