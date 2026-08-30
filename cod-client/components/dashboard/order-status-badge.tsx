import { useOrders } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { getStatusBadgeClass } from "@/lib/order-status-colors";
import type { OrderStatus } from "../../../cod-shared/db/schema";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const t = useOrders();
  const label = t.status[status];
  const badgeClass = getStatusBadgeClass(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border",
        badgeClass,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
