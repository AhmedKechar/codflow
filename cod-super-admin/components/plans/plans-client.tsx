"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useConfirm } from "@/components/ui/use-confirm";
import { usePlans } from "@/lib/translations";
import { deletePlanAction } from "@/actions/plans";
import { PlanFormDialog } from "./plan-form-dialog";

type PlanRow = {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  priceDzd: number;
  billingCycle: "monthly" | "yearly";
  trialDays: number | null;
  maxOrders: number;
  maxProducts: number | null;
  maxDrivers: number | null;
  maxCustomers: number | null;
  maxTeamMembers: number | null;
  maxAiCredits: number | null;
  features: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

export function PlansClient({ plans }: { plans: PlanRow[] }) {
  const t = usePlans();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlanRow | null>(null);

  const columns: TableColumn<PlanRow>[] = [
    {
      key: "name",
      label: t.name,
      sortable: true,
      searchable: true,
      isTitle: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{row.name}</span>
            <span className="text-[11px] text-muted-foreground/60">{row.nameAr}</span>
          </div>
        </div>
      ),
    },
    {
      key: "priceDzd",
      label: t.price_dzd,
      sortable: true,
      render: (v) => <span className="font-bold">{Number(v).toLocaleString()} {t.currency}</span>,
    },
    {
      key: "billingCycle",
      label: t.billing_cycle,
      render: (v) => (v === "monthly" ? t.monthly : t.yearly),
    },
    {
      key: "trialDays",
      label: t.trial_days,
      render: (v) => String(v),
    },
    {
      key: "maxOrders",
      label: t.max_orders,
      render: (v) => String(v),
    },
    {
      key: "isActive",
      label: t.is_active,
      isStatus: true,
      render: (v) => (
        <StatusBadge status={v ? "active" : "inactive"} label={v ? t.is_active : t.inactive} />
      ),
    },
  ];

  const actions: TableAction<PlanRow>[] = [
    {
      label: t.edit,
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: (row) => {
        setEditing(row);
        setDialogOpen(true);
      },
    },
    {
      label: t.delete,
      icon: <Trash2 className="w-3.5 h-3.5" />,
      variant: "destructive",
      onClick: async (row) => {
        const ok = await confirm({
          title: t.confirm_delete,
          variant: "destructive",
        });
        if (!ok) return;
        try {
          await deletePlanAction(row.id);
          toast.success(t.deleted);
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t.error);
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.create}
        </Button>
      </div>

      <DataTable
        data={plans}
        columns={columns}
        actions={actions}
        searchPlaceholder={t.search}
        emptyMessage={t.no_plans}
      />

      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        plan={editing}
      />
      {ConfirmDialog}
    </div>
  );
}
