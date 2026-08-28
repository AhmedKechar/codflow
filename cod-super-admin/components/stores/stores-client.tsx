"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useConfirm } from "@/components/ui/use-confirm";
import { useStores } from "@/lib/translations";
import { deleteStoreAction } from "@/actions/stores";
import { StoreFormDialog } from "./store-form-dialog";

type StoreRow = {
  store: {
    id: string;
    name: string;
    domain: string | null;
    status: "active" | "inactive";
    createdAt: string;
  };
  plan: { id: string; name: string } | null;
};

export function StoresClient({ stores }: { stores: StoreRow[] }) {
  const t = useStores();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreRow | null>(null);

  const columns: TableColumn<StoreRow>[] = [
    {
      key: "name",
      label: t.name,
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
      key: "domain",
      label: t.domain,
      tabletHidden: true,
      render: (v) => v ? <span className="font-mono text-xs">{String(v)}</span> : <span className="text-muted-foreground/40">—</span>,
    },
    {
      key: "planName",
      label: t.plan,
      render: (_, row) => row.plan?.name ?? <span className="text-muted-foreground/40">—</span>,
    },
    {
      key: "subscriptionStatus",
      label: t.subscription_status,
      isStatus: true,
      render: (_, row) =>
        row.plan ? (
          <StatusBadge status="active" label={t.active} />
        ) : (
          <StatusBadge status="inactive" label={t.inactive} />
        ),
    },
    {
      key: "status",
      label: t.status,
      isStatus: true,
      render: (v) => (
        <StatusBadge status={String(v)} label={v === "active" ? t.active : t.inactive} />
      ),
    },
    {
      key: "created_at",
      label: t.created_at,
      tabletHidden: true,
      render: (_, row) => {
        const d = new Date(row.store.createdAt);
        return <span className="text-muted-foreground/80">{isNaN(d.getTime()) ? row.store.createdAt : d.toLocaleDateString()}</span>;
      },
    },
  ];

  const actions: TableAction<StoreRow>[] = [
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
          await deleteStoreAction(row.store.id);
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
        data={stores}
        columns={columns}
        actions={actions}
        searchPlaceholder={t.search}
        emptyMessage={t.no_stores}
      />

      <StoreFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        store={editing ? {
          id: editing.store.id,
          name: editing.store.name,
          domain: editing.store.domain,
          status: editing.store.status,
        } : null}
      />
      {ConfirmDialog}
    </div>
  );
}
