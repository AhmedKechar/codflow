"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Tag, Pencil, Trash2, Search, ToggleLeft, ToggleRight,
  MoreHorizontal, Percent, DollarSign, X, Filter,
} from "lucide-react";
import { DataTable, TableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDiscounts, useCommon } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { deleteDiscountCodeAction, updateDiscountCodeAction } from "@/actions/discount-codes";
import { useConfirm } from "@/components/ui/use-confirm";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { DiscountCode } from "@/actions/discount-codes";
import { SCOPES } from "@/../cod-shared/rbac/scopes";

function StatusBadge({ status }: { status: "active" | "inactive" | "expired" }) {
  const t = useDiscounts();
  const colorMap = {
    active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    inactive: "bg-slate-100 text-slate-500 border border-slate-200",
    expired: "bg-amber-50 text-amber-700 border border-amber-200",
  };
  return (
    <Badge className={cn("text-[0.7rem] font-bold px-2 py-0.5 rounded-full", colorMap[status])}>
      {t.status[status]}
    </Badge>
  );
}

function TypeBadge({ type }: { type: "percentage" | "fixed" }) {
  const t = useDiscounts();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[0.65rem] font-bold px-2 py-0.5 rounded-full border",
        type === "percentage"
          ? "bg-primary/5 text-primary border-primary/20"
          : "bg-emerald-50 text-emerald-700 border-emerald-200"
      )}
    >
      {type === "percentage" ? <Percent size={10} /> : <DollarSign size={10} />}
      {t.type[type]}
    </span>
  );
}

function DiscountRowActions({
  discount,
  userScopes,
  onRefresh,
}: {
  discount: DiscountCode;
  userScopes: string[];
  onRefresh: () => void;
}) {
  const t = useDiscounts();
  const common = useCommon();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  const hasScope = (scope: string) => userScopes.includes(scope) || userScopes.includes(SCOPES.ALL);

  async function handleToggleStatus() {
    const newStatus = discount.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      try {
        await updateDiscountCodeAction(discount.id, { status: newStatus });
        toast.success(t.toast.success_update);
        onRefresh();
      } catch {
        toast.error(t.toast.error_update);
      }
    });
  }

  async function handleDelete() {
    const ok = await confirmDialog({
      title: t.confirm_delete_title,
      description: t.confirm_delete_description,
      variant: "destructive",
      confirmLabel: common.delete,
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteDiscountCodeAction(discount.id);
        toast.success(t.toast.success_delete);
        onRefresh();
      } catch {
        toast.error(t.toast.error_delete);
      }
    });
  }

  return (
    <>
      {ConfirmDialog}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />}>
          <MoreHorizontal size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => router.push(`/discounts/${discount.id}/edit`)}>
            <Pencil size={13} className="me-2" />
            {t.actions.edit}
          </DropdownMenuItem>
          {hasScope(SCOPES.DISCOUNTS_MANAGE) && (
            <>
              <DropdownMenuItem onClick={handleToggleStatus} disabled={isPending}>
                {discount.status === "active" ? (
                  <>
                    <ToggleLeft size={13} className="me-2" />
                    {t.actions.deactivate}
                  </>
                ) : (
                  <>
                    <ToggleRight size={13} className="me-2" />
                    {t.actions.activate}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isPending}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={13} className="me-2" />
                {t.actions.delete}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

interface DiscountListProps {
  discounts: DiscountCode[];
  userScopes?: string[];
  loading?: boolean;
}

export function DiscountList({
  discounts,
  userScopes = [],
  loading = false,
}: DiscountListProps) {
  const t = useDiscounts();
  const { dir } = useLanguage();
  const router = useRouter();

  function handleRefresh() {
    router.refresh();
  }

  const columns: TableColumn<DiscountCode>[] = [
    {
      key: "code",
      label: t.table.code,
      sortable: true,
      isTitle: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm tracking-tight uppercase">{value}</span>
        </div>
      ),
    },
    {
      key: "type",
      label: t.table.type,
      sortable: true,
      render: (_value, row) => <TypeBadge type={row.type} />,
    },
    {
      key: "value",
      label: t.table.value,
      sortable: true,
      render: (_value, row) => (
        <span className="font-bold text-sm">
          {row.type === "percentage" ? `${row.value}%` : `${row.value} DA`}
        </span>
      ),
    },
    {
      key: "minOrderAmount",
      label: t.table.min_order,
      render: (_value, row) => (
        <span className="text-sm text-muted-foreground">
          {row.minOrderAmount ? `${row.minOrderAmount} DA` : "—"}
        </span>
      ),
      tabletHidden: true,
    },
    {
      key: "usedCount",
      label: t.table.uses,
      sortable: true,
      render: (_value, row) => (
        <span className="font-bold text-sm tabular-nums">
          {row.usedCount}{row.maxUses ? `/${row.maxUses}` : ""}
        </span>
      ),
    },
    {
      key: "status",
      label: t.table.status,
      sortable: true,
      isStatus: true,
      render: (_value, row) => <StatusBadge status={row.status} />,
    },
    {
      key: "id",
      label: "",
      render: (_value, row) => (
        <DiscountRowActions
          discount={row}
          userScopes={userScopes}
          onRefresh={handleRefresh}
        />
      ),
      className: "w-10 text-end",
    },
  ];

  const filters = [
    {
      key: "status",
      label: t.filters.status,
      options: [
        { label: t.status.active, value: "active" },
        { label: t.status.inactive, value: "inactive" },
        { label: t.status.expired, value: "expired" },
      ],
    },
  ];

  return (
    <DataTable
      data={discounts}
      columns={columns}
      loading={loading}
      searchPlaceholder={t.filters.search}
      filterable
      filters={filters}
      emptyState={
        <EmptyState
          icon={Tag}
          title={t.empty_state.title}
          description={t.empty_state.description}
          actionLabel={t.empty_state.action}
          onAction={() => router.push("/discounts/new")}
        />
      }
      renderMobileCard={(discount) => (
        <div className="flex flex-col gap-2.5 py-0.5">
          <div className="flex items-center gap-1.5 justify-end">
            <StatusBadge status={discount.status} />
            <DiscountRowActions
              discount={discount}
              userScopes={userScopes}
              onRefresh={handleRefresh}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm uppercase tracking-tight">{discount.code}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 pb-2.5 border-b border-border/10">
            <TypeBadge type={discount.type} />
            <span className="font-bold text-sm">
              {discount.type === "percentage" ? `${discount.value}%` : `${discount.value} DA`}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t.table.uses}: {discount.usedCount}{discount.maxUses ? `/${discount.maxUses}` : ""}</span>
            {discount.minOrderAmount && (
              <span>{t.table.min_order}: {discount.minOrderAmount} DA</span>
            )}
          </div>
        </div>
      )}
    />
  );
}
