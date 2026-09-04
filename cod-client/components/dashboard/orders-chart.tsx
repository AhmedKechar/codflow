"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/lib/i18n-context";
import type { DailyOrders } from "@/../cod-shared/queries/analytics";

interface OrdersChartProps {
  data: DailyOrders[];
}

export function OrdersChart({ data }: OrdersChartProps) {
  const { locale } = useLanguage();

  const fmt = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-DZ" : "en");

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
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
          width={40}
        />
        <Tooltip
          formatter={(value) => [fmt(Number(value)), "طلب"]}
          labelFormatter={(label) => fmtDate(String(label))}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar
          dataKey="count"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
