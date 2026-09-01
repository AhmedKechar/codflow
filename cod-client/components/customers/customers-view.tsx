"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Customer } from "@/types";
import { toast } from "sonner";
import { useCustomers, useCommon, useNavigation } from "@/lib/translations";
import { useConfirm } from "@/components/ui/use-confirm";
import { deleteCustomer } from "@/actions/customers";
import { CustomersTable } from "./customers-table";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorModal } from "@/components/errors/error-modal";
import { useErrorLocale } from "@/lib/errors/use-locale";

interface Props { customers: Customer[]; userScopes: string[] }

export function CustomersView({ customers, userScopes }: Props) {
  const t = useCustomers();
  const common = useCommon();
  const nav = useNavigation();
  const router = useRouter();
  const locale = useErrorLocale();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const [isDeleting, startDeleteTransition] = useTransition();
  
  const [errorState, setErrorState] = useState<{
    isOpen: boolean;
    message: string;
    code?: string;
  }>({ isOpen: false, message: "" });

  async function handleDelete(customer: Customer) {
    if ((customer.totalOrders ?? 0) > 0) {
      setErrorState({
        isOpen: true,
        message: t.error_cannot_delete_with_orders,
        code: "CUSTOMER_HAS_ORDERS",
      });
      return;
    }
    const ok = await confirmDialog({
      title: common.confirm_delete_title?.replace("{name}", customer.name) ?? customer.name,
      variant: "destructive",
      confirmLabel: common.delete,
    });
    if (!ok) return;
    startDeleteTransition(async () => {
      try {
        await deleteCustomer(customer.id);
        toast.success(t.success_deleted);
        router.refresh();
      } catch (error) {
        setErrorState({
          isOpen: true,
          message: error instanceof Error ? error.message : t.error_delete_failed,
        });
      }
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.customers}
        primaryAction={{
          label: t.new_customer,
          onClick: () => router.push("/customers/new"),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <CustomersTable
        customers={customers}
        onView={(c) => router.push(`/customers/${c.id}`)}
        onEdit={(c) => router.push(`/customers/${c.id}/edit`)}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
      {ConfirmDialog}
      
      <ErrorModal
        isOpen={errorState.isOpen}
        onClose={() => setErrorState({ isOpen: false, message: "" })}
        message={errorState.message}
        locale={locale}
        errorCode={errorState.code}
      />
    </div>
  );
}
