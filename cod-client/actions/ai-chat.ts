"use server";

/**
 * Server Actions for AI Chat API
 *
 * Sends chat messages to the backend streaming endpoint and returns
 * the raw SSE stream for the client to consume.
 */

import { redirect } from "next/navigation";
import { getUserApiKey, requirePermission } from "@/lib/auth";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { getWorkerApiUrl } from "@/lib/api-config";
import { mapError } from "@/lib/errors/mapper";
import { getLocale } from "@/lib/locale";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface SuggestedPrompt {
  id: string;
  label: string;
  labelAr: string;
  labelFr: string;
  message: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: "orders-today",
    label: "What orders came in today?",
    labelAr: "ما هي الطلبات الواردة اليوم؟",
    labelFr: "Quelles commandes sont arrivées aujourd'hui ?",
    message: "Show me today's orders and their statuses",
  },
  {
    id: "low-stock",
    label: "Which products are low on stock?",
    labelAr: "أي المنتجات مخزونها منخفض؟",
    labelFr: "Quels produits ont un stock bas ?",
    message: "Show me products that are low on stock or out of stock",
  },
  {
    id: "customer-summary",
    label: "Give me a customer summary",
    labelAr: "اعطني ملخصاً عن العملاء",
    labelFr: "Donne-moi un résumé des clients",
    message: "Give me a summary of my recent customers and their order history",
  },
  {
    id: "delivery-status",
    label: "How are deliveries going?",
    labelAr: "كيف تسير التوصيلات؟",
    labelFr: "Comment se passent les livraisons ?",
    message: "Show me pending deliveries and driver assignments",
  },
];

/**
 * Send a chat message and return the SSE stream.
 * Returns a ReadableStream that the client can consume for real-time updates.
 */
export async function sendChatMessage(messages: ChatMessage[]) {
  await requirePermission(SCOPES.AI_CREDITS_READ);

  const apiKey = await getUserApiKey();
  if (!apiKey) {
    redirect("/setup-api-key");
  }

  try {
    const baseUrl = await getWorkerApiUrl();
    const response = await fetch(`${baseUrl}/api/ai-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      const errorMessage = data.error || `HTTP ${response.status}`;

      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please contact your admin.");
      }

      if (response.status === 401 || response.status === 403) {
        const locale = await getLocale();
        throw new Error(mapError("AUTHENTICATION_ERROR", locale));
      }

      throw new Error(errorMessage);
    }

    return response.body;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to connect to AI service");
  }
}

/**
 * Get suggested prompts for new conversations.
 */
export async function getSuggestedPrompts(): Promise<SuggestedPrompt[]> {
  return SUGGESTED_PROMPTS;
}
