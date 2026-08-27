"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table";
import { useConfirm } from "@/components/ui/use-confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProviderKeys, useCommon } from "@/lib/translations";
import {
  createProviderKeyAction,
  toggleProviderKeyAction,
  deleteProviderKeyAction,
} from "@/actions/provider-keys";

type KeyRow = {
  id: string;
  provider: string;
  keyName: string;
  keyValue: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export function ProviderKeysClient({ keys }: { keys: KeyRow[] }) {
  const t = useProviderKeys();
  const common = useCommon();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("master_card");
  const [keyName, setKeyName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleToggle(row: KeyRow) {
    try {
      await toggleProviderKeyAction(row.id, !row.isActive);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.toggle_active);
    }
  }

  const columns: TableColumn<KeyRow>[] = [
    {
      key: "keyName",
      label: t.key_name,
      sortable: true,
      searchable: true,
      isTitle: true,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{row.keyName}</span>
          <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">{row.provider}</span>
        </div>
      ),
    },
    {
      key: "provider",
      label: t.provider,
      tabletHidden: true,
      render: (v) => (
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">{String(v)}</span>
      ),
    },
    {
      key: "keyValue",
      label: t.key_value,
      render: () => <span className="font-mono text-xs text-muted-foreground/70">••••••••••••</span>,
    },
    {
      key: "expiresAt",
      label: t.expires_at,
      tabletHidden: true,
      render: (v) =>
        v ? new Date(String(v)).toLocaleDateString() : <span className="text-muted-foreground/40">—</span>,
    },
    {
      key: "isActive",
      label: t.is_active,
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <Switch checked={Boolean(v)} size="sm" onCheckedChange={() => handleToggle(row)} />
          <span className="text-[11px] font-medium text-muted-foreground/70">
            {v ? t.is_active : t.toggle_active}
          </span>
        </div>
      ),
    },
    {
      key: "lastUsedAt",
      label: t.last_used_at,
      mobileHidden: true,
      tabletHidden: true,
      render: (v) =>
        v ? new Date(String(v)).toLocaleDateString() : <span className="text-muted-foreground/40">—</span>,
    },
  ];

  const actions: TableAction<KeyRow>[] = [
    {
      label: t.delete,
      icon: <Trash2 className="w-3.5 h-3.5" />,
      variant: "destructive",
      onClick: async (row) => {
        const ok = await confirm({ title: t.confirm_delete, variant: "destructive" });
        if (!ok) return;
        try {
          await deleteProviderKeyAction(row.id);
          toast.success(t.deleted_success);
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t.deleted_success);
        }
      },
    },
  ];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createProviderKeyAction({
          provider,
          keyName,
          keyValue,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        });
        toast.success(t.created_success);
        setOpen(false);
        setKeyName("");
        setKeyValue("");
        setExpiresAt("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.created_success);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t.create}
        </Button>
      </div>

      <DataTable
        data={keys}
        columns={columns}
        actions={actions}
        searchPlaceholder={t.key_name}
        emptyMessage={t.no_keys}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>{t.create}</DialogTitle>
              <DialogDescription>{t.subtitle}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-muted-foreground">{t.provider}</Label>
                <Select value={provider} onValueChange={(v) => v && setProvider(v)}>
                  <SelectTrigger>
                    <SelectValue>{provider === "master_card" ? t.master_card : t.visa_code}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master_card">{t.master_card}</SelectItem>
                    <SelectItem value="visa_code">{t.visa_code}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-muted-foreground">{t.key_name}</Label>
                <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-muted-foreground">{t.key_value}</Label>
                <Input type="password" value={keyValue} onChange={(e) => setKeyValue(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-muted-foreground">{t.expires_at}</Label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {common.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "..." : t.create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {ConfirmDialog}
    </div>
  );
}
