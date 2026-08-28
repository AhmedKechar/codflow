import { eq, and, desc, sql } from "drizzle-orm";
import { giftCards } from "../db/schema";
import type { AppDb } from "../db/client";

export type GiftCardStatus = "active" | "used" | "expired" | "disabled";

export interface CreateGiftCardData {
  code?: string;
  initialAmountDzd: number;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  senderName?: string;
  message?: string;
  expiresAt?: string | null;
  status?: GiftCardStatus;
}

export interface UpdateGiftCardData {
  code?: string;
  initialAmountDzd?: number;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  senderName?: string;
  message?: string;
  expiresAt?: string | null;
  status?: GiftCardStatus;
}

export interface GiftCardFilters {
  status?: GiftCardStatus;
  search?: string;
}

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function listGiftCards(
  db: AppDb,
  storeId: string,
  filters?: GiftCardFilters,
) {
  let query = db
    .select()
    .from(giftCards)
    .where(eq(giftCards.storeId, storeId))
    .orderBy(desc(giftCards.createdAt));

  if (filters?.status) {
    query = db
      .select()
      .from(giftCards)
      .where(
        and(
          eq(giftCards.storeId, storeId),
          eq(giftCards.status, filters.status),
        ),
      )
      .orderBy(desc(giftCards.createdAt));
  }

  const rows = await query.all();

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(term) ||
        (r.recipientName && r.recipientName.toLowerCase().includes(term)) ||
        (r.senderName && r.senderName.toLowerCase().includes(term)),
    );
  }

  return rows;
}

export async function getGiftCardById(
  db: AppDb,
  storeId: string,
  id: string,
) {
  return db
    .select()
    .from(giftCards)
    .where(and(eq(giftCards.storeId, storeId), eq(giftCards.id, id)))
    .get() ?? null;
}

export async function getGiftCardByCode(
  db: AppDb,
  storeId: string,
  code: string,
) {
  return db
    .select()
    .from(giftCards)
    .where(
      and(
        eq(giftCards.storeId, storeId),
        eq(giftCards.code, code.toUpperCase()),
      ),
    )
    .get() ?? null;
}

export async function createGiftCard(
  db: AppDb,
  storeId: string,
  data: CreateGiftCardData,
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const code = data.code?.toUpperCase() ?? generateGiftCardCode();

  await db.insert(giftCards).values({
    id,
    storeId,
    code,
    initialAmountDzd: data.initialAmountDzd,
    remainingAmountDzd: data.initialAmountDzd,
    status: data.status ?? "active",
    recipientName: data.recipientName ?? null,
    recipientPhone: data.recipientPhone ?? null,
    recipientEmail: data.recipientEmail ?? null,
    senderName: data.senderName ?? null,
    message: data.message ?? null,
    expiresAt: data.expiresAt ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
}

export async function updateGiftCard(
  db: AppDb,
  storeId: string,
  id: string,
  data: UpdateGiftCardData,
) {
  const now = new Date().toISOString();

  await db
    .update(giftCards)
    .set({
      ...(data.code !== undefined && { code: data.code.toUpperCase() }),
      ...(data.initialAmountDzd !== undefined && {
        initialAmountDzd: data.initialAmountDzd,
      }),
      ...(data.recipientName !== undefined && {
        recipientName: data.recipientName ?? null,
      }),
      ...(data.recipientPhone !== undefined && {
        recipientPhone: data.recipientPhone ?? null,
      }),
      ...(data.recipientEmail !== undefined && {
        recipientEmail: data.recipientEmail ?? null,
      }),
      ...(data.senderName !== undefined && {
        senderName: data.senderName ?? null,
      }),
      ...(data.message !== undefined && { message: data.message ?? null }),
      ...(data.expiresAt !== undefined && {
        expiresAt: data.expiresAt ?? null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      updatedAt: now,
    })
    .where(and(eq(giftCards.storeId, storeId), eq(giftCards.id, id)));
}

export async function deleteGiftCard(
  db: AppDb,
  storeId: string,
  id: string,
) {
  await db
    .delete(giftCards)
    .where(and(eq(giftCards.storeId, storeId), eq(giftCards.id, id)));
}

export async function redeemGiftCard(
  db: AppDb,
  storeId: string,
  code: string,
  amount: number,
) {
  const card = await getGiftCardByCode(db, storeId, code);
  if (!card) return { success: false as const, reason: "Gift card not found" as const };

  if (card.status !== "active") {
    return { success: false as const, reason: "Gift card is not active" as const };
  }

  if (card.remainingAmountDzd < amount) {
    return { success: false as const, reason: "Insufficient balance" as const };
  }

  const now = new Date().toISOString();
  const newRemaining = card.remainingAmountDzd - amount;
  const newStatus: GiftCardStatus = newRemaining === 0 ? "used" : "active";

  await db
    .update(giftCards)
    .set({
      remainingAmountDzd: newRemaining,
      status: newStatus,
      ...(newStatus === "used" ? { usedAt: now } : {}),
      updatedAt: now,
    })
    .where(and(eq(giftCards.storeId, storeId), eq(giftCards.id, card.id)));

  return {
    success: true as const,
    giftCard: { ...card, remainingAmountDzd: newRemaining, status: newStatus },
  };
}

export async function disableGiftCard(
  db: AppDb,
  storeId: string,
  id: string,
) {
  const now = new Date().toISOString();
  await db
    .update(giftCards)
    .set({ status: "disabled", updatedAt: now })
    .where(and(eq(giftCards.storeId, storeId), eq(giftCards.id, id)));
}
