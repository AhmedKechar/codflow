/**
 * Application Constants
 * 
 * Centralized constants for the entire application.
 * All hardcoded values should be defined here for easy maintenance.
 */



// Order Statuses
export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "unreachable",
  "busy",
  "postponed",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
  "fake",
  "duplicate",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Order Status Colors
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  confirmed: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  unreachable: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  busy: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  postponed: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  shipped: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  delivered: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  returned: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  fake: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  duplicate: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

// Vehicle Types
export const VEHICLE_TYPES = ["motorcycle", "car", "van"] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

// Delivery Types
export const DELIVERY_TYPES = ["home", "stop_desk"] as const;

export type DeliveryType = (typeof DELIVERY_TYPES)[number];

// Avatar Colors (for customer/driver avatars)
export const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B739",
  "#6C5CE7",
] as const;

// Product Categories
export const PRODUCT_CATEGORIES = [
  "أقمشة",
  "ملابس",
  "إكسسوارات",
  "أحذية",
  "حقائب",
  "أخرى",
] as const;
