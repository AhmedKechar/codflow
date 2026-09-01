/**
 * Notification Settings Handlers
 */

import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { eq, and } from "drizzle-orm";
import { notificationSettings } from "@/db/schema";
import { NotFoundError, ValidationError } from "@/lib/errors/classes";
import { ERROR_CODES } from "../../../../cod-shared/errors/codes";
import type { UpsertNotificationSettingInput } from "./validation";

const NOTIFICATION_STATUSES = [
  "new", "confirmed", "unreachable", "busy", "postponed",
  "shipped", "delivered", "cancelled", "fake", "duplicate", "returned",
] as const;

/**
 * GET /notification-settings
 * List all notification settings for the store
 */
export async function listNotificationSettings(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;

  const settings = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.storeId, storeId))
    .all();

  // Ensure all statuses have a setting (create defaults for missing ones)
  const existingStatuses = new Set(settings.map((s) => s.orderStatus));
  const defaults = NOTIFICATION_STATUSES
    .filter((status) => !existingStatuses.has(status))
    .map((status) => ({
      id: crypto.randomUUID(),
      storeId,
      orderStatus: status,
      channel: "both" as const,
      enabled: false,
      templateWhatsapp: null,
      templateSms: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  return c.json({
    success: true,
    data: [...settings, ...defaults],
  }, 200);
}

/**
 * GET /notification-settings/:status
 * Get notification setting for a specific status
 */
export async function getNotificationSetting(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const status = c.req.param("status");

  if (!NOTIFICATION_STATUSES.includes(status as any)) {
    throw new ValidationError("Invalid status", ERROR_CODES.VALIDATION_FAILED);
  }

  const setting = await db
    .select()
    .from(notificationSettings)
    .where(
      and(
        eq(notificationSettings.storeId, storeId),
        eq(notificationSettings.orderStatus, status as any)
      )
    )
    .get();

  if (!setting) {
    throw new NotFoundError("Notification setting", status);
  }

  return c.json({
    success: true,
    data: setting,
  }, 200);
}

/**
 * PUT /notification-settings
 * Upsert a notification setting
 */
export async function upsertNotificationSetting(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const body = await c.req.json() as UpsertNotificationSettingInput;

  const now = new Date().toISOString();

  // Check if setting exists
  const existing = await db
    .select()
    .from(notificationSettings)
    .where(
      and(
        eq(notificationSettings.storeId, storeId),
        eq(notificationSettings.orderStatus, body.orderStatus)
      )
    )
    .get();

  if (existing) {
    // Update
    await db
      .update(notificationSettings)
      .set({
        channel: body.channel,
        enabled: body.enabled,
        templateWhatsapp: body.templateWhatsapp ?? null,
        templateSms: body.templateSms ?? null,
        updatedAt: now,
      })
      .where(eq(notificationSettings.id, existing.id));
  } else {
    // Insert
    await db.insert(notificationSettings).values({
      id: crypto.randomUUID(),
      storeId,
      orderStatus: body.orderStatus,
      channel: body.channel,
      enabled: body.enabled,
      templateWhatsapp: body.templateWhatsapp ?? null,
      templateSms: body.templateSms ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Return updated setting
  const updated = await db
    .select()
    .from(notificationSettings)
    .where(
      and(
        eq(notificationSettings.storeId, storeId),
        eq(notificationSettings.orderStatus, body.orderStatus)
      )
    )
    .get();

  return c.json({
    success: true,
    data: updated,
    message: "Notification setting updated",
  }, 200);
}

/**
 * PUT /notification-settings/bulk
 * Bulk upsert notification settings
 */
export async function bulkUpsertNotificationSettings(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const { settings } = await c.req.json() as { settings: UpsertNotificationSettingInput[] };

  const now = new Date().toISOString();
  const results = [];

  for (const setting of settings) {
    const existing = await db
      .select()
      .from(notificationSettings)
      .where(
        and(
          eq(notificationSettings.storeId, storeId),
          eq(notificationSettings.orderStatus, setting.orderStatus)
        )
      )
      .get();

    if (existing) {
      await db
        .update(notificationSettings)
        .set({
          channel: setting.channel,
          enabled: setting.enabled,
          templateWhatsapp: setting.templateWhatsapp ?? null,
          templateSms: setting.templateSms ?? null,
          updatedAt: now,
        })
        .where(eq(notificationSettings.id, existing.id));
    } else {
      await db.insert(notificationSettings).values({
        id: crypto.randomUUID(),
        storeId,
        orderStatus: setting.orderStatus,
        channel: setting.channel,
        enabled: setting.enabled,
        templateWhatsapp: setting.templateWhatsapp ?? null,
        templateSms: setting.templateSms ?? null,
        createdAt: now,
        updatedAt: now,
      });
    }

    results.push({ status: setting.orderStatus, success: true });
  }

  return c.json({
    success: true,
    data: results,
    message: "Notification settings updated",
  }, 200);
}

/**
 * DELETE /notification-settings/:status
 * Delete a notification setting
 */
export async function deleteNotificationSetting(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const status = c.req.param("status");

  if (!NOTIFICATION_STATUSES.includes(status as any)) {
    throw new ValidationError("Invalid status", ERROR_CODES.VALIDATION_FAILED);
  }

  await db
    .delete(notificationSettings)
    .where(
      and(
        eq(notificationSettings.storeId, storeId),
        eq(notificationSettings.orderStatus, status as any)
      )
    );

  return c.json({
    success: true,
    message: "Notification setting deleted",
  }, 200);
}
