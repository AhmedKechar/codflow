/**
 * AI Credits Queries — Unit Tests
 *
 * Coverage:
 *  1. getAiCredits — balance retrieval with auto-creation
 *  2. getAiCreditUsageHistory / recordAiUsage — usage tracking
 *  3. hasEnoughCredits — balance check
 */

import { describe, it, expect } from "vitest";
import {
  getAiCredits,
  getAiCreditUsageHistory,
  recordAiUsage,
  hasEnoughCredits,
} from "../../../../cod-shared/queries/ai-credits";
import { makeMockDb, a } from "@/test-utils/mock-db";

const NOW = "2026-01-01T00:00:00.000Z";

function aiCreditRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "aic_test-store",
    store_id: "test-store",
    total_credits: 100,
    used_credits: 30,
    period_start: null,
    period_end: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function aiUsageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "usage_1",
    store_id: "test-store",
    agent_type: "marketing",
    operation: "generate_post",
    model: "gpt-4",
    credits_used: 5,
    tokens_in: 500,
    tokens_out: 200,
    request_summary: "Generated Instagram post",
    created_at: NOW,
    ...overrides,
  };
}

// ─── getAiCredits ────────────────────────────────────────────────────────────

describe("getAiCredits", () => {
  it("returns existing credits for a store", async () => {
    const db = makeMockDb([a([aiCreditRow()])]);
    const result = await getAiCredits(db, "test-store");
    expect(result).toBeDefined();
    expect(result!.id).toBe("aic_test-store");
    expect(result!.totalCredits).toBe(100);
    expect(result!.usedCredits).toBe(30);
  });

  it("returns null-like when no credits exist (triggers auto-creation)", async () => {
    const db = makeMockDb([a([]), a([aiCreditRow({ total_credits: 0, used_credits: 0 })])]);
    const result = await getAiCredits(db, "new-store");
    expect(result).toBeDefined();
    expect(result!.totalCredits).toBe(0);
  });
});

// ─── getAiCreditUsageHistory ────────────────────────────────────────────────

describe("getAiCreditUsageHistory", () => {
  it("returns usage history for a store", async () => {
    const db = makeMockDb([a([aiUsageRow(), aiUsageRow({ id: "usage_2", agent_type: "finance" })])]);
    const result = await getAiCreditUsageHistory(db, "test-store");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("usage_1");
  });

  it("filters by agent type", async () => {
    const db = makeMockDb([a([aiUsageRow({ agent_type: "design" })])]);
    const result = await getAiCreditUsageHistory(db, "test-store", { agentType: "design" });
    expect(result).toHaveLength(1);
    expect(result[0].agentType).toBe("design");
  });

  it("returns empty array when no usage exists", async () => {
    const db = makeMockDb([a([])]);
    const result = await getAiCreditUsageHistory(db, "no-store");
    expect(result).toHaveLength(0);
  });
});

// ─── recordAiUsage ───────────────────────────────────────────────────────────

describe("recordAiUsage", () => {
  it("records usage and returns the record", async () => {
    const db = makeMockDb([a([aiUsageRow()]), a([aiCreditRow({ used_credits: 35 })])]);
    const result = await recordAiUsage(db, {
      id: "usage_1",
      storeId: "test-store",
      agentType: "marketing",
      operation: "generate_post",
      model: "gpt-4",
      creditsUsed: 5,
      tokensIn: 500,
      tokensOut: 200,
      requestSummary: "Generated Instagram post",
    });
    expect(result).toBeDefined();
    expect(result.id).toBe("usage_1");
    expect(result.creditsUsed).toBe(5);
  });

  it("records usage with minimal fields", async () => {
    const db = makeMockDb([a([aiUsageRow({ tokens_in: null, tokens_out: null, request_summary: null })]), a([])]);
    const result = await recordAiUsage(db, {
      id: "usage_2",
      storeId: "test-store",
      agentType: "finance",
      operation: "analyze",
      model: "gpt-3.5-turbo",
      creditsUsed: 1,
    });
    expect(result).toBeDefined();
    expect(result.tokensIn).toBeNull();
  });
});

// ─── hasEnoughCredits ────────────────────────────────────────────────────────

describe("hasEnoughCredits", () => {
  it("returns true when sufficient credits remain", async () => {
    const db = makeMockDb([a([aiCreditRow({ total_credits: 100, used_credits: 30 })])]);
    const result = await hasEnoughCredits(db, "test-store", 50);
    expect(result).toBe(true);
  });

  it("returns false when insufficient credits", async () => {
    const db = makeMockDb([a([aiCreditRow({ total_credits: 100, used_credits: 95 })])]);
    const result = await hasEnoughCredits(db, "test-store", 10);
    expect(result).toBe(false);
  });

  it("returns true when credits are exactly enough", async () => {
    const db = makeMockDb([a([aiCreditRow({ total_credits: 100, used_credits: 80 })])]);
    const result = await hasEnoughCredits(db, "test-store", 20);
    expect(result).toBe(true);
  });
});
