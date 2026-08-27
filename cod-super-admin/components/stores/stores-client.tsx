"use client";

import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useStores } from "@/lib/translations";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      <DataTable
        data={stores}
        columns={columns}
        searchPlaceholder={t.search}
        emptyMessage={t.no_stores}
      />
    </div>
  );
}
