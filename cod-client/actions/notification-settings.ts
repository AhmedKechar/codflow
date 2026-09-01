"use server";

/**
 * Server Actions for Notification Settings API
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getUserApiKey, requirePermission } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { mapError } from "@/lib/errors/mapper";
import { getLocale } from "@/lib/locale";

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface NotificationSetting {
  id: string;
  storeId: string;
  orderStatus: string;
  channel: "whatsapp" | "sms" | "both";
  enabled: boolean;
  templateWhatsapp: string | null;
  templateSms: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all notification settings for the store
 */
export async function getNotificationSettings(): Promise<NotificationSetting[]> {
  await requirePermission(SCOPES.MESSAGING_MANAGE);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const result = await apiClient.get<ApiResponse<NotificationSetting[]>>(
      "/api/notification-settings",
      apiKey
    );
    return result.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      throw new Error(mapError(error.code, locale, error.context));
    }
    throw error;
  }
}

/**
 * Update a single notification setting
 */
export async function updateNotificationSetting(
  setting: {
    orderStatus: string;
    channel: "whatsapp" | "sms" | "both";
    enabled: boolean;
    templateWhatsapp?: string;
    templateSms?: string;
  }
): Promise<NotificationSetting> {
  await requirePermission(SCOPES.MESSAGING_MANAGE);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const result = await apiClient.put<ApiResponse<NotificationSetting>>(
      "/api/notification-settings",
      apiKey,
      setting
    );
    revalidatePath("/settings/notifications");
    return result.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      throw new Error(mapError(error.code, locale, error.context));
    }
    throw error;
  }
}

/**
 * Bulk update notification settings
 */
export async function bulkUpdateNotificationSettings(
  settings: Array<{
    orderStatus: string;
    channel: "whatsapp" | "sms" | "both";
    enabled: boolean;
    templateWhatsapp?: string;
    templateSms?: string;
  }>
): Promise<void> {
  await requirePermission(SCOPES.MESSAGING_MANAGE);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    await apiClient.put<ApiResponse<unknown>>(
      "/api/notification-settings/bulk",
      apiKey,
      { settings }
    );
    revalidatePath("/settings/notifications");
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      throw new Error(mapError(error.code, locale, error.context));
    }
    throw error;
  }
}
