"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCustomerTags, useCommon, useNavigation } from "@/lib/translations";
import { useConfirm } from "@/components/ui/use-confirm";
import { deleteCustomerTag } from "@/actions/customer-tags";
import { CustomerTagsTable } from "./customer-tags-table";
import { PageHeader } from "@/components/ui/page-header";
import type { CustomerTag } from "@/types";

interface Props {
  tags: CustomerTag[];
  userScopes: string[];
}

export function CustomerTagsView({ tags, userScopes }: Props) {
  const t = useCustomerTags();
  const common = useCommon();
  const nav = useNavigation();
  const router = useRouter();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();

  async function handleDelete(tag: CustomerTag) {
    const ok = await confirmDialog({
      title: common.confirm_delete_title?.replace("{name}", tag.name) ?? tag.name,
      variant: "destructive",
      confirmLabel: common.delete,
    });
    if (!ok) return;
    try {
      await deleteCustomerTag(tag.id);
      toast.success(t.success_deleted);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.error_delete_failed);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.customer_tags}
        primaryAction={{
          label: t.new_tag,
          onClick: () => router.push("/customer-tags/new"),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <CustomerTagsTable
        tags={tags}
        onView={(tag) => router.push(`/customer-tags/${tag.id}`)}
        onEdit={(tag) => router.push(`/customer-tags/${tag.id}/edit`)}
        onDelete={handleDelete}
      />
      {ConfirmDialog}
    </div>
  );
}
