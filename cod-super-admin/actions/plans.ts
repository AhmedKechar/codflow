"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { requireSuperAdmin } from "@/lib/auth";
import {
  getAllPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
} from "../../cod-shared/queries/plans";

export async function listPlans() {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  return getAllPlans(db);
}

export interface PlanInput {
  name: string;
  nameAr: string;
  nameFr: string;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionFr?: string | null;
  priceDzd: number;
  billingCycle: "monthly" | "yearly";
  trialDays: number;
  maxOrders: number;
  maxProducts: number;
  maxDrivers: number;
  maxCustomers: number;
  maxTeamMembers: number;
  maxAiCredits: number;
  features?: string | null;
  sortOrder: number;
  isActive?: boolean;
}

export async function createPlanAction(data: PlanInput) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const { isActive: _isActive, ...createData } = data;
  const plan = await createPlan(db, {
    id: randomUUID(),
    ...createData,
  });

  revalidatePath("/plans");
  return { ok: true as const, data: plan };
}

export async function updatePlanAction(planId: string, data: Partial<PlanInput>) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const plan = await updatePlan(db, planId, data);

  revalidatePath("/plans");
  return { ok: true as const, data: plan };
}

export async function deletePlanAction(planId: string) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const plan = await deactivatePlan(db, planId);

  revalidatePath("/plans");
  return { ok: true as const, data: plan };
}
