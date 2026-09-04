"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useProducts, useCommon, useNavigation } from "@/lib/translations";
import { useConfirm } from "@/components/ui/use-confirm";
import { ProductsTable } from "./products-table";
import { ProtectedAction } from "@/components/rbac/ProtectedAction";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { deleteProduct, updateProduct } from "@/actions/products";
import { ErrorModal } from "@/components/errors/error-modal";
import { useErrorLocale } from "@/lib/errors/use-locale";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import type { Product, ProductCategory } from "@/types";

interface Props {
  products: Product[];
  groups: ProductCategory[];
  userScopes: string[];
}

export function ProductsView({ products, groups, userScopes }: Props) {
  const router = useRouter();
  const t = useProducts();
  const common = useCommon();
  const nav = useNavigation();
  const locale = useErrorLocale();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  
  const [errorState, setErrorState] = useState<{
    isOpen: boolean;
    message: string;
    code?: string;
  }>({ isOpen: false, message: "" });

  const handleDelete = async (product: Product) => {
    const ok = await confirmDialog({
      title: common.confirm_delete_title?.replace("{name}", product.name) ?? product.name,
      variant: "destructive",
      confirmLabel: common.delete,
    });
    if (!ok) return;
    try {
      await deleteProduct(product.id);
      toast.success(t.success_deleted);
      router.refresh();
    } catch (e) {
      setErrorState({
        isOpen: true,
        message: e instanceof Error ? e.message : t.error_delete_failed,
      });
    }
  };

  const handleToggleShowInStore = async (product: Product) => {
    try {
      await updateProduct(product.id, { showInStore: !product.showInStore });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update product");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.products}
        primaryAction={{
          label: t.add_product,
          onClick: () => router.push("/products/new"),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <ProductsTable
        products={products}
        groups={groups}
        onView={(p) => router.push(`/products/${p.id}`)}
        onEdit={(p) => router.push(`/products/${p.id}/edit`)}
        onDelete={handleDelete}
        onToggleShowInStore={handleToggleShowInStore}
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
