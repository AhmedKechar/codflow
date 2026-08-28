"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getUserApiKey } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { mapError } from "@/lib/errors/mapper";
import { redirect } from "next/navigation";
import { AVAILABLE_THEMES, type ThemeInfo, type BorderRadius, type ShadowIntensity } from "@/lib/themes-data";
import type { TrustSealsConfig, OrderFormConfig } from "./stores";
import {
  mergeSiteBuilder,
  type SiteBuilderConfig,
} from "../../cod-shared/site-builder";

export type { ThemeInfo, BorderRadius, ShadowIntensity };

async function getApiKey() {
  const key = await getUserApiKey();
  if (!key) redirect("/setup-api-key");
  return key;
}

export async function getAvailableThemes(): Promise<ThemeInfo[]> {
  return AVAILABLE_THEMES;
}

export async function updateThemeColors(colors: {
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  fontFamily?: string;
  borderRadius?: BorderRadius;
  shadowIntensity?: ShadowIntensity;
  trustSeals?: TrustSealsConfig;
  orderFormConfig?: OrderFormConfig;
}): Promise<void> {
  await requirePermission(SCOPES.SETTINGS_VIEW);
  const key = await getApiKey();

  try {
    await apiClient.patch<{
      success: boolean;
      data: Record<string, unknown>;
    }>("/api/stores/me", key, colors);
    revalidatePath("/store/theme");
    revalidatePath("/settings");
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);
      throw new Error(userMessage);
    }
    throw error;
  }
}

/**
 * Persists the site-builder layout config. Serializes to a JSON string stored on
 * the store's `site_json` column (same contract as contentJson).
 */
export async function updateSiteBuilder(site: SiteBuilderConfig): Promise<void> {
  await requirePermission(SCOPES.SETTINGS_VIEW);
  const key = await getApiKey();

  // Validate/normalise before persisting so a malformed draft never reaches DB.
  const normalized = mergeSiteBuilder(site);

  try {
    await apiClient.patch<{
      success: boolean;
      data: Record<string, unknown>;
    }>("/api/stores/me", key, {
      siteJson: JSON.stringify(normalized),
    });
    revalidatePath("/store/theme");
    revalidatePath("/settings");
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);
      throw new Error(userMessage);
    }
    throw error;
  }
}
