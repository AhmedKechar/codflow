import { eq } from "drizzle-orm";
import { storeEmailConfig } from "../db/schema";
import type { AppDb } from "../db/client";

export interface EmailConfig {
  storeId: string;
  fromEmail: string;
  fromName: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertEmailConfigData {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  enabled?: boolean;
}

/**
 * Safe projection — returns config WITHOUT the API key.
 * Used by dashboard to display settings.
 */
export async function getEmailConfig(
  db: AppDb,
  storeId: string
): Promise<EmailConfig | null> {
  const row = await db
    .select({
      storeId: storeEmailConfig.storeId,
      fromEmail: storeEmailConfig.fromEmail,
      fromName: storeEmailConfig.fromName,
      enabled: storeEmailConfig.enabled,
      createdAt: storeEmailConfig.createdAt,
      updatedAt: storeEmailConfig.updatedAt,
    })
    .from(storeEmailConfig)
    .where(eq(storeEmailConfig.storeId, storeId))
    .get();
  return row ?? null;
}

/**
 * Raw accessor — returns the full row INCLUDING the API key.
 * Server-side only (send path). Never send to browser.
 */
export async function getEmailConfigRaw(
  db: AppDb,
  storeId: string
): Promise<(EmailConfig & { apiKey: string }) | null> {
  const row = await db
    .select()
    .from(storeEmailConfig)
    .where(eq(storeEmailConfig.storeId, storeId))
    .get();
  return row ?? null;
}

/**
 * Upsert email config. Empty apiKey on update = keep existing.
 */
export async function upsertEmailConfig(
  db: AppDb,
  storeId: string,
  data: UpsertEmailConfigData
): Promise<EmailConfig> {
  const now = new Date().toISOString();
  const existing = await getEmailConfigRaw(db, storeId);

  if (existing) {
    const updateData: Record<string, unknown> = { updatedAt: now };
    if (data.apiKey) updateData.apiKey = data.apiKey;
    if (data.fromEmail) updateData.fromEmail = data.fromEmail;
    if (data.fromName !== undefined) updateData.fromName = data.fromName;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;

    await db
      .update(storeEmailConfig)
      .set(updateData)
      .where(eq(storeEmailConfig.storeId, storeId))
      .run();
  } else {
    await db
      .insert(storeEmailConfig)
      .values({
        id: crypto.randomUUID(),
        storeId,
        apiKey: data.apiKey,
        fromEmail: data.fromEmail,
        fromName: data.fromName ?? null,
        enabled: data.enabled ?? true,
        createdAt: now,
        updatedAt: now,
      } satisfies typeof storeEmailConfig.$inferInsert)
      .run();
  }

  const result = await getEmailConfig(db, storeId);
  return result!;
}
