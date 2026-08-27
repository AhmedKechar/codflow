/**
 * Plans Queries — Unit Tests
 *
 * Coverage:
 *  1. getAllActivePlans / getAllPlans / getPlanById — plan retrieval
 *  2. createPlan / updatePlan / deactivatePlan — write operations
 */

import { describe, it, expect } from "vitest";
import {
  getAllActivePlans,
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deactivatePlan,
} from "../../../../cod-shared/queries/plans";
import { makeMockDb, a } from "@/test-utils/mock-db";

const NOW = "2026-01-01T00:00:00.000Z";

function planRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "plan_1",
    name: "Starter",
    name_ar: "ستارتر",
    name_fr: "Débutant",
    description: "Basic plan",
    description_ar: null,
    description_fr: null,
    price_dzd: 1000,
    currency: "DZD",
    billing_cycle: "monthly",
    trial_days: 7,
    max_orders: 20,
    max_products: 100,
    max_drivers: 2,
    max_customers: 500,
    max_team_members: 2,
    max_ai_credits: 0,
    features: null,
    is_active: 1,
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

// ─── getAllActivePlans ───────────────────────────────────────────────────────

describe("getAllActivePlans", () => {
  it("returns only active plans", async () => {
    const db = makeMockDb([a([planRow(), planRow({ id: "plan_2", name: "Pro" })])]);
    const result = await getAllActivePlans(db);
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.isActive)).toBe(true);
  });

  it("returns empty array when no active plans", async () => {
    const db = makeMockDb([a([])]);
    const result = await getAllActivePlans(db);
    expect(result).toHaveLength(0);
  });
});

// ─── getAllPlans ──────────────────────────────────────────────────────────────

describe("getAllPlans", () => {
  it("returns all plans including inactive", async () => {
    const db = makeMockDb([a([planRow(), planRow({ id: "plan_2", is_active: 0 })])]);
    const result = await getAllPlans(db);
    expect(result).toHaveLength(2);
    expect(result[0].isActive).toBe(true);
    expect(result[1].isActive).toBe(false);
  });

  it("returns empty array when no plans", async () => {
    const db = makeMockDb([a([])]);
    const result = await getAllPlans(db);
    expect(result).toHaveLength(0);
  });
});

// ─── getPlanById ─────────────────────────────────────────────────────────────

describe("getPlanById", () => {
  it("returns plan when found", async () => {
    const db = makeMockDb([a([planRow()])]);
    const result = await getPlanById(db, "plan_1");
    expect(result).toBeDefined();
    expect(result?.id).toBe("plan_1");
    expect(result?.name).toBe("Starter");
    expect(result?.priceDzd).toBe(1000);
  });

  it("returns falsy when plan doesn't exist", async () => {
    const db = makeMockDb([a([])]);
    const result = await getPlanById(db, "nonexistent");
    expect(result).toBeFalsy();
  });
});

// ─── createPlan ──────────────────────────────────────────────────────────────

describe("createPlan", () => {
  it("creates a plan with required fields and defaults", async () => {
    const db = makeMockDb([a([planRow()])]);
    const result = await createPlan(db, {
      id: "plan_1",
      name: "Starter",
      nameAr: "ستارتر",
      nameFr: "Débutant",
      priceDzd: 1000,
    });
    expect(result).toBeDefined();
    expect(result.id).toBe("plan_1");
    expect(result.billingCycle).toBe("monthly");
    expect(result.isActive).toBe(true);
  });

  it("creates a plan with all optional fields", async () => {
    const db = makeMockDb([a([planRow({
      name: "Enterprise",
      price_dzd: 10000,
      billing_cycle: "yearly",
      trial_days: 30,
      max_orders: 10000,
      max_products: 50000,
      max_drivers: 100,
      max_customers: 100000,
      max_team_members: 50,
      max_ai_credits: 1000,
      features: JSON.stringify(["api_access", "priority_support"]),
      sort_order: 5,
    })])]);
    const result = await createPlan(db, {
      id: "plan_2",
      name: "Enterprise",
      nameAr: "إنتربرايز",
      nameFr: "Entreprise",
      description: "Enterprise plan",
      descriptionAr: "خطة المؤسسات",
      descriptionFr: "Plan entreprise",
      priceDzd: 10000,
      billingCycle: "yearly",
      trialDays: 30,
      maxOrders: 10000,
      maxProducts: 50000,
      maxDrivers: 100,
      maxCustomers: 100000,
      maxTeamMembers: 50,
      maxAiCredits: 1000,
      features: JSON.stringify(["api_access", "priority_support"]),
      sortOrder: 5,
    });
    expect(result).toBeDefined();
    expect(result.billingCycle).toBe("yearly");
    expect(result.maxOrders).toBe(10000);
  });
});

// ─── updatePlan ──────────────────────────────────────────────────────────────

describe("updatePlan", () => {
  it("updates plan name and price", async () => {
    const db = makeMockDb([a([planRow({ name: "Pro", price_dzd: 3000 })])]);
    const result = await updatePlan(db, "plan_1", {
      name: "Pro",
      priceDzd: 3000,
    });
    expect(result).toBeDefined();
    expect(result.name).toBe("Pro");
    expect(result.priceDzd).toBe(3000);
  });

  it("updates plan limits", async () => {
    const db = makeMockDb([a([planRow({ max_orders: 500, max_products: 2000 })])]);
    const result = await updatePlan(db, "plan_1", {
      maxOrders: 500,
      maxProducts: 2000,
    });
    expect(result.maxOrders).toBe(500);
    expect(result.maxProducts).toBe(2000);
  });
});

// ─── deactivatePlan ──────────────────────────────────────────────────────────

describe("deactivatePlan", () => {
  it("sets isActive to false", async () => {
    const db = makeMockDb([a([planRow({ is_active: 0 })])]);
    const result = await deactivatePlan(db, "plan_1");
    expect(result).toBeDefined();
    expect(result.isActive).toBe(false);
  });
});
