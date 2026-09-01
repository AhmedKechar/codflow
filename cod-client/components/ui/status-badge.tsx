"use client";

import { cn } from "@/lib/utils";
import { useCommon } from "@/lib/translations";

// Maps any status string to a CSS var key defined in globals.css
const STATUS_VAR_KEY: Record<string, string> = {
  // Order statuses
  new:              "new",
  confirmed:        "confirmed",
  unreachable:      "unreachable",
  busy:             "busy",
  postponed:        "postponed",
  shipped:          "shipped",
  delivered:        "delivered",
  returned:         "returned",
  cancelled:        "cancelled",
  fake:             "fake",
  duplicate:        "duplicate",
  // Driver statuses
  available:        "delivered",
  active:           "delivered",
  inactive:         "cancelled",
  offline:          "cancelled",
  // Product / user statuses
  suspended:        "returned",
  out_of_stock:     "returned",
  low_stock:        "postponed",
  discontinued:     "cancelled",
  // Product catalog statuses (uppercase)
  ACTIVE:           "delivered",
  DRAFT:            "confirmed",
  ARCHIVED:         "cancelled",
};

export interface StatusBadgeProps {
  status: string;
  /** Display label — if omitted, uses translated status from common.statuses */
  label?: string;
  /** Show the colored dot indicator (default: true) */
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const common = useCommon();
  const varKey = STATUS_VAR_KEY[status] ?? STATUS_VAR_KEY[status.toLowerCase()] ?? "cancelled";
  const displayLabel = label ?? (common.statuses as Record<string, string>)[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[13px] font-semibold border whitespace-nowrap transition-colors",
        className
      )}
      style={{
        backgroundColor: `var(--status-${varKey}-bg)`,
        color: `var(--status-${varKey}-text)`,
        borderColor: `var(--status-${varKey}-border)`,
      }}
    >
      {showDot && (
        <span
          className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: `var(--status-dot-${varKey})` }}
        />
      )}
      {displayLabel}
    </span>
  );
}