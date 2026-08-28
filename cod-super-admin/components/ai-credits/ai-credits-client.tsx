"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table";
import { useAiCredits } from "@/lib/translations";
import { AllocateDialog } from "./allocate-dialog";

type AiCreditsRow = {
  credits: {
    id: string;
    storeId: string;
    totalCredits: number;
    usedCredits: number;
    createdAt: string;
  };
  store: {
    id: string;
    name: string;
    domain: string | null;
  };
};

export function AiCreditsClient({ credits }: { credits: AiCreditsRow[] }) {
  const t = useAiCredits();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<{ id: string; name: string } | null>(null);

  const columns: TableColumn<AiCreditsRow>[] = [
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
      key: "totalCredits",
      label: t.total_credits,
      sortable: true,
      render: (_, row) => (
        <span className="font-bold text-primary">{row.credits.totalCredits.toLocaleString()}</span>
      ),
    },
    {
      key: "usedCredits",
      label: t.used_credits,
      render: (_, row) => (
        <span className="font-bold text-muted-foreground/80">{row.credits.usedCredits.toLocaleString()}</span>
      ),
    },
    {
      key: "remaining",
      label: t.remaining,
      render: (_, row) => {
        const remaining = row.credits.totalCredits - row.credits.usedCredits;
        return (
          <span className={`font-bold ${remaining > 0 ? "text-green-600" : "text-red-500"}`}>
            {remaining.toLocaleString()}
          </span>
        );
      },
    },
  ];

  const actions: TableAction<AiCreditsRow>[] = [
    {
      label: t.allocate,
      icon: <Coins className="w-3.5 h-3.5" />,
      onClick: (row) => {
        setSelectedStore({ id: row.store.id, name: row.store.name });
        setDialogOpen(true);
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
        data={credits}
        columns={columns}
        actions={actions}
        searchPlaceholder={t.search}
        emptyMessage={t.no_credits}
      />

      <AllocateDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setSelectedStore(null);
        }}
        store={selectedStore}
      />
    </div>
  );
}
