"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ORDER_STATUS_CONFIG } from "@/lib/order-status-colors";
import { useLanguage } from "@/lib/i18n-context";
import { useCommon } from "@/lib/translations";
import type { OrderStatus } from "../../../cod-shared/db/schema";

interface StatusBarChartProps {
  data: Array<{ status: OrderStatus; count: number }>;
  className?: string;
}

const CHART_COLORS: Record<OrderStatus, string> = {
  new: "#3b82f6",
  confirmed: "#6366f1",
  unreachable: "#6b7280",
  preparing: "#f59e0b",
  ready: "#eab308",
  assigned: "#a855f7",
  dispatched: "#8b5cf6",
  out_for_delivery: "#06b6d4",
  delivered: "#22c55e",
  returned: "#f97316",
  cancelled: "#ef4444",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      status: OrderStatus;
      count: number;
      label: string;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-foreground">{item.payload.label}</p>
      <p className="text-xs text-muted-foreground">{item.value} طلب</p>
    </div>
  );
}

export function StatusBarChart({ data, className }: StatusBarChartProps) {
  const common = useCommon();
  const { dir } = useLanguage();

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      label: (common.statuses as Record<string, string>)[d.status] ?? d.status,
    }));

  const total = chartData.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center h-[200px] text-muted-foreground text-sm ${className ?? ""}`}>
        لا توجد بيانات
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={80}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            reversed={dir === "rtl"}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
            {chartData.map((entry) => (
              <Cell
                key={entry.status}
                fill={CHART_COLORS[entry.status]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
