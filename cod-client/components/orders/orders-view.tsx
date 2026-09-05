"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { OrdersTable } from "@/components/orders/orders-table";
import type { Order, Driver, DeliveryCompany } from "@/types";
import { useOrders, useNavigation } from "@/lib/translations";
import { PageHeader } from "@/components/ui/page-header";
import { reconcileOrders } from "@/actions/orders";
import { showErrorToast, showSuccessToast } from "@/lib/errors/toast";
import { useErrorLocale } from "@/lib/errors/use-locale";

interface Props {
  orders: Order[];
  total: number;
  currentPage: number;
  pageSize: number;
  drivers: Driver[];
  companies: DeliveryCompany[];
  driverWilayas: number[];
  userScopes: string[];
  statusCounts: Record<string, number>;
}

export function OrdersView({
  orders,
  total,
  currentPage,
  pageSize,
  drivers,
  companies,
  driverWilayas,
  userScopes,
  statusCounts,
}: Props) {
  const t = useOrders();
  const nav = useNavigation();
  const router = useRouter();
  const locale = useErrorLocale();
  const [reconciling, setReconciling] = useState(false);

  async function handleReconcile() {
    setReconciling(true);
    try {
      const result = await reconcileOrders();
      if (result.updated > 0) {
        showSuccessToast(
          `${t.reconcile_updated ?? "Updated"} ${result.updated} ${t.reconcile_of ?? "of"} ${result.total} ${t.reconcile_orders ?? "orders"}`,
          locale
        );
      } else {
        showSuccessToast(
          `${t.reconcile_all_synced ?? "All orders are up to date"} (${result.total})`,
          locale
        );
      }
      router.refresh();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Reconcile failed", locale);
    } finally {
      setReconciling(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.orders}
        primaryAction={{
          label: t.new_order_button,
          onClick: () => router.push("/orders/new"),
          icon: <Plus className="w-4 h-4" />,
        }}
        secondaryActions={[{
          label: reconciling ? (t.reconcile_syncing ?? "Syncing...") : (t.reconcile_button ?? "Reconcile Statuses"),
          onClick: handleReconcile,
          icon: <RefreshCw className={`w-4 h-4 ${reconciling ? "animate-spin" : ""}`} />,
          disabled: reconciling,
        }]}
      />

      <OrdersTable
        orders={orders}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        drivers={drivers}
        companies={companies}
        driverWilayas={driverWilayas}
        userScopes={userScopes}
        statusCounts={statusCounts}
      />
    </div>
  );
}
