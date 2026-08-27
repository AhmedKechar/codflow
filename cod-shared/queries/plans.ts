/**
 * Plans Queries
 *
 * Manages platform subscription plans.
 * Plans are platform-level, not store-scoped.
 */

import { eq, asc } from "drizzle-orm";
import { plans } from "../db/schema";
import type { AppDb } from "../db/client";

/** Get all active plans (public) */
export async function getAllActivePlans(db: AppDb) {
  return db.select().from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(asc(plans.sortOrder))
    .all();
}

/** Get all plans (super admin, including inactive) */
export async function getAllPlans(db: AppDb) {
  return db.select().from(plans)
    .orderBy(asc(plans.sortOrder))
    .all();
}

/** Get a single plan by ID */
export async function getPlanById(db: AppDb, planId: string) {
  return db.select().from(plans).where(eq(plans.id, planId)).get();
}

/** Create a new plan (super admin) */
export async function createPlan(db: AppDb, data: {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionFr?: string | null;
  priceDzd: number;
  billingCycle?: "monthly" | "yearly";
  trialDays?: number;
  maxOrders?: number;
  maxProducts?: number;
  maxDrivers?: number;
  maxCustomers?: number;
  maxTeamMembers?: number;
  maxAiCredits?: number;
  features?: string | null;
  sortOrder?: number;
}) {
  const now = new Date().toISOString();
  return db.insert(plans).values({
    id: data.id,
    name: data.name,
    nameAr: data.nameAr,
    nameFr: data.nameFr,
    description: data.description ?? null,
    descriptionAr: data.descriptionAr ?? null,
    descriptionFr: data.descriptionFr ?? null,
    priceDzd: data.priceDzd,
    currency: "DZD",
    billingCycle: data.billingCycle ?? "monthly",
    trialDays: data.trialDays ?? 0,
    maxOrders: data.maxOrders ?? 20,
    maxProducts: data.maxProducts ?? 100,
    maxDrivers: data.maxDrivers ?? 5,
    maxCustomers: data.maxCustomers ?? 1000,
    maxTeamMembers: data.maxTeamMembers ?? 2,
    maxAiCredits: data.maxAiCredits ?? 0,
    features: data.features ?? null,
    isActive: true,
    sortOrder: data.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  }).returning().get();
}

/** Update a plan (super admin) */
export async function updatePlan(db: AppDb, planId: string, data: {
  name?: string;
  nameAr?: string;
  nameFr?: string;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionFr?: string | null;
  priceDzd?: number;
  billingCycle?: "monthly" | "yearly";
  trialDays?: number;
  maxOrders?: number;
  maxProducts?: number;
  maxDrivers?: number;
  maxCustomers?: number;
  maxTeamMembers?: number;
  maxAiCredits?: number;
  features?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const now = new Date().toISOString();
  return db.update(plans)
    .set({ ...data, updatedAt: now })
    .where(eq(plans.id, planId))
    .returning()
    .get();
}

/** Delete a plan (super admin) - soft delete by setting isActive=false */
export async function deactivatePlan(db: AppDb, planId: string) {
  const now = new Date().toISOString();
  return db.update(plans)
    .set({ isActive: false, updatedAt: now })
    .where(eq(plans.id, planId))
    .returning()
    .get();
}
