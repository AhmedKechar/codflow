import { eq, and, like, sql } from "drizzle-orm";
import { customerGroups, customerGroupMembers, customers } from "../db/schema";
import type { AppDb } from "../db/client";

export interface CustomerGroupFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateCustomerGroupData {
  name: string;
  description?: string | null;
  color?: string;
}

export interface UpdateCustomerGroupData {
  name?: string;
  description?: string | null;
  color?: string;
}

export async function getAllGroups(db: AppDb, storeId: string, filters?: CustomerGroupFilters) {
  const conditions = [eq(customerGroups.storeId, storeId)];
  if (filters?.search) {
    conditions.push(like(customerGroups.name, `%${filters.search}%`));
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  return await db
    .select()
    .from(customerGroups)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .all();
}

export async function getGroupById(db: AppDb, storeId: string, groupId: string) {
  return await db
    .select()
    .from(customerGroups)
    .where(and(eq(customerGroups.id, groupId), eq(customerGroups.storeId, storeId)))
    .get();
}

export async function getGroupWithMembers(db: AppDb, storeId: string, groupId: string) {
  const group = await getGroupById(db, storeId, groupId);
  if (!group) return null;

  const members = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      wilaya: customers.wilaya,
      totalOrders: customers.totalOrders,
      totalSpent: customers.totalSpent,
      assignedAt: customerGroupMembers.assignedAt,
    })
    .from(customerGroupMembers)
    .innerJoin(customers, eq(customerGroupMembers.customerId, customers.id))
    .where(and(eq(customerGroupMembers.groupId, groupId), eq(customerGroups.storeId, storeId)))
    .innerJoin(customerGroups, eq(customerGroups.id, customerGroupMembers.groupId))
    .all();

  return { ...group, members };
}

export async function createGroup(db: AppDb, storeId: string, data: CreateCustomerGroupData) {
  const now = new Date().toISOString();
  const groupId = crypto.randomUUID();

  await db.insert(customerGroups).values({
    id: groupId,
    storeId,
    name: data.name,
    description: data.description ?? null,
    color: data.color ?? "#6366f1",
    memberCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return getGroupById(db, storeId, groupId);
}

export async function updateGroup(
  db: AppDb,
  storeId: string,
  groupId: string,
  data: UpdateCustomerGroupData,
) {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.color !== undefined) updates.color = data.color;

  await db.update(customerGroups).set(updates).where(and(eq(customerGroups.id, groupId), eq(customerGroups.storeId, storeId)));
  return getGroupById(db, storeId, groupId);
}

export async function deleteGroup(db: AppDb, storeId: string, groupId: string) {
  await db.delete(customerGroups).where(and(eq(customerGroups.id, groupId), eq(customerGroups.storeId, storeId)));
}

export async function addMember(db: AppDb, storeId: string, groupId: string, customerId: string) {
  const now = new Date().toISOString();

  await db
    .insert(customerGroupMembers)
    .values({ id: crypto.randomUUID(), storeId, groupId, customerId, assignedAt: now })
    .onConflictDoNothing();

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(customerGroupMembers)
    .innerJoin(customerGroups, eq(customerGroups.id, customerGroupMembers.groupId))
    .where(and(eq(customerGroupMembers.groupId, groupId), eq(customerGroups.storeId, storeId)))
    .get();

  await db
    .update(customerGroups)
    .set({ memberCount: result?.count ?? 0, updatedAt: now })
    .where(and(eq(customerGroups.id, groupId), eq(customerGroups.storeId, storeId)));
}

export async function removeMember(db: AppDb, storeId: string, groupId: string, customerId: string) {
  await db
    .delete(customerGroupMembers)
    .where(
      and(
        eq(customerGroupMembers.groupId, groupId),
        eq(customerGroupMembers.customerId, customerId),
      ),
    );

  const now = new Date().toISOString();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(customerGroupMembers)
    .innerJoin(customerGroups, eq(customerGroups.id, customerGroupMembers.groupId))
    .where(and(eq(customerGroupMembers.groupId, groupId), eq(customerGroups.storeId, storeId)))
    .get();

  await db
    .update(customerGroups)
    .set({ memberCount: result?.count ?? 0, updatedAt: now })
    .where(and(eq(customerGroups.id, groupId), eq(customerGroups.storeId, storeId)));
}
