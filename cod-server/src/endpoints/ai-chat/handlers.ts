/**
 * AI Chat Handlers
 *
 * POST /api/ai-chat — Send a chat message and stream the AI response.
 * Uses Server-Sent Events (SSE) for real-time streaming.
 */

import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { streamText, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { buildSystemPrompt, buildChatTools, estimateCredits } from "@/services/ai/chat-service";
import { recordAiUsage, hasEnoughCredits } from "../../../../cod-shared/queries/ai-credits";
import type { McpProps } from "@/mcp/props";
import type { ChatMessage } from "@/services/ai/chat-service";

interface ChatRequest {
  messages: ChatMessage[];
}

/**
 * POST /api/ai-chat
 *
 * Accepts a list of chat messages, builds context + tools, calls the LLM,
 * and streams the response back as Server-Sent Events.
 */
export async function handleChat(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const user = c.get("user")!;
  const storeId = c.get("storeId") ?? "";

  if (!storeId) {
    return c.json({ success: false, error: "Store ID is required" }, 400);
  }

  const creditCheck = await hasEnoughCredits(db, storeId, 1);
  if (!creditCheck) {
    return c.json(
      { success: false, error: "Insufficient AI credits. Please contact your admin." },
      402,
    );
  }

  const body = await c.req.json<ChatRequest>();
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ success: false, error: "messages array is required" }, 400);
  }

  const systemPrompt = await buildSystemPrompt(db, storeId);

  const props: McpProps = {
    userId: user.id,
    role: user.role as "admin" | "staff",
    scopes: user.scopes,
    name: user.name ?? "",
    email: user.email,
    storeId,
  };
  const tools = buildChatTools(db, c.env, props);

  const apiKey = c.env.OPENAI_API_KEY;
  if (!apiKey) {
    return c.json({ success: false, error: "AI service not configured" }, 500);
  }

  const openai = createOpenAI({ apiKey });

  const result = streamText({
    model: openai.chat("gpt-4o-mini"),
    system: systemPrompt,
    messages: body.messages,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    stopWhen: [stepCountIs(5)],
    onFinish: async (event) => {
      try {
        const usage = await event.usage;
        const toolCalls = await event.toolCalls;
        const creditsUsed = estimateCredits(toolCalls.length);

        await recordAiUsage(db, {
          id: crypto.randomUUID(),
          storeId,
          agentType: "product",
          operation: "chat",
          model: "gpt-4o-mini",
          creditsUsed,
          tokensIn: usage.inputTokens ?? 0,
          tokensOut: usage.outputTokens ?? 0,
          requestSummary: body.messages[body.messages.length - 1]?.content?.slice(0, 200) ?? null,
        });
      } catch (err) {
        console.error("[AI Chat] Failed to record usage:", err);
      }
    },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "text", content: chunk })}\n\n`),
          );
        }

        const usage = await result.usage;
        const toolCalls = await result.toolCalls;
        const creditsUsed = estimateCredits(toolCalls.length);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              usage: {
                inputTokens: usage.inputTokens ?? 0,
                outputTokens: usage.outputTokens ?? 0,
                creditsUsed,
              },
            })}\n\n`,
          ),
        );

        controller.close();
      } catch (err) {
        const error = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
