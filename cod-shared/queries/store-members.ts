/**
 * Store Members & Invitations Queries
 *
 * Manages team members and invitations for stores.
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { storeMembers, invitations, users } from "../db/schema";
import type { AppDb } from "../db/client";

export interface MemberFilters {
  role?: "owner" | "admin" | "staff";
  status?: "active" | "inactive" | "invited";
  limit?: number;
  offset?: number;
}

/** Get all members of a store */
export async function getStoreMembers(db: AppDb, storeId: string, filters?: MemberFilters) {
  const conditions = [eq(storeMembers.storeId, storeId)];

  if (filters?.role) {
    conditions.push(eq(storeMembers.role, filters.role));
  }

  if (filters?.status) {
    conditions.push(eq(storeMembers.status, filters.status));
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  return db.select({
    member: storeMembers,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
  })
    .from(storeMembers)
    .innerJoin(users, eq(storeMembers.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(storeMembers.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

/** Get a single member by ID */
export async function getStoreMemberById(db: AppDb, memberId: string) {
  return db.select({
    member: storeMembers,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
  })
    .from(storeMembers)
    .innerJoin(users, eq(storeMembers.userId, users.id))
    .where(eq(storeMembers.id, memberId))
    .get();
}

/** Check if a user is a member of a store */
export async function isStoreMember(db: AppDb, storeId: string, userId: string) {
  return db.select({ id: storeMembers.id, userId: storeMembers.userId }).from(storeMembers)
    .where(and(
      eq(storeMembers.storeId, storeId),
      eq(storeMembers.userId, userId),
      eq(storeMembers.status, "active")
    ))
    .limit(1)
    .get();
}

/** Add a member to a store */
export async function addStoreMember(db: AppDb, data: {
  id: string;
  userId: string;
  storeId: string;
  role?: "owner" | "admin" | "staff";
  invitedBy?: string | null;
}) {
  const now = new Date().toISOString();
  return db.insert(storeMembers).values({
    id: data.id,
    userId: data.userId,
    storeId: data.storeId,
    role: data.role ?? "staff",
    status: "active",
    invitedBy: data.invitedBy ?? null,
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  }).returning().get();
}

/** Update a member's role */
export async function updateMemberRole(db: AppDb, memberId: string, role: "owner" | "admin" | "staff") {
  const now = new Date().toISOString();
  return db.update(storeMembers)
    .set({ role, updatedAt: now })
    .where(eq(storeMembers.id, memberId))
    .returning()
    .get();
}

/** Remove a member from a store */
export async function removeStoreMember(db: AppDb, memberId: string) {
  return db.delete(storeMembers).where(eq(storeMembers.id, memberId)).returning().get();
}

/** Get pending invitations for a store */
export async function getStoreInvitations(db: AppDb, storeId: string) {
  return db.select().from(invitations)
    .where(eq(invitations.storeId, storeId))
    .orderBy(desc(invitations.createdAt))
    .all();
}

/** Create an invitation */
export async function createInvitation(db: AppDb, data: {
  id: string;
  storeId: string;
  email: string;
  role?: "owner" | "admin" | "staff";
  invitedBy: string;
  token: string;
  expiresAt: string;
}) {
  const now = new Date().toISOString();
  return db.insert(invitations).values({
    id: data.id,
    storeId: data.storeId,
    email: data.email,
    role: data.role ?? "staff",
    invitedBy: data.invitedBy,
    token: data.token,
    expiresAt: data.expiresAt,
    createdAt: now,
  }).returning().get();
}

/** Find invitation by token */
export async function getInvitationByToken(db: AppDb, token: string) {
  return db.select().from(invitations)
    .where(eq(invitations.token, token))
    .get();
}

/** Accept an invitation */
export async function acceptInvitation(db: AppDb, invitationId: string) {
  const now = new Date().toISOString();
  return db.update(invitations)
    .set({ acceptedAt: now })
    .where(eq(invitations.id, invitationId))
    .returning()
    .get();
}

/** Count members in a store */
export async function countStoreMembers(db: AppDb, storeId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(storeMembers)
    .where(and(
      eq(storeMembers.storeId, storeId),
      eq(storeMembers.status, "active")
    ))
    .get();
  return result?.count ?? 0;
}
