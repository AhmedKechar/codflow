"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/lib/i18n-context";
import type { WilayaStat } from "@/../cod-shared/queries/analytics";

interface WilayaChartProps {
  data: WilayaStat[];
}

export function WilayaChart({ data }: WilayaChartProps) {
  const { locale } = useLanguage();

  const fmt = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-DZ" : "en");

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
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="wilayaName"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          formatter={(value) => [fmt(Number(value)), "طلب"]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar
          dataKey="count"
          fill="#8b5cf6"
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
