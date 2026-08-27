"use client";

import { Store, CreditCard, Clock, Banknote } from "lucide-react";
import { useDashboard } from "@/lib/translations";
import { StatCard } from "@/components/ui/stat-card";

interface StatCardsProps {
  totalStores: number;
  activeSubscriptions: number;
  pendingPayments: number;
  totalRevenue: number;
}

export function DashboardStatCards({
  totalStores,
  activeSubscriptions,
  pendingPayments,
  totalRevenue,
}: StatCardsProps) {
  const t = useDashboard();

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title={t.total_stores} value={totalStores} icon={Store} />
      <StatCard title={t.active_subscriptions} value={activeSubscriptions} icon={CreditCard} />
      <StatCard title={t.pending_payments} value={pendingPayments} icon={Clock} />
      <StatCard
        title={t.total_revenue}
        value={`${t.currency} ${totalRevenue.toLocaleString()}`}
        icon={Banknote}
      />
    </div>
  );
}
