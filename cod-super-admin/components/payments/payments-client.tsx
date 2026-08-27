"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useConfirm } from "@/components/ui/use-confirm";
import { usePayments } from "@/lib/translations";
import { approvePaymentAction, rejectPaymentAction } from "@/actions/payments";

type PaymentRow = {
  id: string;
  storeId: string;
  storeName: string;
  storeDomain: string | null;
  amountDzd: number;
  currency: string;
  paymentMethod: "ccp" | "baridi_mob" | "wise" | "redotpay";
  status: "pending" | "approved" | "rejected";
  referenceNumber: string | null;
  createdAt: string;
};

export function PaymentsClient({ payments }: { payments: PaymentRow[] }) {
  const t = usePayments();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();

  const columns: TableColumn<PaymentRow>[] = [
    {
      key: "storeName",
      label: t.store,
      sortable: true,
      searchable: true,
      isTitle: true,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{row.storeName}</span>
          {row.storeDomain && (
            <span className="text-[11px] text-muted-foreground/60">{row.storeDomain}</span>
          )}
        </div>
      ),
    },
    {
      key: "amountDzd",
      label: t.amount_dzd,
      sortable: true,
      render: (v) => <span className="font-bold text-primary">{Number(v).toLocaleString()} DZD</span>,
    },
    {
      key: "paymentMethod",
      label: t.method,
      render: (v) => (t.payment_methods as Record<string, string>)[String(v)] ?? String(v),
    },
    {
      key: "referenceNumber",
      label: t.review_notes,
      render: (v) => v ? <span className="font-mono text-xs">{String(v)}</span> : <span className="text-muted-foreground/40">—</span>,
    },
    {
      key: "createdAt",
      label: t.date,
      render: (v) => {
        const d = new Date(String(v));
        return <span className="text-muted-foreground/80">{isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()}</span>;
      },
    },
    {
      key: "status",
      label: t.status,
      isStatus: true,
      render: (v) => (
        <StatusBadge status={String(v)} label={(t as unknown as Record<string, string>)[String(v)] ?? String(v)} />
      ),
    },
  ];

  const actions: TableAction<PaymentRow>[] = [
    {
      label: t.approve,
      icon: <Check className="w-3.5 h-3.5" />,
      variant: "outline",
      onClick: async (row) => {
        const ok = await confirm({ title: t.confirm_approve, variant: "default" });
        if (!ok) return;
        try {
          await approvePaymentAction(row.id);
          toast.success(t.approved_success);
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t.approved_success);
        }
      },
    },
    {
      label: t.reject,
      icon: <X className="w-3.5 h-3.5" />,
      variant: "destructive",
      onClick: async (row) => {
        const ok = await confirm({ title: t.confirm_reject, variant: "destructive" });
        if (!ok) return;
        try {
          await rejectPaymentAction(row.id);
          toast.success(t.rejected_success);
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t.rejected_success);
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
        data={payments}
        columns={columns}
        actions={actions}
        searchPlaceholder={t.store}
        emptyMessage={t.no_payments}
      />
      {ConfirmDialog}
    </div>
  );
}
