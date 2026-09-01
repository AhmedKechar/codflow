"use client";

import { LucideIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 px-6 text-center rounded-lg border border-border bg-card",
      className
    )}>
      <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto">
        <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-muted">
          <Icon size={28} className="text-muted-foreground" />
        </div>

        <h3 className="text-base font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-8">
          {description}
        </p>

        {onAction && actionLabel && (
          <Button
            onClick={onAction}
            size="default"
          >
            <Plus size={16} className="me-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}