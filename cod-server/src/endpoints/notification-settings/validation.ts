/**
 * Notification Settings Validation Schemas
 */

import { z } from "zod";

export const NOTIFICATION_STATUSES = [
  "new", "confirmed", "unreachable", "busy", "postponed",
  "shipped", "delivered", "cancelled", "fake", "duplicate", "returned",
] as const;

export const NOTIFICATION_CHANNELS = ["whatsapp", "sms", "both"] as const;

export const upsertNotificationSettingSchema = z.object({
  orderStatus: z.enum(NOTIFICATION_STATUSES),
  channel: z.enum(NOTIFICATION_CHANNELS).default("both"),
  enabled: z.boolean().default(true),
  templateWhatsapp: z.string().optional(),
  templateSms: z.string().optional(),
});

export const bulkUpsertNotificationSettingsSchema = z.object({
  settings: z.array(upsertNotificationSettingSchema).min(1).max(11),
});

export type UpsertNotificationSettingInput = z.infer<typeof upsertNotificationSettingSchema>;
export type BulkUpsertNotificationSettingsInput = z.infer<typeof bulkUpsertNotificationSettingsSchema>;
