import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import * as queries from "./queries";
import { createGiftCardSchema, updateGiftCardSchema } from "./validation";
import { NotFoundError, SystemError } from "@/lib/errors/classes";

export async function listGiftCards(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const status = c.req.query("status") as
    | "active"
    | "used"
    | "expired"
    | "disabled"
    | undefined;
  const search = c.req.query("search") ?? undefined;

  const data = await queries.listGiftCards(db, storeId, {
    status,
    search,
  });
  return c.json({ success: true, data, count: data.length }, 200);
}

export async function getGiftCard(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;
  const data = await queries.getGiftCardById(db, storeId, id);
  if (!data) throw new NotFoundError("Gift Card", id);
  return c.json({ success: true, data }, 200);
}

export async function createGiftCard(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const body: any = (c.req as any).valid?.("json");
  const data =
    body ?? createGiftCardSchema.parse(await c.req.json());

  if (data.code) {
    const existing = await queries.getGiftCardByCode(db, storeId, data.code);
    if (existing) {
      return c.json(
        { success: false, error: "A gift card with this code already exists" },
        409,
      );
    }
  }

  const { id } = await queries.createGiftCard(db, storeId, data);
  const result = await queries.getGiftCardById(db, storeId, id);
  if (!result) throw new SystemError("Failed to load created gift card");
  return c.json({ success: true, data: result }, 201);
}

export async function updateGiftCard(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;

  const existing = await queries.getGiftCardById(db, storeId, id);
  if (!existing) throw new NotFoundError("Gift Card", id);

  const body: any = (c.req as any).valid?.("json");
  const data =
    body ?? updateGiftCardSchema.parse(await c.req.json());

  if (data.code) {
    const codeConflict = await queries.getGiftCardByCode(
      db,
      storeId,
      data.code,
    );
    if (codeConflict && codeConflict.id !== id) {
      return c.json(
        {
          success: false,
          error: "A gift card with this code already exists",
        },
        409,
      );
    }
  }

  await queries.updateGiftCard(db, storeId, id, data);
  const result = await queries.getGiftCardById(db, storeId, id);
  if (!result) throw new SystemError("Failed to load updated gift card");
  return c.json({ success: true, data: result }, 200);
}

export async function deleteGiftCard(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;

  const existing = await queries.getGiftCardById(db, storeId, id);
  if (!existing) throw new NotFoundError("Gift Card", id);

  await queries.deleteGiftCard(db, storeId, id);
  return c.json({ success: true }, 200);
}
