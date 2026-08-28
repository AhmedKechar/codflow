"use client";

import { PackageX, TrendingUp, DollarSign, Users } from "lucide-react";
import { useAbandonedOrders } from "@/lib/translations";
import type { AbandonedOrderStats } from "@/actions/abandoned-orders";

interface AbandonedStatsProps {
  stats: AbandonedOrderStats | null;
  isLoading?: boolean;
}

export function AbandonedStats({ stats, isLoading }: AbandonedStatsProps) {
  const t = useAbandonedOrders();

  const cards = [
    {
      key: "abandoned",
      icon: PackageX,
      label: t.stats?.abandoned ?? "Abandoned",
      value: stats?.totalAbandoned ?? 0,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      key: "converted",
      icon: TrendingUp,
      label: t.stats?.converted ?? "Converted",
      value: stats?.totalConverted ?? 0,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      key: "conversion_rate",
      icon: Users,
      label: t.stats?.conversion_rate ?? "Conversion Rate",
      value: `${stats?.conversionRate ?? 0}%`,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      key: "lost_revenue",
      icon: DollarSign,
      label: t.stats?.lost_revenue ?? "Lost Revenue",
      value: `${(stats?.estimatedLostRevenue ?? 0).toLocaleString()} دج`,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-6 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted/50" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-muted/50 rounded" />
                <div className="h-6 w-16 bg-muted/50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}
            >
              <card.icon size={24} className={card.color} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
