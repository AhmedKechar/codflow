"use client";

import { useState } from "react";
import { Gift, MoreHorizontal, Trash2, Ban, Search, X } from "lucide-react";
import { useGiftCards } from "@/lib/translations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/ui/use-confirm";
import type { GiftCard } from "@/actions/gift-cards";
import {
  updateGiftCardAction,
  deleteGiftCardAction,
} from "@/actions/gift-cards";
import { toast } from "sonner";

interface GiftCardListProps {
  cards: GiftCard[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; key: string }
> = {
  active: { variant: "default", key: "active" },
  used: { variant: "secondary", key: "used" },
  expired: { variant: "outline", key: "expired" },
  disabled: { variant: "destructive", key: "disabled" },
};

export function GiftCardList({ cards, isLoading, onRefresh }: GiftCardListProps) {
  const t = useGiftCards();
  const { confirm, ConfirmDialog } = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleDisable = async (id: string) => {
    const confirmed = await confirm({
      title: t.actions?.disable ?? "Disable Card",
      description: t.actions?.disable_confirm ?? "Are you sure you want to disable this gift card?",
      variant: "destructive",
    });

    if (confirmed) {
      const result = await updateGiftCardAction(id, { status: "disabled" });
      if (result.success) {
        toast.success(t.toast?.disabled ?? "Gift card disabled");
        onRefresh?.();
      } else {
        toast.error(result.error || (t.toast?.error ?? "Error occurred"));
      }
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t.delete_dialog?.title ?? "Delete Gift Card",
      description: t.delete_dialog?.description ?? "Are you sure you want to delete this gift card?",
      confirmLabel: t.delete_dialog?.confirm ?? "Delete",
      cancelLabel: t.delete_dialog?.cancel ?? "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      const result = await deleteGiftCardAction(id);
      if (result.success) {
        toast.success(t.toast?.deleted ?? "Gift card deleted");
        onRefresh?.();
      } else {
        toast.error(result.error || (t.toast?.error ?? "Error occurred"));
      }
    }
  };

  const filteredCards = cards.filter((card) => {
    const matchesSearch = search === "" || 
      card.code.toLowerCase().includes(search.toLowerCase()) ||
      card.recipientName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted/50 rounded" />
                <div className="h-3 w-24 bg-muted/50 rounded" />
              </div>
              <div className="h-6 w-20 bg-muted/50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Gift size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t.empty?.title ?? "No gift cards"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.empty?.description ?? "Create your first gift card to get started."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.search_placeholder ?? "Search by code or recipient..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t.filters?.status ?? "Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.status?.all ?? "All"}</SelectItem>
            <SelectItem value="active">{t.status?.active ?? "Active"}</SelectItem>
            <SelectItem value="used">{t.status?.used ?? "Used"}</SelectItem>
            <SelectItem value="expired">{t.status?.expired ?? "Expired"}</SelectItem>
            <SelectItem value="disabled">{t.status?.disabled ?? "Disabled"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.table?.code ?? "Code"}</TableHead>
              <TableHead>{t.table?.amount ?? "Amount"}</TableHead>
              <TableHead>{t.table?.remaining ?? "Remaining"}</TableHead>
              <TableHead>{t.table?.recipient ?? "Recipient"}</TableHead>
              <TableHead>{t.table?.status ?? "Status"}</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCards.map((card) => {
              const statusConfig = STATUS_CONFIG[card.status] ?? STATUS_CONFIG.active;
              const statusLabel = t.status?.[statusConfig.key as keyof typeof t.status] ?? statusConfig.key;
              return (
                <TableRow key={card.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Gift size={14} className="text-primary" />
                      </div>
                      <span className="font-mono font-medium">{card.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{card.initialAmountDzd.toLocaleString()} دج</span>
                  </TableCell>
                  <TableCell>
                    <span className={card.remainingAmountDzd > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                      {card.remainingAmountDzd.toLocaleString()} دج
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{card.recipientName || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant}>{statusLabel}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {card.status === "active" && (
                          <DropdownMenuItem onClick={() => handleDisable(card.id)}>
                            <Ban size={14} className="mr-2" />
                            {t.actions?.disable ?? "Disable"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(card.id)} className="text-destructive">
                          <Trash2 size={14} className="mr-2" />
                          {t.actions?.delete ?? "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {ConfirmDialog}
    </>
  );
}
