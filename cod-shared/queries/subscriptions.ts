/**
 * Subscriptions & Plans Queries
 *
 * Manages platform plans and store subscriptions.
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { plans, subscriptions } from "../db/schema";
import type { AppDb } from "../db/client";

// ─── Plans (platform-level, read-only for merchants) ──────────────────────────

/** Get all active plans (public, no storeId needed) */
export async function getAllPlans(db: AppDb) {
  return db.select().from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(plans.sortOrder)
    .all();
}

/** Get a single plan by ID */
export async function getPlanById(db: AppDb, planId: string) {
  return db.select().from(plans).where(eq(plans.id, planId)).get();
}

// ─── Subscriptions (store-scoped) ─────────────────────────────────────────────

/** Get the current active subscription for a store (with plan relation) */
export async function getActiveSubscription(db: AppDb, storeId: string) {
  return db.select({
    subscription: subscriptions,
    plan: plans,
  })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(
      eq(subscriptions.storeId, storeId),
      sql`${subscriptions.status} IN ('active', 'trialing', 'past_due')`
    ))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)
    .get();
}

/** Get subscription history for a store (all subscriptions, ordered by newest) */
export async function getSubscriptionHistory(db: AppDb, storeId: string, limit = 20, offset = 0) {
  return db.select({
    subscription: subscriptions,
    plan: plans,
  })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.storeId, storeId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

/** Create a new subscription */
export async function createSubscription(db: AppDb, data: {
  id: string;
  storeId: string;
  planId: string;
  status?: "trialing" | "active" | "past_due" | "canceled" | "expired";
  trialStart?: string | null;
  trialEnd?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  paymentMethod?: "ccp" | "baridi_mob" | "wise" | "redotpay" | null;
  notes?: string | null;
}) {
  const now = new Date().toISOString();
  const result = await db.insert(subscriptions).values({
    id: data.id,
    storeId: data.storeId,
    planId: data.planId,
    status: data.status ?? "trialing",
    trialStart: data.trialStart ?? null,
    trialEnd: data.trialEnd ?? null,
    currentPeriodStart: data.currentPeriodStart ?? null,
    currentPeriodEnd: data.currentPeriodEnd ?? null,
    paymentMethod: data.paymentMethod ?? null,
    notes: data.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }).returning().get();
  return result;
}

/** Update a subscription */
export async function updateSubscription(db: AppDb, subscriptionId: string, data: {
  planId?: string;
  status?: "trialing" | "active" | "past_due" | "canceled" | "expired";
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAt?: string | null;
  canceledAt?: string | null;
  paymentMethod?: "ccp" | "baridi_mob" | "wise" | "redotpay" | null;
  notes?: string | null;
}) {
  const now = new Date().toISOString();
  return db.update(subscriptions)
    .set({ ...data, updatedAt: now })
    .where(eq(subscriptions.id, subscriptionId))
    .returning()
    .get();
}

/** Check if a store has an active subscription (trialing or active) */
export async function hasActiveSubscription(db: AppDb, storeId: string): Promise<boolean> {
  const row = await db.select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.storeId, storeId),
      sql`${subscriptions.status} IN ('active', 'trialing')`
    ))
    .limit(1)
    .get();
  return !!row;
}
