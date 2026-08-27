/**
 * Provider API Keys Queries
 *
 * Manages third-party provider API keys (KIE, Yalidine, etc.).
 * Super Admin only — keys are platform-wide, not store-scoped.
 */

import { eq, and, desc } from "drizzle-orm";
import { providerApiKeys } from "../db/schema";
import type { AppDb } from "../db/client";

export interface ProviderKeyFilters {
  provider?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/** Get all provider API keys */
export async function getAllProviderKeys(db: AppDb, filters?: ProviderKeyFilters) {
  const conditions = [];

  if (filters?.provider) {
    conditions.push(eq(providerApiKeys.provider, filters.provider));
  }

  if (filters?.isActive !== undefined) {
    conditions.push(eq(providerApiKeys.isActive, filters.isActive));
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  if (conditions.length > 0) {
    return db.select().from(providerApiKeys)
      .where(and(...conditions))
      .orderBy(desc(providerApiKeys.createdAt))
      .limit(limit)
      .offset(offset)
      .all();
  }

  return db.select().from(providerApiKeys)
    .orderBy(desc(providerApiKeys.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

/** Get a single provider key by ID */
export async function getProviderKeyById(db: AppDb, keyId: string) {
  return db.select().from(providerApiKeys).where(eq(providerApiKeys.id, keyId)).get();
}

/** Get active key for a specific provider */
export async function getActiveKeyForProvider(db: AppDb, provider: string) {
  return db.select().from(providerApiKeys)
    .where(and(
      eq(providerApiKeys.provider, provider),
      eq(providerApiKeys.isActive, true)
    ))
    .limit(1)
    .get();
}

/** Create a new provider API key */
export async function createProviderKey(db: AppDb, data: {
  id: string;
  provider: string;
  keyName: string;
  keyValue: string;
  expiresAt?: string | null;
}) {
  const now = new Date().toISOString();
  return db.insert(providerApiKeys).values({
    id: data.id,
    provider: data.provider,
    keyName: data.keyName,
    keyValue: data.keyValue,
    isActive: true,
    expiresAt: data.expiresAt ?? null,
    createdAt: now,
    updatedAt: now,
  }).returning().get();
}

/** Update a provider API key */
export async function updateProviderKey(db: AppDb, keyId: string, data: {
  keyValue?: string;
  isActive?: boolean;
  expiresAt?: string | null;
}) {
  const now = new Date().toISOString();
  return db.update(providerApiKeys)
    .set({ ...data, updatedAt: now })
    .where(eq(providerApiKeys.id, keyId))
    .returning()
    .get();
}

/** Delete a provider API key */
export async function deleteProviderKey(db: AppDb, keyId: string) {
  return db.delete(providerApiKeys).where(eq(providerApiKeys.id, keyId)).returning().get();
}

/** Record key usage */
export async function recordKeyUsage(db: AppDb, keyId: string) {
  const now = new Date().toISOString();
  return db.update(providerApiKeys)
    .set({ lastUsedAt: now, updatedAt: now })
    .where(eq(providerApiKeys.id, keyId))
    .returning()
    .get();
}
