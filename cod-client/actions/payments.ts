"use server";

/**
 * Server Actions for Payments API
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
 * Get current merchant's payments
 */
export async function getMyPayments(filters?: { status?: string; limit?: number }) {
  await requirePermission(SCOPES.PAYMENTS_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.limit) params.set("limit", String(filters.limit));

    const query = params.toString();
    const endpoint = query ? `/api/payments?${query}` : "/api/payments";

    const response = await apiClient.get<ApiResponse>(endpoint, apiKey);
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[Payments Action Error]", {
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
 * Get single payment by ID
 */
export async function getPayment(id: string) {
  await requirePermission(SCOPES.PAYMENTS_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const response = await apiClient.get<ApiResponse>(`/api/payments/${id}`, apiKey);
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[Payments Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
        paymentId: id,
      });

      throw new Error(userMessage);
    }
    throw error;
  }
}

/**
 * Submit a payment receipt
 */
export async function submitPayment(data: {
  subscriptionId: string;
  amountDzd: number;
  paymentMethod: string;
  receiptUrl?: string;
  referenceNumber?: string;
}) {
  await requirePermission(SCOPES.PAYMENTS_MANAGE);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const response = await apiClient.post<ApiResponse>("/api/payments", apiKey, data);

    revalidatePath("/billing");
    revalidatePath("/dashboard");

    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[Payments Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
        subscriptionId: data.subscriptionId,
        amountDzd: data.amountDzd,
      });

      throw new Error(userMessage);
    }
    throw error;
  }
}
