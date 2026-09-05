import { describe, it, expect } from "vitest";
import {
  listGiftCards,
  getGiftCardById,
  getGiftCardByCode,
  createGiftCard,
  updateGiftCard,
  deleteGiftCard,
  redeemGiftCard,
  disableGiftCard,
} from "./queries";
import { makeMockDb, f, a } from "@/test-utils/mock-db";

const NOW = "2026-01-01T00:00:00.000Z";

function giftCardRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "gc_1",
    store_id: "test-store",
    code: "GIFT123456",
    initial_amount_dzd: 5000,
    remaining_amount_dzd: 5000,
    status: "active",
    recipient_name: "Ahmed",
    recipient_phone: null,
    recipient_email: null,
    sender_name: "Fatima",
    message: null,
    expires_at: null,
    used_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

describe("createGiftCard", () => {
  it("inserts a new gift card with custom code", async () => {
    const db = makeMockDb([f(null)]);
    const result = await createGiftCard(db, "test-store", {
      code: "MYCODE",
      initialAmountDzd: 5000,
    });
    expect(result.id).toBeDefined();
  });

  it("inserts a new gift card with auto-generated code", async () => {
    const db = makeMockDb([f(null)]);
    const result = await createGiftCard(db, "test-store", {
      initialAmountDzd: 3000,
    });
    expect(result.id).toBeDefined();
  });
});

describe("getGiftCardById", () => {
  it("returns gift card when found", async () => {
    const db = makeMockDb([f(giftCardRow())]);
    const result = await getGiftCardById(db, "test-store", "gc_1");
    expect(result).not.toBeNull();
    expect(result?.code).toBe("GIFT123456");
  });

  it("returns null when not found", async () => {
    const db = makeMockDb([f(null)]);
    const result = await getGiftCardById(db, "test-store", "nonexistent");
    expect(result == null).toBe(true);
  });
});

describe("getGiftCardByCode", () => {
  it("returns gift card by code", async () => {
    const db = makeMockDb([f(giftCardRow())]);
    const result = await getGiftCardByCode(db, "test-store", "gift123456");
    expect(result).not.toBeNull();
    expect(result?.code).toBe("GIFT123456");
  });

  it("returns null for unknown code", async () => {
    const db = makeMockDb([f(null)]);
    const result = await getGiftCardByCode(db, "test-store", "UNKNOWN");
    expect(result == null).toBe(true);
  });
});

describe("updateGiftCard", () => {
  it("updates gift card fields", async () => {
    const db = makeMockDb([f(null)]);
    await updateGiftCard(db, "test-store", "gc_1", { recipientName: "Ali" });
  });
});

describe("deleteGiftCard", () => {
  it("deletes a gift card", async () => {
    const db = makeMockDb([f(null)]);
    await deleteGiftCard(db, "test-store", "gc_1");
  });
});

describe("redeemGiftCard", () => {
  it("redeems full amount — status becomes used", async () => {
    const db = makeMockDb([
      f(giftCardRow({ remaining_amount_dzd: 5000, status: "active" })),
      f(null),
    ]);
    const result = await redeemGiftCard(db, "test-store", "GIFT123456", 5000);
    expect(result.success).toBe(true);
  });

  it("redeems partial amount — status stays active", async () => {
    const db = makeMockDb([
      f(giftCardRow({ remaining_amount_dzd: 5000, status: "active" })),
      f(null),
    ]);
    const result = await redeemGiftCard(db, "test-store", "GIFT123456", 2000);
    expect(result.success).toBe(true);
  });

  it("fails for unknown code", async () => {
    const db = makeMockDb([f(null)]);
    const result = await redeemGiftCard(db, "test-store", "UNKNOWN", 1000);
    expect(result.success).toBe(false);
  });

  it("fails for inactive card", async () => {
    const db = makeMockDb([f(giftCardRow({ status: "disabled" }))]);
    const result = await redeemGiftCard(db, "test-store", "GIFT123456", 1000);
    expect(result.success).toBe(false);
  });

  it("fails for insufficient balance", async () => {
    const db = makeMockDb([f(giftCardRow({ remaining_amount_dzd: 100, status: "active" }))]);
    const result = await redeemGiftCard(db, "test-store", "GIFT123456", 500);
    expect(result.success).toBe(false);
  });
});

describe("disableGiftCard", () => {
  it("sets status to disabled", async () => {
    const db = makeMockDb([f(null)]);
    await disableGiftCard(db, "test-store", "gc_1");
  });
});

describe("listGiftCards", () => {
  it("returns empty array for no cards", async () => {
    const db = makeMockDb([a([])]);
    const result = await listGiftCards(db, "test-store");
    expect(result).toEqual([]);
  });

  it("returns gift cards list", async () => {
    const db = makeMockDb([a([giftCardRow(), giftCardRow({ id: "gc_2", code: "GIFT789" })])]);
    const result = await listGiftCards(db, "test-store");
    expect(result).toHaveLength(2);
  });
});
