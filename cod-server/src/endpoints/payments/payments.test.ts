/**
 * Payments Queries — Unit Tests
 *
 * Coverage:
 *  1. getStorePayments / getPaymentById — payment retrieval
 *  2. getPendingPayments — admin query
 *  3. createPayment / approvePayment / rejectPayment — write operations
 */

import { describe, it, expect } from "vitest";
import {
  getStorePayments,
  getPaymentById,
  getPendingPayments,
  createPayment,
  approvePayment,
  rejectPayment,
} from "../../../../cod-shared/queries/payments";
import { makeMockDb, a } from "@/test-utils/mock-db";

const NOW = "2026-01-01T00:00:00.000Z";

function paymentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay_1",
    subscription_id: "sub_1",
    store_id: "test-store",
    amount_dzd: 2000,
    currency: "DZD",
    payment_method: "ccp",
    receipt_url: null,
    receipt_file: null,
    status: "pending",
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    reference_number: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

// ─── getStorePayments ────────────────────────────────────────────────────────

describe("getStorePayments", () => {
  it("returns all payments for a store", async () => {
    const db = makeMockDb([a([paymentRow(), paymentRow({ id: "pay_2", amount_dzd: 5000 })])]);
    const result = await getStorePayments(db, "test-store");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("pay_1");
  });

  it("filters by status", async () => {
    const db = makeMockDb([a([paymentRow({ status: "approved" })])]);
    const result = await getStorePayments(db, "test-store", { status: "approved" });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("approved");
  });

  it("returns empty array for unknown store", async () => {
    const db = makeMockDb([a([])]);
    const result = await getStorePayments(db, "unknown-store");
    expect(result).toHaveLength(0);
  });
});

// ─── getPaymentById ──────────────────────────────────────────────────────────

describe("getPaymentById", () => {
  it("returns payment when found", async () => {
    const db = makeMockDb([a([paymentRow()])]);
    const result = await getPaymentById(db, "pay_1");
    expect(result).toBeDefined();
    expect(result?.id).toBe("pay_1");
    expect(result?.amountDzd).toBe(2000);
  });

  it("returns falsy when payment doesn't exist", async () => {
    const db = makeMockDb([a([])]);
    const result = await getPaymentById(db, "nonexistent");
    expect(result).toBeFalsy();
  });
});

// ─── getPendingPayments ──────────────────────────────────────────────────────

describe("getPendingPayments", () => {
  it("returns pending payments", async () => {
    const db = makeMockDb([a([paymentRow(), paymentRow({ id: "pay_2" })])]);
    const result = await getPendingPayments(db);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no pending payments", async () => {
    const db = makeMockDb([a([])]);
    const result = await getPendingPayments(db);
    expect(result).toHaveLength(0);
  });
});

// ─── createPayment ───────────────────────────────────────────────────────────

describe("createPayment", () => {
  it("creates a payment with pending status", async () => {
    const db = makeMockDb([a([paymentRow()])]);
    const result = await createPayment(db, {
      id: "pay_1",
      subscriptionId: "sub_1",
      storeId: "test-store",
      amountDzd: 2000,
      paymentMethod: "ccp",
    });
    expect(result).toBeDefined();
    expect(result.id).toBe("pay_1");
    expect(result.status).toBe("pending");
  });

  it("creates payment with optional receipt fields", async () => {
    const db = makeMockDb([a([paymentRow({ receipt_url: "https://example.com/receipt.jpg", reference_number: "REF-123" })])]);
    const result = await createPayment(db, {
      id: "pay_2",
      subscriptionId: "sub_1",
      storeId: "test-store",
      amountDzd: 5000,
      paymentMethod: "baridi_mob",
      receiptUrl: "https://example.com/receipt.jpg",
      referenceNumber: "REF-123",
    });
    expect(result).toBeDefined();
    expect(result.receiptUrl).toBe("https://example.com/receipt.jpg");
    expect(result.referenceNumber).toBe("REF-123");
  });
});

// ─── approvePayment ──────────────────────────────────────────────────────────

describe("approvePayment", () => {
  it("approves a payment with reviewer", async () => {
    const db = makeMockDb([a([paymentRow({ status: "approved", reviewed_by: "admin_1", reviewed_at: NOW })])]);
    const result = await approvePayment(db, "pay_1", "admin_1");
    expect(result).toBeDefined();
    expect(result.status).toBe("approved");
    expect(result.reviewedBy).toBe("admin_1");
  });

  it("approves payment with notes", async () => {
    const db = makeMockDb([a([paymentRow({ status: "approved", review_notes: "Looks good" })])]);
    const result = await approvePayment(db, "pay_1", "admin_1", "Looks good");
    expect(result.reviewNotes).toBe("Looks good");
  });
});

// ─── rejectPayment ───────────────────────────────────────────────────────────

describe("rejectPayment", () => {
  it("rejects a payment with reviewer", async () => {
    const db = makeMockDb([a([paymentRow({ status: "rejected", reviewed_by: "admin_1" })])]);
    const result = await rejectPayment(db, "pay_1", "admin_1");
    expect(result).toBeDefined();
    expect(result.status).toBe("rejected");
    expect(result.reviewedBy).toBe("admin_1");
  });

  it("rejects payment with reason notes", async () => {
    const db = makeMockDb([a([paymentRow({ status: "rejected", review_notes: "Invalid receipt" })])]);
    const result = await rejectPayment(db, "pay_1", "admin_1", "Invalid receipt");
    expect(result.reviewNotes).toBe("Invalid receipt");
  });
});
