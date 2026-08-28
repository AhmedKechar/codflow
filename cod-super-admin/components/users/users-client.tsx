"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useConfirm } from "@/components/ui/use-confirm";
import { useUsers } from "@/lib/translations";
import { deleteUserAction } from "@/actions/users";
import { UserFormDialog } from "./user-form-dialog";

type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "admin" | "staff" | "super_admin";
  status: "active" | "inactive";
  createdAt: Date;
  language: string;
  scopes: string[];
};

const ROLE_BADGE: Record<string, string> = {
  super_admin: "active",
  admin: "delivered",
  staff: "out",
};

export function UsersClient({ users }: { users: UserRow[] }) {
  const t = useUsers();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const columns: TableColumn<UserRow>[] = [
    {
      key: "name",
      label: t.name,
      sortable: true,
      searchable: true,
      isTitle: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black overflow-hidden">
            {row.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              row.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{row.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: t.email,
      searchable: true,
      render: (v) => <span className="text-muted-foreground/80">{String(v)}</span>,
    },
    {
      key: "role",
      label: t.role,
      render: (v) => (
        <StatusBadge status={ROLE_BADGE[String(v)] ?? "inactive"} label={t[String(v) as keyof typeof t] ?? String(v)} />
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
      render: (v) => {
        const d = v instanceof Date ? v : new Date(Number(v));
        return <span className="text-muted-foreground/80">{isNaN(d.getTime()) ? String(v) : d.toLocaleDateString()}</span>;
      },
    },
  ];

  const actions: TableAction<UserRow>[] = [
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
        if (row.role === "super_admin") {
          toast.error(t.error);
          return;
        }
        const ok = await confirm({
          title: t.confirm_delete,
          variant: "destructive",
        });
        if (!ok) return;
        try {
          await deleteUserAction(row.id);
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
        data={users}
        columns={columns}
        actions={actions}
        searchPlaceholder={t.search}
        emptyMessage={t.no_users}
      />

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        user={editing}
      />
      {ConfirmDialog}
    </div>
  );
}
