import { eq } from "drizzle-orm";
import { storeOtpConfig } from "../db/schema";
import type { AppDb } from "../db/client";

export interface OtpConfig {
  storeId: string;
  language: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertOtpConfigData {
  apiKey: string;
  language?: string;
  enabled?: boolean;
}

/**
 * Safe projection — returns config WITHOUT the API key.
 * Used by storefront to check if OTP is enabled.
 */
export async function getOtpConfig(
  db: AppDb,
  storeId: string
): Promise<OtpConfig | null> {
  const row = await db
    .select({
      storeId: storeOtpConfig.storeId,
      language: storeOtpConfig.language,
      enabled: storeOtpConfig.enabled,
      createdAt: storeOtpConfig.createdAt,
      updatedAt: storeOtpConfig.updatedAt,
    })
    .from(storeOtpConfig)
    .where(eq(storeOtpConfig.storeId, storeId))
    .get();
  return row ?? null;
}

/**
 * Raw accessor — returns the full row INCLUDING the API key.
 * Server-side only (send/verify paths). Never send to browser.
 */
export async function getOtpConfigRaw(
  db: AppDb,
  storeId: string
): Promise<(OtpConfig & { apiKey: string }) | null> {
  const row = await db
    .select()
    .from(storeOtpConfig)
    .where(eq(storeOtpConfig.storeId, storeId))
    .get();
  return row ?? null;
}

/**
 * Upsert OTP config. Empty apiKey on update = keep existing.
 */
export async function upsertOtpConfig(
  db: AppDb,
  storeId: string,
  data: UpsertOtpConfigData
): Promise<OtpConfig> {
  const now = new Date().toISOString();
  const existing = await getOtpConfigRaw(db, storeId);

  if (existing) {
    const updateData: Record<string, unknown> = { updatedAt: now };
    if (data.apiKey) updateData.apiKey = data.apiKey;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;

    await db
      .update(storeOtpConfig)
      .set(updateData)
      .where(eq(storeOtpConfig.storeId, storeId))
      .run();
  } else {
    await db
      .insert(storeOtpConfig)
      .values({
        id: crypto.randomUUID(),
        storeId,
        apiKey: data.apiKey,
        language: (data.language ?? "ar") as "ar" | "fr" | "en",
        enabled: data.enabled ?? true,
        createdAt: now,
        updatedAt: now,
      } satisfies typeof storeOtpConfig.$inferInsert)
      .run();
  }

  const result = await getOtpConfig(db, storeId);
  return result!;
}
