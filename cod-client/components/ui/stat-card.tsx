import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-lg border border-border p-5",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
          <Icon size={20} className="text-foreground" />
        </div>
        {trend && (
          <div
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1.5 border",
              trend.isPositive
                ? "bg-success/[0.08] text-success border-success/20"
                : "bg-destructive/[0.08] text-destructive border-destructive/20"
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: trend.isPositive ? "var(--success)" : "var(--destructive)" }}
            />
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground mb-1 tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-[13px] text-muted-foreground">
          {title}
        </p>
      </div>
    </div>
  );
}