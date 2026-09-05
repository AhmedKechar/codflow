import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import * as queries from "./queries";
import { createDiscountCodeSchema, updateDiscountCodeSchema } from "./validation";
import { NotFoundError, SystemError, ConflictError } from "@/lib/errors/classes";

export async function listDiscountCodes(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const status = c.req.query("status") as
    | "active"
    | "inactive"
    | "expired"
    | undefined;
  const search = c.req.query("search") ?? undefined;

  const data = await queries.listDiscountCodes(db, storeId, {
    status,
    search,
  });
  return c.json({ success: true, data, count: data.length }, 200);
}

export async function getDiscountCode(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;
  const data = await queries.getDiscountCodeById(db, storeId, id);
  if (!data) throw new NotFoundError("Discount Code", id);
  return c.json({ success: true, data }, 200);
}

export async function createDiscountCode(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const body: any = (c.req as any).valid?.("json");
  const data =
    body ?? createDiscountCodeSchema.parse(await c.req.json());

  const existing = await queries.getDiscountCodeByCode(
    db,
    storeId,
    data.code,
  );
  if (existing) {
    throw new ConflictError("A discount code with this code already exists", "DUPLICATE_ENTITY");
  }

  const { id } = await queries.createDiscountCode(db, storeId, data);
  const result = await queries.getDiscountCodeById(db, storeId, id);
  if (!result) throw new SystemError("Failed to load created discount code");
  return c.json({ success: true, data: result }, 201);
}

export async function updateDiscountCode(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;

  const existing = await queries.getDiscountCodeById(db, storeId, id);
  if (!existing) throw new NotFoundError("Discount Code", id);

  const body: any = (c.req as any).valid?.("json");
  const data =
    body ?? updateDiscountCodeSchema.parse(await c.req.json());

  if (data.code) {
    const codeConflict = await queries.getDiscountCodeByCode(
      db,
      storeId,
      data.code,
    );
    if (codeConflict && codeConflict.id !== id) {
      throw new ConflictError("A discount code with this code already exists", "DUPLICATE_ENTITY");
    }
  }

  await queries.updateDiscountCode(db, storeId, id, data);
  const result = await queries.getDiscountCodeById(db, storeId, id);
  if (!result) throw new SystemError("Failed to load updated discount code");
  return c.json({ success: true, data: result }, 200);
}

export async function deleteDiscountCode(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;

  const existing = await queries.getDiscountCodeById(db, storeId, id);
  if (!existing) throw new NotFoundError("Discount Code", id);

  await queries.deleteDiscountCode(db, storeId, id);
  return c.json({ success: true }, 200);
}
