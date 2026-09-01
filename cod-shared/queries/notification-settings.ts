import { eq, and } from "drizzle-orm";
import { notificationSettings } from "../db/schema";
import type { AppDb } from "../db/client";

export type NotificationChannel = "whatsapp" | "sms" | "both";
export type NotificationStatus = "new" | "confirmed" | "unreachable" | "busy" | "postponed" | "shipped" | "delivered" | "cancelled" | "fake" | "duplicate" | "returned";

export interface NotificationSettingData {
  orderStatus: NotificationStatus;
  channel: NotificationChannel;
  enabled: boolean;
  templateWhatsapp?: string;
  templateSms?: string;
}

export async function getNotificationSettingsByStore(
  db: AppDb,
  storeId: string
) {
  return await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.storeId, storeId))
    .all();
}

export async function getNotificationSetting(
  db: AppDb,
  storeId: string,
  orderStatus: NotificationStatus
) {
  return await db
    .select()
    .from(notificationSettings)
    .where(
      and(
        eq(notificationSettings.storeId, storeId),
        eq(notificationSettings.orderStatus, orderStatus)
      )
    )
    .get() || null;
}

export async function upsertNotificationSetting(
  db: AppDb,
  storeId: string,
  data: NotificationSettingData
) {
  const now = new Date().toISOString();

  const existing = await getNotificationSetting(db, storeId, data.orderStatus);

  if (existing) {
    await db
      .update(notificationSettings)
      .set({
        channel: data.channel,
        enabled: data.enabled,
        templateWhatsapp: data.templateWhatsapp ?? null,
        templateSms: data.templateSms ?? null,
        updatedAt: now,
      })
      .where(eq(notificationSettings.id, existing.id));

    return getNotificationSetting(db, storeId, data.orderStatus);
  }

  const id = crypto.randomUUID();
  const record = {
    id,
    storeId,
    orderStatus: data.orderStatus,
    channel: data.channel,
    enabled: data.enabled,
    templateWhatsapp: data.templateWhatsapp ?? null,
    templateSms: data.templateSms ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(notificationSettings).values(record);

  return record;
}

export async function bulkUpsertNotificationSettings(
  db: AppDb,
  storeId: string,
  settings: NotificationSettingData[]
) {
  const results = [];
  for (const setting of settings) {
    const result = await upsertNotificationSetting(db, storeId, setting);
    results.push(result);
  }
  return results;
}

export async function deleteNotificationSetting(
  db: AppDb,
  storeId: string,
  orderStatus: NotificationStatus
) {
  await db
    .delete(notificationSettings)
    .where(
      and(
        eq(notificationSettings.storeId, storeId),
        eq(notificationSettings.orderStatus, orderStatus)
      )
    );
}

export async function isNotificationEnabled(
  db: AppDb,
  storeId: string,
  orderStatus: NotificationStatus,
  channel: "whatsapp" | "sms"
): Promise<boolean> {
  const setting = await getNotificationSetting(db, storeId, orderStatus);
  if (!setting || !setting.enabled) return false;
  return setting.channel === "both" || setting.channel === channel;
}
