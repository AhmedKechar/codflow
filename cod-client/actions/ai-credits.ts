"use server";

/**
 * Server Actions for AI Credits API
 *
 * These actions securely call the Cloudflare Workers API using the user's stored API key.
 * All actions include proper error handling and type safety.
 */

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
 * Get AI credit balance
 */
export async function getAiCredits() {
  await requirePermission(SCOPES.AI_CREDITS_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const response = await apiClient.get<ApiResponse>("/api/ai-credits/balance", apiKey);
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[AI Credits Action Error]", {
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
 * Get AI credit usage history
 */
export async function getAiCreditUsage() {
  await requirePermission(SCOPES.AI_CREDITS_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const response = await apiClient.get<ApiResponse>("/api/ai-credits/usage", apiKey);
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[AI Credits Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
      });

      throw new Error(userMessage);
    }
    throw error;
  }
}
