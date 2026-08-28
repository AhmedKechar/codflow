import { eq, and, desc, sql } from "drizzle-orm";
import { discountCodes } from "../db/schema";
import type { AppDb } from "../db/client";

export type DiscountCodeType = "percentage" | "fixed";
export type DiscountCodeStatus = "active" | "inactive" | "expired";

export interface CreateDiscountCodeData {
  code: string;
  type: DiscountCodeType;
  value: number;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  status: DiscountCodeStatus;
}

export interface UpdateDiscountCodeData {
  code?: string;
  type?: DiscountCodeType;
  value?: number;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  status?: DiscountCodeStatus;
}

export interface DiscountCodeFilters {
  status?: DiscountCodeStatus;
  search?: string;
}

export async function listDiscountCodes(
  db: AppDb,
  storeId: string,
  filters?: DiscountCodeFilters,
) {
  let query = db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.storeId, storeId))
    .orderBy(desc(discountCodes.createdAt));

  if (filters?.status) {
    query = db
      .select()
      .from(discountCodes)
      .where(
        and(
          eq(discountCodes.storeId, storeId),
          eq(discountCodes.status, filters.status),
        ),
      )
      .orderBy(desc(discountCodes.createdAt));
  }

  const rows = await query.all();

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term),
    );
  }

  return rows;
}

export async function getDiscountCodeById(
  db: AppDb,
  storeId: string,
  id: string,
) {
  return db
    .select()
    .from(discountCodes)
    .where(and(eq(discountCodes.storeId, storeId), eq(discountCodes.id, id)))
    .get() ?? null;
}

export async function getDiscountCodeByCode(
  db: AppDb,
  storeId: string,
  code: string,
) {
  return db
    .select()
    .from(discountCodes)
    .where(
      and(
        eq(discountCodes.storeId, storeId),
        eq(discountCodes.code, code.toUpperCase()),
      ),
    )
    .get() ?? null;
}

export async function createDiscountCode(
  db: AppDb,
  storeId: string,
  data: CreateDiscountCodeData,
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(discountCodes).values({
    id,
    storeId,
    code: data.code.toUpperCase(),
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount ?? null,
    maxUses: data.maxUses ?? null,
    usedCount: 0,
    startsAt: data.startsAt ?? null,
    expiresAt: data.expiresAt ?? null,
    status: data.status,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
}

export async function updateDiscountCode(
  db: AppDb,
  storeId: string,
  id: string,
  data: UpdateDiscountCodeData,
) {
  const now = new Date().toISOString();

  await db
    .update(discountCodes)
    .set({
      ...(data.code !== undefined && { code: data.code.toUpperCase() }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.minOrderAmount !== undefined && {
        minOrderAmount: data.minOrderAmount ?? null,
      }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses ?? null }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt ?? null }),
      ...(data.expiresAt !== undefined && {
        expiresAt: data.expiresAt ?? null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      updatedAt: now,
    })
    .where(and(eq(discountCodes.storeId, storeId), eq(discountCodes.id, id)));
}

export async function deleteDiscountCode(
  db: AppDb,
  storeId: string,
  id: string,
) {
  await db
    .delete(discountCodes)
    .where(and(eq(discountCodes.storeId, storeId), eq(discountCodes.id, id)));
}

export async function validateDiscountCode(
  db: AppDb,
  storeId: string,
  code: string,
  orderAmount: number,
) {
  const dc = await getDiscountCodeByCode(db, storeId, code);
  if (!dc) return { valid: false, reason: "Code not found" as const };

  if (dc.status !== "active") {
    return { valid: false, reason: "Code is not active" as const };
  }

  const now = new Date().toISOString();

  if (dc.startsAt && now < dc.startsAt) {
    return { valid: false, reason: "Code has not started yet" as const };
  }

  if (dc.expiresAt && now > dc.expiresAt) {
    return { valid: false, reason: "Code has expired" as const };
  }

  if (dc.maxUses !== null && dc.usedCount >= dc.maxUses) {
    return { valid: false, reason: "Code usage limit reached" as const };
  }

  if (dc.minOrderAmount !== null && orderAmount < dc.minOrderAmount) {
    return {
      valid: false,
      reason: `Minimum order amount is ${dc.minOrderAmount}`,
    } as const;
  }

  let discountAmount: number;
  if (dc.type === "percentage") {
    discountAmount = Math.round((orderAmount * dc.value) / 100);
  } else {
    discountAmount = Math.min(dc.value, orderAmount);
  }

  return {
    valid: true as const,
    discountCode: dc,
    discountAmount,
  };
}

export async function applyDiscountCode(
  db: AppDb,
  storeId: string,
  code: string,
) {
  const now = new Date().toISOString();
  await db
    .update(discountCodes)
    .set({
      usedCount: sql`${discountCodes.usedCount} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(discountCodes.storeId, storeId),
        eq(discountCodes.code, code.toUpperCase()),
      ),
    );
}
