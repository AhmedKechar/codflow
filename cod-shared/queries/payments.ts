/**
 * Payments Queries
 *
 * Manages subscription payment records.
 * Stores submit receipts; Super Admin approves/rejects.
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { payments } from "../db/schema";
import type { AppDb } from "../db/client";

export interface PaymentFilters {
  status?: "pending" | "approved" | "rejected";
  limit?: number;
  offset?: number;
}

/** Get all payments for a store */
export async function getStorePayments(db: AppDb, storeId: string, filters?: PaymentFilters) {
  const conditions = [eq(payments.storeId, storeId)];

  if (filters?.status) {
    conditions.push(eq(payments.status, filters.status));
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  return db.select().from(payments)
    .where(and(...conditions))
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

/** Get all pending payments (super admin) */
export async function getPendingPayments(db: AppDb, limit = 50, offset = 0) {
  return db.select().from(payments)
    .where(eq(payments.status, "pending"))
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

/** Get a single payment by ID */
export async function getPaymentById(db: AppDb, paymentId: string) {
  return db.select().from(payments).where(eq(payments.id, paymentId)).get();
}

/** Get payments for a specific subscription */
export async function getPaymentsBySubscription(db: AppDb, subscriptionId: string) {
  return db.select().from(payments)
    .where(eq(payments.subscriptionId, subscriptionId))
    .orderBy(desc(payments.createdAt))
    .all();
}

/** Create a new payment record */
export async function createPayment(db: AppDb, data: {
  id: string;
  subscriptionId: string;
  storeId: string;
  amountDzd: number;
  paymentMethod: "ccp" | "baridi_mob" | "wise" | "redotpay";
  receiptUrl?: string | null;
  receiptFile?: string | null;
  referenceNumber?: string | null;
}) {
  const now = new Date().toISOString();
  return db.insert(payments).values({
    id: data.id,
    subscriptionId: data.subscriptionId,
    storeId: data.storeId,
    amountDzd: data.amountDzd,
    currency: "DZD",
    paymentMethod: data.paymentMethod,
    receiptUrl: data.receiptUrl ?? null,
    receiptFile: data.receiptFile ?? null,
    referenceNumber: data.referenceNumber ?? null,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }).returning().get();
}

/** Approve a payment (super admin) */
export async function approvePayment(db: AppDb, paymentId: string, reviewedBy: string, notes?: string) {
  const now = new Date().toISOString();
  return db.update(payments)
    .set({
      status: "approved",
      reviewedBy,
      reviewedAt: now,
      reviewNotes: notes ?? null,
      updatedAt: now,
    })
    .where(eq(payments.id, paymentId))
    .returning()
    .get();
}

/** Reject a payment (super admin) */
export async function rejectPayment(db: AppDb, paymentId: string, reviewedBy: string, notes?: string) {
  const now = new Date().toISOString();
  return db.update(payments)
    .set({
      status: "rejected",
      reviewedBy,
      reviewedAt: now,
      reviewNotes: notes ?? null,
      updatedAt: now,
    })
    .where(eq(payments.id, paymentId))
    .returning()
    .get();
}

/** Count pending payments (for super admin dashboard badge) */
export async function countPendingPayments(db: AppDb): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(eq(payments.status, "pending"))
    .get();
  return result?.count ?? 0;
}
