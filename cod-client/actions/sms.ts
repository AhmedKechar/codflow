"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getUserApiKey, requirePermission } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { mapError } from "@/lib/errors/mapper";
import { getLocale } from "@/lib/locale";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  count?: number;
}

export interface SmsMessage {
  id: string;
  storeId: string;
  orderId: string | null;
  customerId: string | null;
  phoneNumber: string;
  messageType: "order_update" | "marketing" | "support" | "automated";
  content: string;
  status: "pending" | "sent" | "delivered" | "failed";
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface SmsFilters {
  messageType?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listSmsMessages(filters: SmsFilters = {}): Promise<{ messages: SmsMessage[]; count: number }> {
  await requirePermission(SCOPES.MESSAGING_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");

  try {
    const params = new URLSearchParams();
    if (filters.messageType && filters.messageType !== "all") params.set("messageType", filters.messageType);
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.limit) params.set("limit", String(filters.limit));
    if (filters.offset) params.set("offset", String(filters.offset));

    const query = params.toString();
    const response = await apiClient.getSilent<ApiResponse<SmsMessage[]>>(
      `/api/sms/messages${query ? `?${query}` : ""}`,
      apiKey,
    );

    return {
      messages: response.data ?? [],
      count: response.count ?? 0,
    };
  } catch {
    return { messages: [], count: 0 };
  }
}

export interface SendSmsData {
  phoneNumber: string;
  messageType: "order_update" | "marketing" | "support" | "automated";
  content?: string;
  orderId?: string;
  customerId?: string;
}

export async function sendSmsMessage(data: SendSmsData): Promise<{ id: string; status: string }> {
  await requirePermission(SCOPES.MESSAGING_SEND);

  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");

  try {
    const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>(
      "/api/sms/send",
      apiKey,
      data,
    );

    if (!response.data) {
      throw new Error("No data returned from API");
    }

    revalidatePath("/messaging");

    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.code) {
      const locale = await getLocale();
      const userMessage = mapError(error.code, locale, error.context);

      console.error("[SMS Action Error]", {
        code: error.code,
        category: error.category,
        context: error.context,
      });

      throw new Error(userMessage);
    }
    throw error;
  }
}
