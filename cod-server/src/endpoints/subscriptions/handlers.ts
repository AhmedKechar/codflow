import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import * as subQueries from "../../../../cod-shared/queries/subscriptions";
import * as planQueries from "../../../../cod-shared/queries/plans";
import { NotFoundError } from "@/lib/errors/classes";

export async function listPlans(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const data = await planQueries.getAllActivePlans(db);
  return c.json({ success: true, data, count: data.length }, 200);
}

export async function getPlan(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const id = c.req.param("id")!;
  const data = await planQueries.getPlanById(db, id);
  if (!data) throw new NotFoundError("Plan", id);
  return c.json({ success: true, data }, 200);
}

export async function getMySubscription(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const data = await subQueries.getActiveSubscription(db, storeId);
  return c.json({ success: true, data: data ?? null }, 200);
}

export async function getSubscriptionHistory(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const limit = Number(c.req.query("limit") ?? 20);
  const offset = Number(c.req.query("offset") ?? 0);
  const data = await subQueries.getSubscriptionHistory(db, storeId, limit, offset);
  return c.json({ success: true, data, count: data.length }, 200);
}

export async function upgradePlan(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const body = await c.req.json();
  const { planId, paymentMethod } = body;

  if (!planId) {
    return c.json({ error: "planId is required" }, 400);
  }

  const plan = await planQueries.getPlanById(db, planId);
  if (!plan) throw new NotFoundError("Plan", planId);

  const existing = await subQueries.getActiveSubscription(db, storeId);
  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (existing?.subscription) {
    await subQueries.updateSubscription(db, existing.subscription.id, {
      planId,
      status: plan.priceDzd > 0 ? "past_due" : "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      paymentMethod: paymentMethod ?? null,
    });
  } else {
    await subQueries.createSubscription(db, {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      storeId,
      planId,
      status: plan.priceDzd > 0 ? "past_due" : "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      paymentMethod: paymentMethod ?? null,
    });
  }

  const updated = await subQueries.getActiveSubscription(db, storeId);
  return c.json({ success: true, data: updated }, 200);
}
