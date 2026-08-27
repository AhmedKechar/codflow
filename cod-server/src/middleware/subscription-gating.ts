/**
 * Subscription Gating Middleware
 *
 * Gates API access based on subscription status:
 * - Active/Trialing: full read/write
 * - Expired (0-7 days): full read/write + grace flag
 * - Expired (8-30 days): read-only (GET/HEAD only)
 * - Expired (30+ days): blocked (403)
 *
 * Never gates: /store/*, /webhooks/*, /images/*, admin users.
 */

import { Context, Next } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { subscriptions, plans } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
const READONLY_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export async function subscriptionGating(c: Context<AppContext>, next: Next) {
  const user = c.get("user");
  if (user?.role === "admin") return next();

  const storeId = c.get("storeId");
  if (!storeId) return next();

  try {
    const db = getDb(c.env.DB);

    const sub = await db.select({
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      trialEnd: subscriptions.trialEnd,
    })
      .from(subscriptions)
      .where(eq(subscriptions.storeId, storeId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1)
      .get();

    if (!sub) return next();

    if (sub.status === "active" || sub.status === "trialing") {
      c.set("subscriptionGrace", false);
      return next();
    }

    if (sub.status === "past_due") {
      c.set("subscriptionGrace", true);
      return next();
    }

    const expiresAt = sub.currentPeriodEnd || sub.trialEnd;
    if (!expiresAt) return next();

    const now = Date.now();
    const expiryMs = new Date(expiresAt).getTime();
    const elapsed = now - expiryMs;

    if (elapsed < 0) return next();

    if (elapsed < GRACE_PERIOD_MS) {
      c.set("subscriptionGrace", true);
      return next();
    }

    if (elapsed < READONLY_PERIOD_MS) {
      const method = c.req.method;
      if (method !== "GET" && method !== "HEAD") {
        const daysRemaining = Math.ceil((READONLY_PERIOD_MS - elapsed) / (24 * 60 * 60 * 1000));
        return c.json({
          error: "Subscription expired — read-only mode",
          code: "SUBSCRIPTION_READ_ONLY",
          detail: { daysRemaining, upgradeUrl: "/billing" },
        }, 403);
      }
      return next();
    }

    return c.json({
      error: "Subscription required",
      code: "SUBSCRIPTION_REQUIRED",
      detail: { upgradeUrl: "/billing" },
    }, 403);
  } catch (err) {
    console.error("[subscription-gating] Error:", err);
    return next();
  }
}
