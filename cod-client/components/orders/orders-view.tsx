"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { OrdersTable } from "@/components/orders/orders-table";
import type { Order, Driver, DeliveryCompany } from "@/types";
import { useOrders, useNavigation } from "@/lib/translations";
import { PageHeader } from "@/components/ui/page-header";

interface Props {
  orders: Order[];
  drivers: Driver[];
  companies: DeliveryCompany[];
  userScopes: string[];
}

export function OrdersView({ orders, drivers, companies, userScopes }: Props) {
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
        drivers={drivers}
        companies={companies}
        userScopes={userScopes}
      />
    </div>
  );
}
