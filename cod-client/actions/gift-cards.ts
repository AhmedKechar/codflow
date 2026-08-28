"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { requirePermission, getUserStoreId } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import {
  listGiftCards,
  getGiftCardById,
  createGiftCard,
  updateGiftCard,
  deleteGiftCard,
} from "@/../cod-shared/queries/gift-cards";

/// <reference path="../cloudflare-env.d.ts" />

export interface GiftCard {
  id: string;
  storeId: string;
  code: string;
  initialAmountDzd: number;
  remainingAmountDzd: number;
  status: "active" | "used" | "expired" | "disabled";
  recipientName: string | null;
  recipientPhone: string | null;
  recipientEmail: string | null;
  senderName: string | null;
  message: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getGiftCards(filters?: {
  status?: string;
  search?: string;
}): Promise<{ rows: GiftCard[]; total: number }> {
  await requirePermission(SCOPES.GIFT_CARDS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const rows = await listGiftCards(db, await getUserStoreId(), filters as any);
  return { rows: rows as unknown as GiftCard[], total: rows.length };
}

export async function getGiftCard(id: string): Promise<GiftCard | null> {
  await requirePermission(SCOPES.GIFT_CARDS_READ);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  return getGiftCardById(db, await getUserStoreId(), id) as Promise<GiftCard | null>;
}

export async function createGiftCardAction(data: {
  code?: string;
  initialAmountDzd: number;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  senderName?: string;
  message?: string;
  expiresAt?: string;
}): Promise<{ success: boolean; data?: GiftCard; error?: string }> {
  await requirePermission(SCOPES.GIFT_CARDS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  try {
    const result = await createGiftCard(db, await getUserStoreId(), data);
    revalidatePath("/store/gift-cards");
    return { success: true, data: result as GiftCard };
  } catch (error) {
    console.error("[Gift Cards Action Error]", error);
    return { success: false, error: "Failed to create gift card" };
  }
}

export async function updateGiftCardAction(
  id: string,
  data: Partial<{
    code: string;
    initialAmountDzd: number;
    recipientName: string;
    recipientPhone: string;
    recipientEmail: string;
    senderName: string;
    message: string;
    expiresAt: string;
    status: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  await requirePermission(SCOPES.GIFT_CARDS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  try {
    await updateGiftCard(db, await getUserStoreId(), id, {
      ...data,
      status: data.status as "active" | "used" | "expired" | "disabled" | undefined,
    });
    revalidatePath("/store/gift-cards");
    return { success: true };
  } catch (error) {
    console.error("[Gift Cards Action Error]", error);
    return { success: false, error: "Failed to update gift card" };
  }
}

export async function deleteGiftCardAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission(SCOPES.GIFT_CARDS_MANAGE);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  try {
    await deleteGiftCard(db, await getUserStoreId(), id);
    revalidatePath("/store/gift-cards");
    return { success: true };
  } catch (error) {
    console.error("[Gift Cards Action Error]", error);
    return { success: false, error: "Failed to delete gift card" };
  }
}
