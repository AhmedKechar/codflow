"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChipProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  variant?: "default" | "status";
  statusColor?: string;
  className?: string;
}

export function FilterChip({
  label,
  count,
  active = false,
  onClick,
  onRemove,
  variant = "default",
  statusColor,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/chip inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-all",
        variant === "default" && [
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:border-muted-foreground/50 hover:bg-muted/50",
        ],
        variant === "status" && [
          active
            ? "border-foreground/20 bg-foreground text-background"
            : "border-border bg-card text-foreground hover:border-muted-foreground/50 hover:bg-muted/50",
        ],
        className
      )}
    >
      {variant === "status" && statusColor && (
        <span
          className={cn(
            "size-2 rounded-full",
            statusColor,
            active && "bg-background"
          )}
        />
      )}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-xs font-semibold",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
      {onRemove && active && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onRemove();
            }
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-primary-foreground/20"
        >
          <XIcon className="size-3" />
        </span>
      )}
    </button>
  );
}
