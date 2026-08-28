"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { requirePermission, getUserStoreId } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import {
  listCustomDomains,
  getCustomDomainById,
  createCustomDomain,
  updateCustomDomain,
  deleteCustomDomain,
  verifyCustomDomain,
} from "@/../cod-shared/queries/custom-domains";

/// <reference path="../cloudflare-env.d.ts" />

export interface CustomDomain {
  id: string;
  storeId: string;
  domain: string;
  status: "pending" | "verifying" | "active" | "failed" | "expired";
  sslStatus: "pending" | "active" | "failed";
  verificationToken: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getCustomDomains(): Promise<{
  rows: CustomDomain[];
  total: number;
}> {
  await requirePermission(SCOPES.CUSTOM_DOMAINS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const rows = await listCustomDomains(db, await getUserStoreId());
  return { rows: rows as unknown as CustomDomain[], total: rows.length };
}

export async function addCustomDomain(data: {
  domain: string;
}): Promise<{ success: boolean; data?: CustomDomain; error?: string }> {
  await requirePermission(SCOPES.CUSTOM_DOMAINS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  try {
    const result = await createCustomDomain(db, await getUserStoreId(), data);
    const domain = await getCustomDomainById(db, await getUserStoreId(), result.id);
    revalidatePath("/store/domains");
    return { success: true, data: domain as unknown as CustomDomain };
  } catch (error) {
    console.error("[Custom Domains Action Error]", error);
    return { success: false, error: "Failed to add custom domain" };
  }
}

export async function updateCustomDomainAction(
  id: string,
  data: Partial<{ domain: string }>,
): Promise<{ success: boolean; error?: string }> {
  await requirePermission(SCOPES.CUSTOM_DOMAINS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  try {
    await updateCustomDomain(db, await getUserStoreId(), id, data);
    revalidatePath("/store/domains");
    return { success: true };
  } catch (error) {
    console.error("[Custom Domains Action Error]", error);
    return { success: false, error: "Failed to update custom domain" };
  }
}

export async function deleteCustomDomainAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requirePermission(SCOPES.CUSTOM_DOMAINS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  try {
    await deleteCustomDomain(db, await getUserStoreId(), id);
    revalidatePath("/store/domains");
    return { success: true };
  } catch (error) {
    console.error("[Custom Domains Action Error]", error);
    return { success: false, error: "Failed to delete custom domain" };
  }
}

export async function verifyCustomDomainAction(
  id: string,
): Promise<{ success: boolean; data?: CustomDomain; error?: string }> {
  await requirePermission(SCOPES.CUSTOM_DOMAINS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  try {
    const result = await verifyCustomDomain(db, await getUserStoreId(), id);
    revalidatePath("/store/domains");
    return { success: true, data: result as unknown as CustomDomain };
  } catch (error) {
    console.error("[Custom Domains Action Error]", error);
    return { success: false, error: "Failed to verify custom domain" };
  }
}
