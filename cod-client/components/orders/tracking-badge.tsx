"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const CARRIER_STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_transit: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  at_office: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  with_driver: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  delivered: "bg-green-500/10 text-green-600 border-green-500/20",
  returned: "bg-red-500/10 text-red-600 border-red-500/20",
};

const CARRIER_STATUS_LABELS: Record<string, string> = {
  received: "تم الاستلام",
  in_transit: "في الطريق",
  at_office: "في المكتب",
  with_driver: "مع السائق",
  delivered: "تم التسليم",
  returned: "مرتجع",
};

interface TrackingBadgeProps {
  status: string;
  className?: string;
}

export function TrackingBadge({ status, className }: TrackingBadgeProps) {
  const colorClass = CARRIER_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground";
  const label = CARRIER_STATUS_LABELS[status] ?? status;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-bold px-1.5 py-0.5",
        colorClass,
        className
      )}
    >
      {label}
    </Badge>
  );
}
