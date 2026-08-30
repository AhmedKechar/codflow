"use client";

import { cn } from "@/lib/utils";

export interface FilterResultCountProps {
  count: number;
  total?: number;
  label?: string;
  className?: string;
}

export function FilterResultCount({
  count,
  total,
  label = "نتيجة",
  className,
}: FilterResultCountProps) {
  if (total !== undefined && count === total) {
    return null;
  }

  return (
    <span
      className={cn(
        "text-sm text-muted-foreground",
        className
      )}
    >
      {count} {label}
      {total !== undefined && (
        <span className="text-muted-foreground/60"> من {total}</span>
      )}
    </span>
  );
}
