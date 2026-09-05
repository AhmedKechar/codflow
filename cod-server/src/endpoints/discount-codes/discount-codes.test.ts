import { describe, it, expect } from "vitest";
import { createDiscountCodeSchema, updateDiscountCodeSchema } from "./validation";
import {
  listDiscountCodes,
  getDiscountCodeById,
  getDiscountCodeByCode,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  validateDiscountCode,
  applyDiscountCode,
} from "./queries";
import { makeMockDb, f, a } from "@/test-utils/mock-db";

const NOW = "2026-01-01T00:00:00.000Z";

function discountRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "dc_1",
    store_id: "test-store",
    code: "SAVE10",
    type: "percentage",
    value: 10,
    min_order_amount: null,
    max_uses: null,
    used_count: 0,
    starts_at: null,
    expires_at: null,
    status: "active",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

describe("createDiscountCodeSchema", () => {
  it("accepts valid percentage code", () => {
    const result = createDiscountCodeSchema.safeParse({
      code: "SAVE10",
      type: "percentage",
      value: 10,
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid fixed code", () => {
    const result = createDiscountCodeSchema.safeParse({
      code: "FLAT500",
      type: "fixed",
      value: 500,
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("rejects code shorter than 3 chars", () => {
    expect(createDiscountCodeSchema.safeParse({ code: "AB", type: "percentage", value: 10, status: "active" }).success).toBe(false);
  });

  it("rejects code with special characters", () => {
    expect(createDiscountCodeSchema.safeParse({ code: "SAVE 10!", type: "percentage", value: 10, status: "active" }).success).toBe(false);
  });

  it("rejects zero value", () => {
    expect(createDiscountCodeSchema.safeParse({ code: "SAVE10", type: "percentage", value: 0, status: "active" }).success).toBe(false);
  });

  it("rejects negative value", () => {
    expect(createDiscountCodeSchema.safeParse({ code: "SAVE10", type: "percentage", value: -5, status: "active" }).success).toBe(false);
  });

  it("accepts hyphenated code", () => {
    expect(createDiscountCodeSchema.safeParse({ code: "MY-CODE", type: "percentage", value: 10, status: "active" }).success).toBe(true);
  });
});

describe("updateDiscountCodeSchema", () => {
  it("accepts partial update", () => {
    const result = updateDiscountCodeSchema.safeParse({ value: 20 });
    expect(result.success).toBe(true);
  });

  it("accepts empty update", () => {
    const result = updateDiscountCodeSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("createDiscountCode", () => {
  it("inserts a new discount code", async () => {
    const db = makeMockDb([f(null)]);
    const result = await createDiscountCode(db, "test-store", {
      code: "SAVE10",
      type: "percentage",
      value: 10,
      status: "active",
    });
    expect(result.id).toBeDefined();
  });
});

describe("getDiscountCodeById", () => {
  it("returns discount code when found", async () => {
    const db = makeMockDb([f(discountRow())]);
    const result = await getDiscountCodeById(db, "test-store", "dc_1");
    expect(result).not.toBeNull();
    expect(result?.code).toBe("SAVE10");
  });

  it("returns null when not found", async () => {
    const db = makeMockDb([f(null)]);
    const result = await getDiscountCodeById(db, "test-store", "nonexistent");
    expect(result == null).toBe(true);
  });
});

describe("getDiscountCodeByCode", () => {
  it("returns discount code by code string", async () => {
    const db = makeMockDb([f(discountRow())]);
    const result = await getDiscountCodeByCode(db, "test-store", "save10");
    expect(result).not.toBeNull();
    expect(result?.code).toBe("SAVE10");
  });

  it("returns null for unknown code", async () => {
    const db = makeMockDb([f(null)]);
    const result = await getDiscountCodeByCode(db, "test-store", "UNKNOWN");
    expect(result == null).toBe(true);
  });
});

describe("updateDiscountCode", () => {
  it("updates code fields", async () => {
    const db = makeMockDb([f(null)]);
    await updateDiscountCode(db, "test-store", "dc_1", { value: 20 });
  });
});

describe("deleteDiscountCode", () => {
  it("deletes a discount code", async () => {
    const db = makeMockDb([f(null)]);
    await deleteDiscountCode(db, "test-store", "dc_1");
  });
});

describe("validateDiscountCode", () => {
  it("returns valid for active code", async () => {
    const db = makeMockDb([f(discountRow({ value: 10, type: "percentage", status: "active" }))]);
    const result = await validateDiscountCode(db, "test-store", "SAVE10", 1000);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.discountAmount).toBe(100);
    }
  });

  it("returns invalid for unknown code", async () => {
    const db = makeMockDb([f(null)]);
    const result = await validateDiscountCode(db, "test-store", "UNKNOWN", 1000);
    expect(result.valid).toBe(false);
  });

  it("returns invalid for inactive code", async () => {
    const db = makeMockDb([f(discountRow({ status: "inactive" }))]);
    const result = await validateDiscountCode(db, "test-store", "SAVE10", 1000);
    expect(result.valid).toBe(false);
  });

  it("returns invalid when usage limit reached", async () => {
    const db = makeMockDb([f(discountRow({ max_uses: 1, used_count: 1 }))]);
    const result = await validateDiscountCode(db, "test-store", "SAVE10", 1000);
    expect(result.valid).toBe(false);
  });

  it("returns invalid when min order not met", async () => {
    const db = makeMockDb([f(discountRow({ min_order_amount: 500 }))]);
    const result = await validateDiscountCode(db, "test-store", "SAVE10", 100);
    expect(result.valid).toBe(false);
  });

  it("calculates percentage discount", async () => {
    const db = makeMockDb([f(discountRow({ type: "percentage", value: 15 }))]);
    const result = await validateDiscountCode(db, "test-store", "SAVE10", 2000);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.discountAmount).toBe(300);
    }
  });

  it("calculates fixed discount capped at order amount", async () => {
    const db = makeMockDb([f(discountRow({ type: "fixed", value: 500 }))]);
    const result = await validateDiscountCode(db, "test-store", "SAVE10", 300);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.discountAmount).toBe(300);
    }
  });

  it("returns invalid for expired code", async () => {
    const db = makeMockDb([f(discountRow({ expires_at: "2020-01-01T00:00:00.000Z" }))]);
    const result = await validateDiscountCode(db, "test-store", "SAVE10", 1000);
    expect(result.valid).toBe(false);
  });

  it("returns invalid for not-yet-started code", async () => {
    const db = makeMockDb([f(discountRow({ starts_at: "2030-01-01T00:00:00.000Z" }))]);
    const result = await validateDiscountCode(db, "test-store", "SAVE10", 1000);
    expect(result.valid).toBe(false);
  });
});

describe("applyDiscountCode", () => {
  it("increments used count", async () => {
    const db = makeMockDb([f(null)]);
    await applyDiscountCode(db, "test-store", "SAVE10");
  });
});
