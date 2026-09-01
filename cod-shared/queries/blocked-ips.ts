import { eq, and, or, like, desc, isNull, gt } from "drizzle-orm";
import { blockedIps } from "../db/schema";
import type { AppDb } from "../db/client";

export interface BlockedIpFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getBlockedIpsByStore(
  db: AppDb,
  storeId: string,
  filters?: BlockedIpFilters
) {
  const conditions = [eq(blockedIps.storeId, storeId)];

  if (filters?.search) {
    conditions.push(
      or(
        like(blockedIps.ipAddress, `%${filters.search}%`),
        like(blockedIps.reason, `%${filters.search}%`)
      )!
    );
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  return await db
    .select()
    .from(blockedIps)
    .where(and(...conditions))
    .orderBy(desc(blockedIps.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

export async function isIpBlocked(
  db: AppDb,
  storeId: string,
  ipAddress: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db
    .select()
    .from(blockedIps)
    .where(
      and(
        eq(blockedIps.storeId, storeId),
        eq(blockedIps.ipAddress, ipAddress),
        or(
          isNull(blockedIps.expiresAt),
          gt(blockedIps.expiresAt, now)
        )
      )
    )
    .get();

  return !!result;
}

export async function blockIp(
  db: AppDb,
  storeId: string,
  ipAddress: string,
  reason?: string,
  customerId?: string,
  expiresAt?: string
) {
  const existing = await db
    .select()
    .from(blockedIps)
    .where(
      and(
        eq(blockedIps.storeId, storeId),
        eq(blockedIps.ipAddress, ipAddress)
      )
    )
    .get();

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const record = {
    id,
    storeId,
    ipAddress,
    reason: reason ?? null,
    customerId: customerId ?? null,
    createdAt: now,
    expiresAt: expiresAt ?? null,
  };

  await db.insert(blockedIps).values(record);

  return record;
}

export async function unblockIp(
  db: AppDb,
  storeId: string,
  ipAddress: string
) {
  await db
    .delete(blockedIps)
    .where(
      and(
        eq(blockedIps.storeId, storeId),
        eq(blockedIps.ipAddress, ipAddress)
      )
    );
}

export async function deleteBlockedIp(
  db: AppDb,
  storeId: string,
  id: string
) {
  await db
    .delete(blockedIps)
    .where(
      and(
        eq(blockedIps.storeId, storeId),
        eq(blockedIps.id, id)
      )
    );
}
