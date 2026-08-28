import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import * as queries from "../../../../cod-shared/queries/custom-domains";
import {
  createCustomDomainSchema,
  updateCustomDomainSchema,
} from "./validation";
import { NotFoundError, SystemError } from "@/lib/errors/classes";

export async function listCustomDomains(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const data = await queries.listCustomDomains(db, storeId);
  return c.json({ success: true, data, count: data.length }, 200);
}

export async function getCustomDomain(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;
  const data = await queries.getCustomDomainById(db, storeId, id);
  if (!data) throw new NotFoundError("Custom Domain", id);
  return c.json({ success: true, data }, 200);
}

export async function createCustomDomain(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const body: any = (c.req as any).valid?.("json");
  const data =
    body ?? createCustomDomainSchema.parse(await c.req.json());

  const existing = await queries.getCustomDomainByDomain(
    db,
    storeId,
    data.domain,
  );
  if (existing) {
    return c.json(
      { success: false, error: "A custom domain with this name already exists" },
      409,
    );
  }

  const { id } = await queries.createCustomDomain(db, storeId, data);
  const result = await queries.getCustomDomainById(db, storeId, id);
  if (!result) throw new SystemError("Failed to load created custom domain");
  return c.json({ success: true, data: result }, 201);
}

export async function updateCustomDomain(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;

  const existing = await queries.getCustomDomainById(db, storeId, id);
  if (!existing) throw new NotFoundError("Custom Domain", id);

  const body: any = (c.req as any).valid?.("json");
  const data =
    body ?? updateCustomDomainSchema.parse(await c.req.json());

  if (data.domain) {
    const conflict = await queries.getCustomDomainByDomain(
      db,
      storeId,
      data.domain,
    );
    if (conflict && conflict.id !== id) {
      return c.json(
        {
          success: false,
          error: "A custom domain with this name already exists",
        },
        409,
      );
    }
  }

  await queries.updateCustomDomain(db, storeId, id, data);
  const result = await queries.getCustomDomainById(db, storeId, id);
  if (!result) throw new SystemError("Failed to load updated custom domain");
  return c.json({ success: true, data: result }, 200);
}

export async function deleteCustomDomain(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;

  const existing = await queries.getCustomDomainById(db, storeId, id);
  if (!existing) throw new NotFoundError("Custom Domain", id);

  await queries.deleteCustomDomain(db, storeId, id);
  return c.json({ success: true }, 200);
}

export async function verifyCustomDomain(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const id = c.req.param("id")!;

  const existing = await queries.getCustomDomainById(db, storeId, id);
  if (!existing) throw new NotFoundError("Custom Domain", id);

  await queries.updateCustomDomain(db, storeId, id, { status: "verifying" });

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const result = await queries.verifyCustomDomain(db, storeId, id);
  if (!result) throw new SystemError("Failed to verify custom domain");
  return c.json({ success: true, data: result }, 200);
}
