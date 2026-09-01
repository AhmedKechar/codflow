"use server";

import { redirect } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getUserApiKey, requirePermission } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";

export interface BlockedIp {
  id: string;
  storeId: string;
  ipAddress: string;
  reason: string | null;
  customerId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Get blocked IPs for the current store
 */
export async function getBlockedIps(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: BlockedIp[]; total: number }> {
  await requirePermission(SCOPES.ORDERS_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");

  try {
    const params = new URLSearchParams();
    if (options?.search) params.set("search", options.search);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));

    const qs = params.toString();
    const response = await apiClient.get<ApiResponse<{ data: BlockedIp[]; total: number }>>(
      `/api/blocked-ips${qs ? `?${qs}` : ""}`,
      apiKey
    );

    return response.data ?? { data: [], total: 0 };
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

/**
 * Block an IP address
 */
export async function blockIp(
  ipAddress: string,
  options?: { reason?: string; customerId?: string; expiresAt?: string }
): Promise<BlockedIp> {
  await requirePermission(SCOPES.ORDERS_UPDATE);

  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");

  try {
    const response = await apiClient.post<ApiResponse<BlockedIp>>(
      "/api/blocked-ips",
      apiKey,
      { ipAddress, ...options }
    );

    if (!response.data) throw new Error("No data returned from API");
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

/**
 * Unblock an IP address
 */
export async function unblockIp(id: string): Promise<void> {
  await requirePermission(SCOPES.ORDERS_UPDATE);

  const apiKey = await getUserApiKey();
  if (!apiKey) redirect("/setup-api-key");

  try {
    await apiClient.delete<ApiResponse<void>>(
      `/api/blocked-ips/${id}`,
      apiKey
    );
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.message);
    }
    throw error;
  }
}
