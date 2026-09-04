"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/lib/i18n-context";
import type { DailyRevenue } from "@/../cod-shared/queries/analytics";

interface RevenueChartProps {
  data: DailyRevenue[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const { locale } = useLanguage();

  const fmt = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-DZ" : "en", {
      maximumFractionDigits: 0,
    });

  const fmtDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(locale === "ar" ? "ar-DZ" : "en", {
      month: "short",
      day: "numeric",
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px]">
        <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest">
          لا توجد بيانات
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          formatter={(value) => [fmt(Number(value)), "إيراد"]}
          labelFormatter={(label) => fmtDate(String(label))}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
