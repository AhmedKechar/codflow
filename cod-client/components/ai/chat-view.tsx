"use client";

/**
 * ChatView — AI Chat interface for the merchant dashboard.
 *
 * Features:
 *   - Message list with user/assistant bubbles
 *   - Input field for sending messages
 *   - Streaming response display
 *   - Credit balance indicator
 *   - Suggested prompts for new conversations
 *   - RTL-correct layout via logical Tailwind properties
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Coins,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAi, useCommon } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import {
  sendChatMessage,
  getSuggestedPrompts,
  type ChatMessage,
} from "@/actions/ai-chat";
import { getAiCredits } from "@/actions/ai-credits";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CreditBalance {
  totalCredits: number;
  usedCredits: number;
  remaining: number;
}

interface SuggestedPrompt {
  id: string;
  label: string;
  labelAr: string;
  labelFr: string;
  message: string;
}

export function ChatView() {
  const t = useAi();
  const common = useCommon();
  const { dir, locale } = useLanguage();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [creditsData, prompts] = await Promise.all([
          getAiCredits().catch(() => null),
          getSuggestedPrompts().catch(() => []),
        ]);
        if (creditsData?.data) {
          setCredits(creditsData.data);
        }
        setSuggestedPrompts(prompts);
      } catch {
        // silent
      }
    }
    load();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: DisplayMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      const assistantMessage: DisplayMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInputValue("");
      setIsStreaming(true);

      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      const chatMessages: ChatMessage[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text.trim() },
      ];

      try {
        const stream = await sendChatMessage(chatMessages);
        if (!stream) throw new Error("No stream returned");

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "text") {
                accumulated += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: accumulated }
                      : m,
                  ),
                );
              } else if (parsed.type === "done") {
                if (parsed.usage?.creditsUsed) {
                  setCredits((prev) =>
                    prev
                      ? {
                          ...prev,
                          usedCredits: prev.usedCredits + parsed.usage.creditsUsed,
                          remaining: prev.remaining - parsed.usage.creditsUsed,
                        }
                      : prev,
                  );
                }
              } else if (parsed.type === "error") {
                accumulated = `Error: ${parsed.error}`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: accumulated }
                      : m,
                  ),
                );
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get response";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: `Error: ${errorMessage}` }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleSuggestedPrompt = (message: string) => {
    sendMessage(message);
  };

  const getPromptLabel = (prompt: SuggestedPrompt) => {
    if (locale === "ar") return prompt.labelAr;
    if (locale === "fr") return prompt.labelFr;
    return prompt.label;
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground tracking-tight">
              {t.page_title}
            </h1>
            <p className="text-[11px] text-muted-foreground/60 font-semibold">
              {t.page_subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {credits && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold tabular-nums",
              credits.remaining > 10
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
                : credits.remaining > 0
                  ? "border-amber-500/20 bg-amber-500/5 text-amber-600"
                  : "border-rose-500/20 bg-rose-500/5 text-rose-600",
            )}>
              <Coins size={12} />
              <span>{credits.remaining}</span>
              <span className="text-muted-foreground/40">/ {credits.totalCredits}</span>
            </div>
          )}
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={clearChat}
              className="h-8 w-8 rounded-lg border-border/60 text-muted-foreground hover:text-foreground"
              title={t.new_chat}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-none">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Bot size={28} className="text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-black text-foreground/80">
                {t.empty_title}
              </p>
              <p className="text-sm text-muted-foreground/60 font-medium max-w-md">
                {t.empty_description}
              </p>
            </div>
            {suggestedPrompts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleSuggestedPrompt(prompt.message)}
                    disabled={isStreaming}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-lg border border-border",
                      "bg-card hover:bg-muted/30 text-start text-[13px] font-medium",
                      "text-foreground/80 hover:text-foreground transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    <Sparkles size={14} className="text-muted-foreground/60 shrink-0" />
                    <span className="truncate">{getPromptLabel(prompt)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} locale={locale} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-border bg-card">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t.input_placeholder}
              disabled={isStreaming}
              rows={1}
              className={cn(
                "w-full resize-none rounded-lg border border-border bg-muted",
                "px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/40",
                "focus:outline-none focus:ring-2 focus:ring-ring/40",
                "disabled:opacity-50",
                "min-h-[48px] max-h-[160px]",
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="h-12 w-12 rounded-lg shrink-0"
          >
            {isStreaming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, locale }: { message: DisplayMessage; locale: string }) {
  const isUser = message.role === "user";
  const thinkingLabel = locale === "ar" ? "جاري التفكير..." : locale === "fr" ? "Réflexion..." : "Thinking...";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%] sm:max-w-[70%] animate-fade-in",
        isUser ? "ms-auto flex-row-reverse" : "",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/40 text-muted-foreground",
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-md"
            : "bg-muted/30 text-foreground border border-border/30 rounded-tl-md",
        )}
      >
        {message.content ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-[12px]">{thinkingLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
