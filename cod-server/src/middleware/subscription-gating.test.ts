import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subscriptionGating } from "./subscription-gating";
import type { Env } from "@/types/env";

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "@/db";

function mockCtx(opts: { role?: string; method?: string } = {}) {
  const store: Record<string, unknown> = {
    user: { id: "user_1", role: opts.role ?? "staff" },
    storeId: "store_1",
  };
  return {
    req: { method: opts.method ?? "POST" },
    env: { DB: {} } as Env,
    json: vi.fn().mockReturnValue(new Response(null, { status: 403 })),
    get: (key: string) => store[key],
    set: (key: string, val: unknown) => { store[key] = val; },
    _store: store,
  } as any;
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function mockDbChain(subRow: Record<string, unknown> | null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockReturnValue(subRow),
  };
  vi.mocked(getDb).mockReturnValue(chain as any);
  return chain;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("subscriptionGating", () => {
  it("passes through admin users without checking subscription", async () => {
    const c = mockCtx({ role: "admin" });
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
  });

  it("passes through when no storeId is set", async () => {
    const store: Record<string, unknown> = {
      user: { id: "user_1", role: "staff" },
    };
    const c = {
      req: { method: "POST" },
      env: { DB: {} } as Env,
      json: vi.fn(),
      get: (key: string) => store[key],
      set: (key: string, val: unknown) => { store[key] = val; },
    } as any;
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
  });

  it("passes through when no subscription exists", async () => {
    mockDbChain(null);
    const c = mockCtx();
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
  });

  it("passes through when subscription is active", async () => {
    mockDbChain({ status: "active", currentPeriodEnd: daysFromNow(30), trialEnd: null });
    const c = mockCtx();
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("subscriptionGrace")).toBe(false);
  });

  it("passes through when subscription is trialing", async () => {
    mockDbChain({ status: "trialing", currentPeriodEnd: daysFromNow(15), trialEnd: daysFromNow(15) });
    const c = mockCtx();
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
  });

  it("passes through with grace flag when subscription is past_due", async () => {
    mockDbChain({ status: "past_due", currentPeriodEnd: daysAgo(10), trialEnd: null });
    const c = mockCtx();
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("subscriptionGrace")).toBe(true);
  });

  it("passes through with grace flag when expired less than 7 days", async () => {
    mockDbChain({ status: "canceled", currentPeriodEnd: daysAgo(3), trialEnd: null });
    const c = mockCtx();
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("subscriptionGrace")).toBe(true);
  });

  it("blocks POST when expired 8-30 days (read-only)", async () => {
    mockDbChain({ status: "canceled", currentPeriodEnd: daysAgo(15), trialEnd: null });
    const c = mockCtx({ method: "POST" });
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SUBSCRIPTION_READ_ONLY" }),
      403,
    );
  });

  it("allows GET when expired 8-30 days (read-only)", async () => {
    mockDbChain({ status: "canceled", currentPeriodEnd: daysAgo(15), trialEnd: null });
    const c = mockCtx({ method: "GET" });
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows HEAD when expired 8-30 days (read-only)", async () => {
    mockDbChain({ status: "canceled", currentPeriodEnd: daysAgo(15), trialEnd: null });
    const c = mockCtx({ method: "HEAD" });
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks DELETE when expired 8-30 days (read-only)", async () => {
    mockDbChain({ status: "canceled", currentPeriodEnd: daysAgo(15), trialEnd: null });
    const c = mockCtx({ method: "DELETE" });
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SUBSCRIPTION_READ_ONLY" }),
      403,
    );
  });

  it("blocks all requests when expired 30+ days", async () => {
    mockDbChain({ status: "canceled", currentPeriodEnd: daysAgo(45), trialEnd: null });
    const c = mockCtx({ method: "GET" });
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SUBSCRIPTION_REQUIRED" }),
      403,
    );
  });

  it("returns 500 on DB error (fail-closed)", async () => {
    vi.mocked(getDb).mockImplementation(() => { throw new Error("DB down"); });
    const c = mockCtx();
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SUBSCRIPTION_CHECK_FAILED" }),
      500,
    );
  });

  it("passes through when no expiry date is set", async () => {
    mockDbChain({ status: "canceled", currentPeriodEnd: null, trialEnd: null });
    const c = mockCtx();
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
  });

  it("passes through when expiry is in the future (not yet expired)", async () => {
    mockDbChain({ status: "canceled", currentPeriodEnd: daysFromNow(5), trialEnd: null });
    const c = mockCtx();
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
  });

  it("uses trialEnd when currentPeriodEnd is null", async () => {
    mockDbChain({ status: "canceled", currentPeriodEnd: null, trialEnd: daysAgo(3) });
    const c = mockCtx();
    const next = vi.fn();
    await subscriptionGating(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("subscriptionGrace")).toBe(true);
  });
});
