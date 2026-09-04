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
  busy: {
    label: "Busy",
    labelAr: "مشغول",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  postponed: {
    label: "Postponed",
    labelAr: "مؤجل",
    dotClass: "bg-purple-500",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  },
  shipped: {
    label: "Shipped",
    labelAr: "قيد التوصيل",
    dotClass: "bg-teal-500",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
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
  fake: {
    label: "Fake",
    labelAr: "مزيف",
    dotClass: "bg-darkred",
    badgeClass: "bg-red-50 text-darkred border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  duplicate: {
    label: "Duplicate",
    labelAr: "مكرر",
    dotClass: "bg-slate-500",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800",
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
