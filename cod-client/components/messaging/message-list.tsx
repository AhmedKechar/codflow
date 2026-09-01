"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Search, X, Filter, Mail, Smartphone,
} from "lucide-react";
import { DataTable, TableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { useMessaging, useCommon } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WhatsAppMessage } from "@/actions/whatsapp";
import type { SmsMessage } from "@/actions/sms";

type Message = (WhatsAppMessage | SmsMessage) & { channel?: "whatsapp" | "sms" };

interface MessageListProps {
  whatsappMessages: WhatsAppMessage[];
  smsMessages: SmsMessage[];
}

const MESSAGE_TYPES = ["order_update", "marketing", "support", "automated"] as const;
const WHATSAPP_STATUSES = ["pending", "sent", "delivered", "read", "failed"] as const;
const SMS_STATUSES = ["pending", "sent", "delivered", "failed"] as const;

export function MessageList({ whatsappMessages, smsMessages }: MessageListProps) {
  const t = useMessaging();
  const common = useCommon();
  const { dir } = useLanguage();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  const hasActiveFilter = search.trim() !== "" || statusFilter !== "all" || typeFilter !== "all" || channelFilter !== "all";

  const allMessages: Message[] = useMemo(() => {
    const wa: Message[] = whatsappMessages.map((m) => ({ ...m, channel: "whatsapp" as const }));
    const sms: Message[] = smsMessages.map((m) => ({ ...m, channel: "sms" as const }));
    return [...wa, ...sms].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [whatsappMessages, smsMessages]);

  const filtered = useMemo(() => {
    let result = allMessages;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.phoneNumber.includes(q) ||
          m.content.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((m) => m.messageType === typeFilter);
    }

    if (channelFilter !== "all") {
      result = result.filter((m) => m.channel === channelFilter);
    }

    return result;
  }, [allMessages, search, statusFilter, typeFilter, channelFilter]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setChannelFilter("all");
  }

  const columns: TableColumn<Message>[] = [
    {
      key: "phoneNumber",
      label: t.table.recipient,
      sortable: true,
      isTitle: true,
      render: (value, row) => (
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 bg-muted rounded-lg flex items-center justify-center border border-border shrink-0">
            {row.channel === "whatsapp" ? (
              <MessageSquare className="w-4 h-4 text-green-600" />
            ) : (
              <Smartphone className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-mono text-sm font-black tracking-tight" dir="ltr">
              {value}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "messageType",
      label: t.table.type,
      sortable: true,
      render: (value) => (
        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-muted/40 text-muted-foreground">
          {t.message_type[value as keyof typeof t.message_type] ?? value}
        </span>
      ),
    },
    {
      key: "content",
      label: t.table.content,
      render: (value) => (
        <p className="text-sm text-foreground/80 truncate max-w-[200px]">
          {value}
        </p>
      ),
      tabletHidden: true,
    },
    {
      key: "status",
      label: t.table.status,
      sortable: true,
      isStatus: true,
      render: (value) => (
        <StatusBadge
          status={value === "failed" ? "cancelled" : value === "delivered" ? "delivered" : value === "sent" ? "confirmed" : value === "read" ? "shipped" : "new"}
          label={t.status[value as keyof typeof t.status] ?? value}
        />
      ),
    },
    {
      key: "channel",
      label: t.table.channel,
      render: (_value, row) => (
        <span className={cn(
          "inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg",
          row.channel === "whatsapp"
            ? "bg-muted text-muted-foreground"
            : "bg-muted text-muted-foreground",
        )}>
          {row.channel === "whatsapp" ? <MessageSquare size={11} /> : <Smartphone size={11} />}
          {t.channel[row.channel ?? "sms"]}
        </span>
      ),
      tabletHidden: true,
    },
    {
      key: "createdAt",
      label: t.table.date,
      sortable: true,
      render: (value) => (
        <span className="text-xs font-semibold text-muted-foreground/60 whitespace-nowrap">
          {formatDateTime(value)}
        </span>
      ),
      className: "text-end",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-48 group">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 transition-colors group-focus-within:text-foreground",
            dir === "rtl" ? "right-3.5" : "left-3.5",
          )} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.table.recipient + "..."}
            className={cn(
              "bg-card border-border/60 shadow-xs h-10",
              dir === "rtl" ? "pr-10" : "pl-10",
              search && (dir === "rtl" ? "pe-9" : "ps-9"),
            )}
            dir={dir}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors",
                dir === "rtl" ? "left-3" : "right-3",
              )}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border/60 shadow-xs h-10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Filter className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <span className="truncate text-[13px] font-medium">
                {statusFilter === "all" ? t.filters.status : (t.status[statusFilter as keyof typeof t.status] ?? statusFilter)}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.filters.all_status}</SelectItem>
            {WHATSAPP_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t.status[s] ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border/60 shadow-xs h-10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Mail className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <span className="truncate text-[13px] font-medium">
                {typeFilter === "all" ? t.filters.type : (t.message_type[typeFilter as keyof typeof t.message_type] ?? typeFilter)}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.filters.all_types}</SelectItem>
            {MESSAGE_TYPES.map((mt) => (
              <SelectItem key={mt} value={mt}>{t.message_type[mt]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border/60 shadow-xs h-10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <span className="truncate text-[13px] font-medium">
                {channelFilter === "all" ? t.filters.channel : (t.channel[channelFilter as keyof typeof t.channel] ?? channelFilter)}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.filters.all_channels}</SelectItem>
            <SelectItem value="whatsapp">{t.channel.whatsapp}</SelectItem>
            <SelectItem value="sms">{t.channel.sms}</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="h-10 px-3 border-border/60 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X size={13} className="me-1.5" />
            <span className="text-[12px] font-bold">{common.cancel ?? "Clear"}</span>
          </Button>
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchable={false}
        filterable={false}
        emptyState={
          hasActiveFilter ? (
            <div className="py-10 text-center">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
                {common.no_results_found ?? "No results"}
              </p>
            </div>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title={t.empty_state.title}
              description={t.empty_state.description}
              actionLabel={t.empty_state.action}
              onAction={() => router.push("/messaging/send")}
            />
          )
        }
        renderMobileCard={(message) => (
          <div className="flex flex-col gap-2 py-0.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md",
                  message.channel === "whatsapp"
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted text-muted-foreground",
                )}>
                  {message.channel === "whatsapp" ? <MessageSquare size={10} /> : <Smartphone size={10} />}
                  {t.channel[message.channel ?? "sms"]}
                </span>
                <StatusBadge
                  status={message.status === "failed" ? "cancelled" : message.status === "delivered" ? "delivered" : message.status === "sent" ? "confirmed" : "new"}
                  label={t.status[message.status as keyof typeof t.status] ?? message.status}
                />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground/35 tabular-nums whitespace-nowrap">
                {formatDate(message.createdAt)}
              </span>
            </div>
            <p className="font-mono text-sm font-black tracking-tight" dir="ltr">
              {message.phoneNumber}
            </p>
            <span className="text-[10px] font-bold text-muted-foreground/60">
              {t.message_type[message.messageType] ?? message.messageType}
            </span>
            <p className="text-xs text-foreground/70 line-clamp-2">
              {message.content}
            </p>
          </div>
        )}
      />
    </div>
  );
}
