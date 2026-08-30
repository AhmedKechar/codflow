import type { OrderStatus } from "../../cod-shared/db/schema";

export type StatusConfig = {
  label: string;
  labelAr: string;
  dotClass: string;
  badgeClass: string;
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  new: {
    label: "New",
    labelAr: "جديد",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  confirmed: {
    label: "Confirmed",
    labelAr: "مؤكد",
    dotClass: "bg-indigo-500",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
  },
  unreachable: {
    label: "Unreachable",
    labelAr: "غير متاح",
    dotClass: "bg-gray-500",
    badgeClass: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800",
  },
  preparing: {
    label: "Preparing",
    labelAr: "قيد التحضير",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  ready: {
    label: "Ready",
    labelAr: "جاهز",
    dotClass: "bg-yellow-500",
    badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  },
  assigned: {
    label: "Assigned",
    labelAr: "تم التعيين",
    dotClass: "bg-purple-500",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  },
  dispatched: {
    label: "Dispatched",
    labelAr: "تم الإرسال",
    dotClass: "bg-violet-500",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    labelAr: "خرج للتسليم",
    dotClass: "bg-cyan-500",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
  },
  delivered: {
    label: "Delivered",
    labelAr: "تم التسليم",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  returned: {
    label: "Returned",
    labelAr: "مرتجع",
    dotClass: "bg-orange-500",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  },
  cancelled: {
    label: "Cancelled",
    labelAr: "ملغي",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
};

export function getStatusColor(status: OrderStatus): StatusConfig {
  return ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG.new;
}

export function getStatusDotClass(status: OrderStatus): string {
  return getStatusColor(status).dotClass;
}

export function getStatusBadgeClass(status: OrderStatus): string {
  return getStatusColor(status).badgeClass;
}
