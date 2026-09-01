"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { showErrorToast, showSuccessToast } from "@/lib/errors/toast";
import { useErrorLocale } from "@/lib/errors/use-locale";
import { useProductGroups, useCommon, useNavigation } from "@/lib/translations";
import { useConfirm } from "@/components/ui/use-confirm";
import { ProductGroupsTable } from "./product-groups-table";
import { deleteProductGroup } from "@/actions/product-groups";
import { PageHeader } from "@/components/ui/page-header";
import type { ProductCategory } from "@/types";

interface Props {
  groups: ProductCategory[];
}

export function ProductGroupsView({ groups }: Props) {
  const router = useRouter();
  const t = useProductGroups();
  const common = useCommon();
  const nav = useNavigation();
  const locale = useErrorLocale();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  const handleDelete = async (group: ProductCategory) => {
    const ok = await confirmDialog({
      title: t.form.delete_confirm,
      variant: "destructive",
      confirmLabel: common.delete,
    });
    if (!ok) return;
    try {
      await deleteProductGroup(group.id);
      showSuccessToast(t.form.success_edit, locale);
      router.refresh();
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : t.form.cannot_delete, locale);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.categories}
        primaryAction={{
          label: t.add_group,
          onClick: () => router.push("/product-groups/new"),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <ProductGroupsTable
        groups={groups}
        onEdit={(g) => router.push(`/product-groups/${g.id}/edit`)}
        onDelete={handleDelete}
      />
      {ConfirmDialog}
    </div>
  );
}
