"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { OrdersTable } from "@/components/orders/orders-table";
import type { Order, Driver, DeliveryCompany } from "@/types";
import { useOrders, useNavigation } from "@/lib/translations";
import { PageHeader } from "@/components/ui/page-header";

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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={nav.sidebar.orders}
        primaryAction={{
          label: t.new_order_button,
          onClick: () => router.push("/orders/new"),
          icon: <Plus className="w-4 h-4" />,
        }}
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
