export type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "returned"
  | "cancelled"
  | "abandoned"
  | "unreachable"
  | "busy"
  | "postponed"
  | "lost"
  | "exchange"
  | "refund"
  | "partial_refund";

export const STATUS_RANK: Record<OrderStatus, number> = {
  new: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
  returned: 6,
  cancelled: 7,
  abandoned: 8,
  unreachable: 1,
  busy: 1,
  postponed: 1,
  lost: 6,
  exchange: 6,
  refund: 6,
  partial_refund: 6,
};

export const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "delivered",
  "cancelled",
  "returned",
  "abandoned",
  "lost",
  "exchange",
  "refund",
  "partial_refund",
]);

export const READ_ONLY_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "delivered",
  "cancelled",
  "returned",
  "abandoned",
  "lost",
  "exchange",
  "refund",
  "partial_refund",
]);

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["confirmed", "cancelled", "abandoned", "unreachable", "busy", "postponed"],
  confirmed: ["processing", "shipped", "cancelled", "delivered", "unreachable", "busy", "postponed"],
  processing: ["shipped", "cancelled", "delivered"],
  shipped: ["out_for_delivery", "delivered", "cancelled", "unreachable", "busy", "postponed"],
  out_for_delivery: ["delivered", "returned", "cancelled", "unreachable", "busy", "postponed"],
  delivered: ["returned", "exchange", "refund", "partial_refund"],
  cancelled: [],
  abandoned: [],
  returned: ["exchange", "refund", "partial_refund"],
  unreachable: ["confirmed", "cancelled", "abandoned"],
  busy: ["confirmed", "cancelled", "abandoned"],
  postponed: ["confirmed", "cancelled", "abandoned"],
  lost: [],
  exchange: [],
  refund: [],
  partial_refund: [],
};

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function getStatusRank(status: OrderStatus): number {
  return STATUS_RANK[status] ?? 0;
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

export function isReadOnly(status: OrderStatus): boolean {
  return READ_ONLY_STATUSES.has(status);
}
