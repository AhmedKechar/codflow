/**
 * AI Chat Service
 *
 * Builds system prompt, MCP tools, and credit estimation for the
 * conversational AI chat endpoint. Reuses the existing tool registry
 * so chat has identical tool access as external MCP agents.
 */

import type { Tool } from "ai";
import type { AppDb } from "../../../../cod-shared/db/client";
import { buildToolsForUser } from "@/mcp/registry";
import type { McpProps } from "@/mcp/props";
import type { Env } from "@/types/env";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Build the system prompt for the AI chat assistant.
 */
export async function buildSystemPrompt(
  db: AppDb,
  storeId: string,
): Promise<string> {
  return [
    "You are CodFlow AI Assistant — a helpful commerce assistant for Algerian merchants.",
    "You help with orders, products, customers, delivery, stock, and store operations.",
    "You have access to the merchant's store data via tools. Always use tools to fetch real data before answering.",
    "Be concise, professional, and helpful. Respond in the same language the user writes in.",
    "For Algeria-specific context: prices are in DZD (Algerian Dinar), addresses use wilayas/communes.",
  ].join("\n");
}

/**
 * Build the tool set for the chat session using the existing MCP registry.
 * Returns an empty object if no tools are available for this user's scopes.
 */
export function buildChatTools(
  db: AppDb,
  env: Env,
  props: McpProps,
): Record<string, Tool> {
  return buildToolsForUser(env, props);
}

/**
 * Simple credit estimation: 1 credit per request + 1 per tool call.
 */
export function estimateCredits(toolCallCount: number): number {
  return 1 + toolCallCount;
}
