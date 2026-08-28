"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useConfirm } from "@/components/ui/use-confirm";
import { useSubscriptions } from "@/lib/translations";
import { cancelSubscriptionAction } from "@/actions/subscriptions";

type SubscriptionRow = {
  subscription: {
    id: string;
    storeId: string;
    planId: string;
    status: "trialing" | "active" | "past_due" | "canceled" | "expired";
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    paymentMethod: string | null;
    createdAt: string;
  };
  plan: {
    id: string;
    name: string;
    priceDzd: number;
  };
  store: {
    id: string;
    name: string;
    domain: string | null;
  };
};

const STATUS_BADGE: Record<string, string> = {
  active: "active",
  trialing: "out",
  past_due: "pending",
  canceled: "inactive",
  expired: "inactive",
};

export function SubscriptionsClient({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  const t = useSubscriptions();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();

  const columns: TableColumn<SubscriptionRow>[] = [
    {
      key: "storeName",
      label: t.store,
      sortable: true,
      searchable: true,
      isTitle: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
            {row.store.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{row.store.name}</span>
            {row.store.domain && (
              <span className="text-[11px] text-muted-foreground/60">{row.store.domain}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "planName",
      label: t.plan,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.plan.name}</span>
          <span className="text-[11px] text-muted-foreground/60">{row.plan.priceDzd.toLocaleString()} {t.currency}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: t.status,
      isStatus: true,
      render: (_, row) => (
        <StatusBadge
          status={STATUS_BADGE[row.subscription.status] ?? "inactive"}
          label={t[row.subscription.status as keyof typeof t] ?? row.subscription.status}
        />
      ),
    },
    {
      key: "paymentMethod",
      label: t.payment_method,
      render: (_, row) => row.subscription.paymentMethod ?? <span className="text-muted-foreground/40">—</span>,
    },
    {
      key: "currentPeriodEnd",
      label: t.end_date,
      tabletHidden: true,
      render: (_, row) => {
        if (!row.subscription.currentPeriodEnd) return <span className="text-muted-foreground/40">—</span>;
        const d = new Date(row.subscription.currentPeriodEnd);
        return <span className="text-muted-foreground/80">{isNaN(d.getTime()) ? row.subscription.currentPeriodEnd : d.toLocaleDateString()}</span>;
      },
    },
  ];

  const actions: TableAction<SubscriptionRow>[] = [
    {
      label: t.cancel,
      icon: <Ban className="w-3.5 h-3.5" />,
      variant: "destructive",
      onClick: async (row) => {
        if (row.subscription.status === "canceled" || row.subscription.status === "expired") {
          toast.error(t.error);
          return;
        }
        const ok = await confirm({
          title: t.confirm_cancel,
          variant: "destructive",
        });
        if (!ok) return;
        try {
          await cancelSubscriptionAction(row.subscription.id);
          toast.success(t.canceled);
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t.error);
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      <DataTable
        data={subscriptions}
        columns={columns}
        actions={actions}
        searchPlaceholder={t.search}
        emptyMessage={t.no_subscriptions}
      />

      {ConfirmDialog}
    </div>
  );
}
