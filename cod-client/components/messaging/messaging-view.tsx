"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, LayoutTemplate } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageList } from "./message-list";
import { MessageForm } from "./message-form";
import { useMessaging, useNavigation } from "@/lib/translations";
import { PageHeader } from "@/components/ui/page-header";
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
  const nav = useNavigation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("messages");

  const totalCount = whatsappMessages.length + smsMessages.length;

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.messaging}
        primaryAction={{
          label: t.send_button,
          onClick: () => router.push("/messaging/send"),
          icon: <Send size={14} />,
        }}
      />

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
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
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
