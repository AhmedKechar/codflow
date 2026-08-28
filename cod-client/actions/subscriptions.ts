"use server";

/**
 * Server Actions for Subscriptions API
 *
 * These actions securely call the Cloudflare Workers API using the user's stored API key.
 * All actions include proper error handling and type safety.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getUserApiKey, requirePermission } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { mapError } from "@/lib/errors/mapper";
import { getLocale } from "@/lib/locale";

/**
 * API Response types
 */
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Get available subscription plans (public endpoint)
 */
export async function getPlans() {
  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const response = await apiClient.get<ApiResponse>("/api/subscriptions/plans", apiKey);
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[Subscriptions Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
      });

      throw new Error(userMessage);
    }
    throw error;
  }
}

/**
 * Get current merchant subscription
 */
export async function getCurrentSubscription() {
  await requirePermission(SCOPES.SUBSCRIPTIONS_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const response = await apiClient.get<ApiResponse>("/api/subscriptions/current", apiKey);
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[Subscriptions Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
      });

      throw new Error(userMessage);
    }
    throw error;
  }
}

/**
 * Get subscription change history
 */
export async function getSubscriptionHistory() {
  await requirePermission(SCOPES.SUBSCRIPTIONS_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const response = await apiClient.get<ApiResponse>("/api/subscriptions/history", apiKey);
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[Subscriptions Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
      });

      throw new Error(userMessage);
    }
    throw error;
  }
}

/**
 * Upgrade subscription plan
 */
export async function upgradePlan(planId: string, paymentMethod?: string) {
  await requirePermission(SCOPES.SUBSCRIPTIONS_MANAGE);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const response = await apiClient.post<ApiResponse>(
      "/api/subscriptions/upgrade",
      apiKey,
      { planId, paymentMethod }
    );

    revalidatePath("/billing");
    revalidatePath("/dashboard");

    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[Subscriptions Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
        planId,
      });

      throw new Error(userMessage);
    }
    throw error;
  }
}
