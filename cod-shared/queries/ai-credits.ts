/**
 * AI Credits Queries
 *
 * Manages AI credit balances and usage history per store.
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { aiCredits, aiCreditUsage } from "../db/schema";
import type { AppDb } from "../db/client";

export interface AiUsageFilters {
  agentType?: "marketing" | "finance" | "design" | "branding" | "product";
  limit?: number;
  offset?: number;
}

/** Get AI credit balance for a store (creates default record if missing) */
export async function getAiCredits(db: AppDb, storeId: string) {
  let credits = await db.select().from(aiCredits)
    .where(eq(aiCredits.storeId, storeId))
    .get();

  if (!credits) {
    const now = new Date().toISOString();
    credits = await db.insert(aiCredits).values({
      id: `aic_${storeId}`,
      storeId,
      totalCredits: 0,
      usedCredits: 0,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  }

  return credits;
}

/** Get AI credit usage history for a store */
export async function getAiCreditUsageHistory(db: AppDb, storeId: string, filters?: AiUsageFilters) {
  const conditions = [eq(aiCreditUsage.storeId, storeId)];

  if (filters?.agentType) {
    conditions.push(eq(aiCreditUsage.agentType, filters.agentType));
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  return db.select().from(aiCreditUsage)
    .where(and(...conditions))
    .orderBy(desc(aiCreditUsage.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

/** Record AI credit usage */
export async function recordAiUsage(db: AppDb, data: {
  id: string;
  storeId: string;
  agentType: "marketing" | "finance" | "design" | "branding" | "product";
  operation: string;
  model: string;
  creditsUsed: number;
  tokensIn?: number | null;
  tokensOut?: number | null;
  requestSummary?: string | null;
}) {
  const now = new Date().toISOString();
  const result = db.insert(aiCreditUsage).values({
    id: data.id,
    storeId: data.storeId,
    agentType: data.agentType,
    operation: data.operation,
    model: data.model,
    creditsUsed: data.creditsUsed,
    tokensIn: data.tokensIn ?? null,
    tokensOut: data.tokensOut ?? null,
    requestSummary: data.requestSummary ?? null,
    createdAt: now,
  }).returning().get();

  // Also update the balance
  db.update(aiCredits)
    .set({
      usedCredits: sql`${aiCredits.usedCredits} + ${data.creditsUsed}`,
      updatedAt: now,
    })
    .where(eq(aiCredits.storeId, data.storeId))
    .run();

  return result;
}

/** Add credits to a store's balance (super admin allocation) */
export async function addCredits(db: AppDb, storeId: string, amount: number) {
  const now = new Date().toISOString();
  return db.update(aiCredits)
    .set({
      totalCredits: sql`${aiCredits.totalCredits} + ${amount}`,
      updatedAt: now,
    })
    .where(eq(aiCredits.storeId, storeId))
    .returning()
    .get();
}

/** Check if store has sufficient credits */
export async function hasEnoughCredits(db: AppDb, storeId: string, required: number): Promise<boolean> {
  const credits = await getAiCredits(db, storeId);
  const remaining = credits.totalCredits - credits.usedCredits;
  return remaining >= required;
}
