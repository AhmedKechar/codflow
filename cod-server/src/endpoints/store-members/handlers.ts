import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import * as queries from "../../../../cod-shared/queries/store-members";
import { NotFoundError } from "@/lib/errors/classes";

export async function listMembers(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const role = c.req.query("role") as any;
  const limit = Number(c.req.query("limit") ?? 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const data = await queries.getStoreMembers(db, storeId, { role, limit, offset });
  return c.json({ success: true, data, count: data.length }, 200);
}

export async function getMember(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const id = c.req.param("id")!;
  const data = await queries.getStoreMemberById(db, id);
  if (!data) throw new NotFoundError("Member", id);
  return c.json({ success: true, data }, 200);
}

export async function updateRole(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const existing = await queries.getStoreMemberById(db, id);
  if (!existing) throw new NotFoundError("Member", id);
  const data = await queries.updateMemberRole(db, id, body.role);
  return c.json({ success: true, data }, 200);
}

export async function removeMember(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const id = c.req.param("id")!;
  const existing = await queries.getStoreMemberById(db, id);
  if (!existing) throw new NotFoundError("Member", id);
  await queries.removeStoreMember(db, id);
  return c.json({ success: true }, 200);
}

export async function listInvitations(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const data = await queries.getStoreInvitations(db, storeId);
  return c.json({ success: true, data, count: data.length }, 200);
}

export async function sendInvitation(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const user = c.get("user")!;
  const body = await c.req.json();
  const { email, role } = body;
  if (!email) return c.json({ error: "email is required" }, 400);
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const data = await queries.createInvitation(db, {
    id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    storeId,
    email,
    role: role ?? "staff",
    invitedBy: user.id,
    token,
    expiresAt,
  });
  return c.json({ success: true, data }, 201);
}
