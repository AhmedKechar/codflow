"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { requirePermission, getUserStoreId } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import {
  listDiscountCodes,
  getDiscountCodeById,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from "@/../cod-shared/queries/discount-codes";
import type { DiscountCodeFilters } from "@/../cod-shared/queries/discount-codes";

export interface DiscountCode {
  id: string;
  storeId: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  status: "active" | "inactive" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountCodeData {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  status: "active" | "inactive";
}

export async function getDiscountCodes(filters?: DiscountCodeFilters): Promise<DiscountCode[]> {
  await requirePermission(SCOPES.DISCOUNTS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  return listDiscountCodes(db, storeId, filters) as Promise<DiscountCode[]>;
}

export async function getDiscountCode(id: string): Promise<DiscountCode | null> {
  await requirePermission(SCOPES.DISCOUNTS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();
  return getDiscountCodeById(db, storeId, id) as Promise<DiscountCode | null>;
}

export async function createDiscountCodeAction(data: CreateDiscountCodeData): Promise<{ id: string }> {
  await requirePermission(SCOPES.DISCOUNTS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();

  const result = await createDiscountCode(db, storeId, {
    code: data.code.toUpperCase(),
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount ?? null,
    maxUses: data.maxUses ?? null,
    startsAt: data.startsAt ?? null,
    expiresAt: data.expiresAt ?? null,
    status: data.status,
  });

  revalidatePath("/discounts");
  return result;
}

export async function updateDiscountCodeAction(
  id: string,
  data: Partial<CreateDiscountCodeData>
): Promise<void> {
  await requirePermission(SCOPES.DISCOUNTS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();

  await updateDiscountCode(db, storeId, id, {
    ...(data.code !== undefined && { code: data.code.toUpperCase() }),
    ...(data.type !== undefined && { type: data.type }),
    ...(data.value !== undefined && { value: data.value }),
    ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount ?? null }),
    ...(data.maxUses !== undefined && { maxUses: data.maxUses ?? null }),
    ...(data.startsAt !== undefined && { startsAt: data.startsAt ?? null }),
    ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ?? null }),
    ...(data.status !== undefined && { status: data.status }),
  });

  revalidatePath("/discounts");
  revalidatePath(`/discounts/${id}/edit`);
}

export async function deleteDiscountCodeAction(id: string): Promise<void> {
  await requirePermission(SCOPES.DISCOUNTS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const storeId = await getUserStoreId();

  await deleteDiscountCode(db, storeId, id);
  revalidatePath("/discounts");
}
