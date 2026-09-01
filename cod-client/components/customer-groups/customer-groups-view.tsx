"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCustomerGroups, useCommon, useNavigation } from "@/lib/translations";
import { useConfirm } from "@/components/ui/use-confirm";
import { deleteCustomerGroup } from "@/actions/customer-groups";
import { CustomerGroupsTable } from "./customer-groups-table";
import { PageHeader } from "@/components/ui/page-header";
import type { CustomerGroup } from "@/types";

interface Props {
  groups: CustomerGroup[];
  userScopes: string[];
}

export function CustomerGroupsView({ groups, userScopes }: Props) {
  const t = useCustomerGroups();
  const common = useCommon();
  const nav = useNavigation();
  const router = useRouter();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  async function handleDelete(group: CustomerGroup) {
    const ok = await confirmDialog({
      title: common.confirm_delete_title?.replace("{name}", group.name) ?? group.name,
      variant: "destructive",
      confirmLabel: common.delete,
    });
    if (!ok) return;
    try {
      await deleteCustomerGroup(group.id);
      toast.success(t.success_deleted);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.error_delete_failed);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.customer_groups}
        primaryAction={{
          label: t.new_group,
          onClick: () => router.push("/customer-groups/new"),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <CustomerGroupsTable
        groups={groups}
        onView={(g) => router.push(`/customer-groups/${g.id}`)}
        onEdit={(g) => router.push(`/customer-groups/${g.id}/edit`)}
        onDelete={handleDelete}
      />
      {ConfirmDialog}
    </div>
  );
}
