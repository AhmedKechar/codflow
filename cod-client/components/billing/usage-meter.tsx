"use client";

import { cn } from "@/lib/utils";

interface Props {
  label: string;
  used: number;
  total: number;
}

export function UsageMeter({ label, used, total }: Props) {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  const color =
    percentage < 50
      ? "bg-green-500"
      : percentage < 80
        ? "bg-amber-500"
        : "bg-red-500";

  const bgColor =
    percentage < 50
      ? "bg-green-500/10"
      : percentage < 80
        ? "bg-amber-500/10"
        : "bg-red-500/10";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-foreground">{label}</span>
        <span className="text-muted-foreground">
          <span className="font-black text-foreground">{used}</span>
          <span className="mx-0.5">/</span>
          <span className="font-bold">{total}</span>
        </span>
      </div>

      <div className={cn("h-2 rounded-full overflow-hidden", bgColor)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
