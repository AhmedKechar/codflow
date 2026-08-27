import { describe, it, expect } from "vitest";
import {
  getAllPlans,
  getPlanById,
  getActiveSubscription,
  getSubscriptionHistory,
  createSubscription,
  updateSubscription,
  hasActiveSubscription,
} from "../../../../cod-shared/queries/subscriptions";
import { makeMockDb, a, f } from "@/test-utils/mock-db";

const NOW = "2026-01-01T00:00:00.000Z";

function planRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "plan_1",
    name: "Pro",
    name_ar: "برو",
    name_fr: "Pro",
    description: "Pro plan",
    description_ar: null,
    description_fr: null,
    price_dzd: 2000,
    currency: "DZD",
    billing_cycle: "monthly",
    trial_days: 14,
    max_orders: 100,
    max_products: 500,
    max_drivers: 10,
    max_customers: 5000,
    max_team_members: 5,
    max_ai_credits: 100,
    features: null,
    is_active: 1,
    sort_order: 1,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function subscriptionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    store_id: "test-store",
    plan_id: "plan_1",
    status: "active",
    trial_start: null,
    trial_end: null,
    current_period_start: NOW,
    current_period_end: NOW,
    cancel_at: null,
    canceled_at: null,
    payment_method: "ccp",
    notes: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function subscriptionPlanRow(overrides: Record<string, unknown> = {}) {
  return {
    sub_id: "sub_1",
    sub_store_id: "test-store",
    sub_plan_id: "plan_1",
    sub_status: "active",
    sub_trial_start: null,
    sub_trial_end: null,
    sub_current_period_start: NOW,
    sub_current_period_end: NOW,
    sub_cancel_at: null,
    sub_canceled_at: null,
    sub_payment_method: "ccp",
    sub_notes: null,
    sub_created_at: NOW,
    sub_updated_at: NOW,
    plan_id: "plan_1",
    plan_name: "Pro",
    plan_name_ar: "برو",
    plan_name_fr: "Pro",
    plan_description: "Pro plan",
    plan_description_ar: null,
    plan_description_fr: null,
    plan_price_dzd: 2000,
    plan_currency: "DZD",
    plan_billing_cycle: "monthly",
    plan_trial_days: 14,
    plan_max_orders: 100,
    plan_max_products: 500,
    plan_max_drivers: 10,
    plan_max_customers: 5000,
    plan_max_team_members: 5,
    plan_max_ai_credits: 100,
    plan_features: null,
    plan_is_active: 1,
    plan_sort_order: 1,
    plan_created_at: NOW,
    plan_updated_at: NOW,
    ...overrides,
  };
}

describe("getAllPlans", () => {
  it("returns active plans ordered by sort order", async () => {
    const db = makeMockDb([a([planRow(), planRow({ id: "plan_2", sort_order: 0 })])]);
    const result = await getAllPlans(db);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("plan_1");
  });

  it("returns empty array when no plans exist", async () => {
    const db = makeMockDb([a([])]);
    const result = await getAllPlans(db);
    expect(result).toHaveLength(0);
  });
});

describe("getPlanById", () => {
  it("returns plan when found", async () => {
    const db = makeMockDb([a([planRow()])]);
    const result = await getPlanById(db, "plan_1");
    expect(result).toBeDefined();
    expect(result?.id).toBe("plan_1");
  });

  it("returns falsy when plan doesn't exist", async () => {
    const db = makeMockDb([a([])]);
    const result = await getPlanById(db, "nonexistent");
    expect(result).toBeFalsy();
  });
});

describe("getActiveSubscription", () => {
  it("returns active subscription with plan relation", async () => {
    const db = makeMockDb([a([subscriptionPlanRow()])]);
    const result = await getActiveSubscription(db, "test-store");
    expect(result).toBeDefined();
    expect(result?.subscription.id).toBe("sub_1");
    expect(result?.plan.id).toBe("plan_1");
  });

  it("returns falsy when no active subscription exists", async () => {
    const db = makeMockDb([a([])]);
    const result = await getActiveSubscription(db, "no-store");
    expect(result).toBeFalsy();
  });
});

describe("getSubscriptionHistory", () => {
  it("returns subscription history with plan data", async () => {
    const db = makeMockDb([a([subscriptionPlanRow()])]);
    const result = await getSubscriptionHistory(db, "test-store");
    expect(result).toHaveLength(1);
    expect(result[0].subscription.id).toBe("sub_1");
    expect(result[0].plan.name).toBe("Pro");
  });

  it("returns empty array when no subscriptions exist", async () => {
    const db = makeMockDb([a([])]);
    const result = await getSubscriptionHistory(db, "no-store");
    expect(result).toHaveLength(0);
  });
});

describe("createSubscription", () => {
  it("creates a subscription with defaults", async () => {
    const db = makeMockDb([a([subscriptionRow()])]);
    const result = await createSubscription(db, {
      id: "sub_1",
      storeId: "test-store",
      planId: "plan_1",
    });
    expect(result).toBeDefined();
    expect(result.id).toBe("sub_1");
  });

  it("creates a subscription with all optional fields", async () => {
    const db = makeMockDb([a([subscriptionRow({ id: "sub_2", status: "trialing", payment_method: "wise" })])]);
    const result = await createSubscription(db, {
      id: "sub_2",
      storeId: "test-store",
      planId: "plan_1",
      status: "trialing",
      trialStart: NOW,
      trialEnd: NOW,
      currentPeriodStart: NOW,
      currentPeriodEnd: NOW,
      paymentMethod: "wise",
      notes: "test",
    });
    expect(result).toBeDefined();
    expect(result.id).toBe("sub_2");
  });
});

describe("updateSubscription", () => {
  it("updates a subscription status", async () => {
    const db = makeMockDb([a([subscriptionRow({ status: "canceled" })])]);
    const result = await updateSubscription(db, "sub_1", { status: "canceled" });
    expect(result).toBeDefined();
    expect(result.status).toBe("canceled");
  });

  it("updates subscription payment method", async () => {
    const db = makeMockDb([a([subscriptionRow({ payment_method: "baridi_mob" })])]);
    const result = await updateSubscription(db, "sub_1", { paymentMethod: "baridi_mob" });
    expect(result).toBeDefined();
    expect(result.paymentMethod).toBe("baridi_mob");
  });
});

describe("hasActiveSubscription", () => {
  it("returns true when active subscription exists", async () => {
    const db = makeMockDb([a([{ id: "sub_1" }])]);
    const result = await hasActiveSubscription(db, "test-store");
    expect(result).toBe(true);
  });

  it("returns false when no active subscription exists", async () => {
    const db = makeMockDb([f(null)]);
    const result = await hasActiveSubscription(db, "no-store");
    expect(result).toBe(false);
  });
});
