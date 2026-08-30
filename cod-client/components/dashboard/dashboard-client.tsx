"use client";

import {
  ShoppingBag,
  Sparkles,
  Package,
  CheckCircle2,
  Undo2,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard, useNavigation } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChartsSection } from "./charts-section";
import type { OrderStatusStat } from "@/../cod-shared/queries/analytics";
import type { LucideIcon } from "lucide-react";

interface StatCard {
  key: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  statuses?: string[];
}

interface DashboardClientProps {
  statusStats: OrderStatusStat[];
}

export function DashboardClient({ statusStats }: DashboardClientProps) {
  const t = useDashboard();
  const nav = useNavigation();
  const { locale, dir } = useLanguage();

  const statsMap = Object.fromEntries(statusStats.map((s) => [s.status, s.count]));
  const total = statusStats.reduce((sum, s) => sum + s.count, 0);
  const fmt = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-DZ" : "en");

  const tooltips = t.status_tooltips as Record<string, string>;

  const statCards: StatCard[] = [
    {
      key: "total",
      label: t.stats.total_orders,
      icon: ShoppingBag,
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      key: "new",
      label: "طلبات جديدة",
      icon: Sparkles,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      statuses: ["new"],
    },
    {
      key: "preparing",
      label: "قيد التحضير",
      icon: Package,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      statuses: ["confirmed", "preparing", "ready"],
    },
    {
      key: "delivered",
      label: "تم التسليم",
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      statuses: ["delivered"],
    },
    {
      key: "returned",
      label: "مرتجعات",
      icon: Undo2,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      statuses: ["returned", "cancelled"],
    },
  ];

  const getCardCount = (card: StatCard): number => {
    if (card.key === "total") return total;
    if (card.statuses) {
      return card.statuses.reduce((sum, s) => sum + (statsMap[s] ?? 0), 0);
    }
    return statsMap[card.key] ?? 0;
  };

  return (
    <div className="space-y-8 pb-12 pt-4">
      <PageHeader title={nav.sidebar.dashboard} />

      {/* 5 stat cards */}
      <TooltipProvider delay={400}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
          {statCards.map((card, i) => {
            const count = getCardCount(card);
            const { icon: Icon, iconBg, iconColor } = card;

            return (
              <Tooltip key={card.key}>
                <TooltipTrigger
                  render={
                    <div
                      className="group relative overflow-hidden rounded-lg border border-border bg-card p-6"
                      style={{ animationDelay: `${i * 60}ms` }}
                    />
                  }
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", iconBg)}>
                        <Icon size={20} className={iconColor} />
                      </div>
                      <ArrowUpRight size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {card.label}
                      </p>
                      <p className="text-3xl leading-none tracking-tight text-foreground font-semibold">
                        {fmt(count)}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>

                <TooltipContent
                  side="bottom"
                  className="max-w-[220px] rounded-lg px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">
                    {card.label}
                  </p>
                  <p className="text-xs leading-relaxed" dir={dir}>
                    {tooltips[card.key] ?? tooltips.total_orders}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Charts section */}
      <ChartsSection data={statusStats} />
    </div>
  );
}
