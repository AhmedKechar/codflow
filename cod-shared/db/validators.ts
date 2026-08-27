/**
 * Data validators for multi-tenant CodFlow platform.
 * Provides validation functions for store isolation and data integrity.
 */

import { eq, and } from "drizzle-orm";
import type { AppDb } from "./client";
import { stores, storeMembers, subscriptions, plans } from "./schema";
import type { plans as PlansType } from "./schema";

// ─── Store Validation ──────────────────────────────────────────────────────────

/**
 * Validate that a store exists and is active.
 */
export async function validateStore(db: AppDb, storeId: string): Promise<boolean> {
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  });
  return store !== undefined && store.status === "active";
}

/**
 * Validate that a user is a member of a store with the required role.
 */
export async function validateStoreMember(
  db: AppDb,
  storeId: string,
  userId: string,
  requiredRole?: "owner" | "admin" | "staff"
): Promise<boolean> {
  const member = await db.query.storeMembers.findFirst({
    where: and(
      eq(storeMembers.storeId, storeId),
      eq(storeMembers.userId, userId),
      eq(storeMembers.status, "active")
    ),
  });

  if (!member) return false;

  if (requiredRole) {
    const roleHierarchy = { owner: 3, admin: 2, staff: 1 };
    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  }

  return true;
}

/**
 * Get the user's role in a store.
 */
export async function getUserStoreRole(
  db: AppDb,
  storeId: string,
  userId: string
): Promise<"owner" | "admin" | "staff" | null> {
  const member = await db.query.storeMembers.findFirst({
    where: and(
      eq(storeMembers.storeId, storeId),
      eq(storeMembers.userId, userId),
      eq(storeMembers.status, "active")
    ),
  });

  return member?.role ?? null;
}

// ─── Subscription Validation ───────────────────────────────────────────────────

/**
 * Validate that a store has an active subscription.
 */
export async function validateSubscription(db: AppDb, storeId: string): Promise<boolean> {
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.storeId, storeId),
      eq(subscriptions.status, "active")
    ),
  });

  return subscription !== undefined;
}

/**
 * Get the current subscription for a store.
 */
export async function getCurrentSubscription(db: AppDb, storeId: string) {
  const row = await db
    .select({
      id: subscriptions.id,
      storeId: subscriptions.storeId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      trialStart: subscriptions.trialStart,
      trialEnd: subscriptions.trialEnd,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAt: subscriptions.cancelAt,
      canceledAt: subscriptions.canceledAt,
      paymentMethod: subscriptions.paymentMethod,
      notes: subscriptions.notes,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.storeId, storeId),
        eq(subscriptions.status, "active")
      )
    )
    .get();

  if (!row) return undefined;

  const { plan: planData, ...subData } = row;
  return { ...subData, plan: planData };
}

/**
 * Validate that a store has not exceeded its plan limits.
 */
export async function validatePlanLimits(
  db: AppDb,
  storeId: string,
  resource: "orders" | "products" | "drivers" | "customers" | "team_members",
  currentCount: number
): Promise<{ valid: boolean; limit: number; remaining: number }> {
  const subscription = await getCurrentSubscription(db, storeId);
  
  if (!subscription) {
    return { valid: false, limit: 0, remaining: 0 };
  }

  const plan = subscription.plan;
  let limit: number;

  switch (resource) {
    case "orders":
      limit = plan.maxOrders;
      break;
    case "products":
      limit = plan.maxProducts ?? 100;
      break;
    case "drivers":
      limit = plan.maxDrivers ?? 5;
      break;
    case "customers":
      limit = plan.maxCustomers ?? 1000;
      break;
    case "team_members":
      limit = plan.maxTeamMembers ?? 2;
      break;
    default:
      return { valid: false, limit: 0, remaining: 0 };
  }

  // -1 means unlimited
  if (limit === -1) {
    return { valid: true, limit: -1, remaining: -1 };
  }

  const remaining = limit - currentCount;
  return {
    valid: remaining > 0,
    limit,
    remaining,
  };
}

// ─── JSON Validation ───────────────────────────────────────────────────────────

/**
 * Validate that a string is valid JSON.
 */
export function isValidJson(jsonString: string | null): boolean {
  if (!jsonString) return true; // null is allowed
  try {
    const parsed = JSON.parse(jsonString);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
}

/**
 * Parse JSON safely, returning null on failure.
 */
export function parseJsonSafe<T>(jsonString: string | null): T | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

// ─── Phone Number Validation ───────────────────────────────────────────────────

/**
 * Validate Algerian phone number format.
 * Accepts: 0XXXXXXXXX, +213XXXXXXXXX, 213XXXXXXXXX
 */
export function isValidAlgerianPhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s\-]/g, "");
  
  // Algerian phone patterns
  const patterns = [
    /^0[5-7]\d{8}$/,           // 0XXXXXXXXX (local format)
    /^\+213[5-7]\d{8}$/,       // +213XXXXXXXXX (international)
    /^213[5-7]\d{8}$/,         // 213XXXXXXXXX (without +)
  ];

  return patterns.some((pattern) => pattern.test(cleaned));
}

// ─── Email Validation ──────────────────────────────────────────────────────────

/**
 * Basic email validation.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ─── Code Validation ───────────────────────────────────────────────────────────

/**
 * Validate discount/gift card code format.
 * Alphanumeric, 3-20 characters.
 */
export function isValidCode(code: string): boolean {
  const codeRegex = /^[A-Z0-9]{3,20}$/i;
  return codeRegex.test(code);
}

// ─── Domain Validation ─────────────────────────────────────────────────────────

/**
 * Validate domain name format.
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}
