import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import * as queries from "../../../../cod-shared/queries/payments";
import { NotFoundError } from "@/lib/errors/classes";

export async function listMyPayments(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const status = c.req.query("status") as any;
  const limit = Number(c.req.query("limit") ?? 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const data = await queries.getStorePayments(db, storeId, { status, limit, offset });
  return c.json({ success: true, data, count: data.length }, 200);
}

export async function getPayment(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const id = c.req.param("id")!;
  const data = await queries.getPaymentById(db, id);
  if (!data) throw new NotFoundError("Payment", id);
  return c.json({ success: true, data }, 200);
}

export async function submitPayment(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const body = await c.req.json();
  const { subscriptionId, amountDzd, paymentMethod, receiptUrl, receiptFile, referenceNumber } = body;

  if (!subscriptionId || !amountDzd || !paymentMethod) {
    return c.json({ error: "subscriptionId, amountDzd, and paymentMethod are required" }, 400);
  }

  const data = await queries.createPayment(db, {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    subscriptionId,
    storeId,
    amountDzd,
    paymentMethod,
    receiptUrl: receiptUrl ?? null,
    receiptFile: receiptFile ?? null,
    referenceNumber: referenceNumber ?? null,
  });
  return c.json({ success: true, data }, 201);
}

export async function listPendingPayments(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const limit = Number(c.req.query("limit") ?? 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const data = await queries.getPendingPayments(db, limit, offset);
  return c.json({ success: true, data, count: data.length }, 200);
}

export async function approvePayment(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const id = c.req.param("id")!;
  const user = c.get("user")!;
  const body = await c.req.json().catch(() => ({}));
  const existing = await queries.getPaymentById(db, id);
  if (!existing) throw new NotFoundError("Payment", id);
  const data = await queries.approvePayment(db, id, user.id, body.notes);
  return c.json({ success: true, data }, 200);
}

export async function rejectPayment(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const id = c.req.param("id")!;
  const user = c.get("user")!;
  const body = await c.req.json().catch(() => ({}));
  const existing = await queries.getPaymentById(db, id);
  if (!existing) throw new NotFoundError("Payment", id);
  const data = await queries.rejectPayment(db, id, user.id, body.notes);
  return c.json({ success: true, data }, 200);
}
