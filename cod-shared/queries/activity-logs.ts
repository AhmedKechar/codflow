/**
 * Activity Logs Queries
 *
 * Pure reads for the audit trail.
 */

import { eq, desc, and } from "drizzle-orm";
import { activityLogs } from "../db/schema";
import type { AppDb } from "../db/client";

export interface ActivityLogFilters {
  actorId?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}

export async function listActivityLogs(db: AppDb, storeId: string, filters?: ActivityLogFilters) {
  const conditions = [eq(activityLogs.storeId, storeId)];
  if (filters?.actorId) conditions.push(eq(activityLogs.actorId, filters.actorId));
  if (filters?.entityType)
    conditions.push(eq(activityLogs.entityType, filters.entityType));

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  return db
    .select()
    .from(activityLogs)
    .where(and(...conditions))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

export async function getUserActivityLogs(
  db: AppDb,
  storeId: string,
  userId: string,
  opts?: { limit?: number; offset?: number },
) {
  const limit = opts?.limit ?? 30;
  const offset = opts?.offset ?? 0;

  return db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.storeId, storeId), eq(activityLogs.actorId, userId)))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}
