"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, LayoutTemplate } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageList } from "./message-list";
import { MessageForm } from "./message-form";
import { useMessaging } from "@/lib/translations";
import { ProtectedAction } from "@/components/rbac/ProtectedAction";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import type { WhatsAppMessage } from "@/actions/whatsapp";
import type { SmsMessage } from "@/actions/sms";

interface MessagingViewProps {
  whatsappMessages: WhatsAppMessage[];
  smsMessages: SmsMessage[];
  userScopes: string[];
}

export function MessagingView({ whatsappMessages, smsMessages, userScopes }: MessagingViewProps) {
  const t = useMessaging();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("messages");

  const totalCount = whatsappMessages.length + smsMessages.length;

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/5 border border-primary/10 rounded-xl w-fit">
          <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
          <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-primary/80">
            {totalCount} {t.messages_count}
          </p>
        </div>

        <ProtectedAction userScopes={userScopes} requiredScope={SCOPES.MESSAGING_SEND}>
          <Button
            size="sm"
            className="h-9 sm:h-10 rounded-xl bg-primary text-primary-foreground font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all px-4 sm:px-6"
            onClick={() => router.push("/messaging/send")}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5 sm:me-2" />
            {t.send_button}
          </Button>
        </ProtectedAction>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? "messages")}>
        <TabsList variant="line" className="w-full sm:w-auto">
          <TabsTrigger value="messages" className="gap-1.5">
            <MessageSquare size={14} />
            {t.tabs.messages}
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-1.5">
            <Send size={14} />
            {t.tabs.send}
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <LayoutTemplate size={14} />
            {t.tabs.templates}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <MessageList
            whatsappMessages={whatsappMessages}
            smsMessages={smsMessages}
          />
        </TabsContent>

        <TabsContent value="send">
          <MessageForm />
        </TabsContent>

        <TabsContent value="templates">
          <div className="rounded-2xl border border-border/60 bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-sm p-8 text-center">
            <LayoutTemplate className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-bold text-muted-foreground/60">{t.templates.title}</p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              {t.message_type.order_update} · {t.message_type.marketing} · {t.message_type.support}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
