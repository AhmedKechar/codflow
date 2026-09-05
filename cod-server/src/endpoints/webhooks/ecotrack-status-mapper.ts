/**
 * EcoTrack Status Mapper
 *
 * EcoTrack tracking uses status keys as machine-readable identifiers.
 * These are the known status values from the EcoTrack API:
 *
 *   - "order_information_received_by_carrier" → Order registered at carrier
 *   - "notification_on_order"                 → Remark added (not in docs)
 *   - "picked"                                → Picked up
 *   - "accepted_by_carrier"                   → Accepted at sorting hub
 *   - "dispatched_to_driver"                  → Assigned to driver
 *   - "attempt_delivery"                      → Delivery attempt
 *   - "return_asked"                          → Return initiated
 *   - "return_in_transit"                     → Return in transit
 *   - "Return_received"                       → Return received at hub
 *   - "livred"                                → Delivered
 *   - "encaissed"                             → Payment collected
 *   - "payed"                                 → Paid out to merchant
 *
 * EcoTrack does NOT support inbound webhooks — tracking is pull-only.
 * This mapper is used when tracking events are pulled via getTrackingInfo().
 */

import type { OrderStatus } from "../../../../cod-shared/db/schema";

// Map EcoTrack status to CodFlow order status
const ECOTRACK_STATUS_MAP: Record<string, OrderStatus> = {
  "order_information_received_by_carrier": "new",
  "notification_on_order":                 "confirmed",
  "picked":                                "shipped",
  "accepted_by_carrier":                   "shipped",
  "dispatched_to_driver":                  "shipped",
  "attempt_delivery":                      "unreachable",
  "return_asked":                          "returned",
  "return_in_transit":                     "returned",
  "Return_received":                       "returned",
  "livred":                                "delivered",
  "encaissed":                             "delivered",
  "payed":                                 "delivered",
};

// Map EcoTrack status to carrier_tracking status (6-status model)
const ECOTRACK_CARRIER_STATUS_MAP: Record<string, string> = {
  "order_information_received_by_carrier": "received",
  "notification_on_order":                 "received",
  "picked":                                "in_transit",
  "accepted_by_carrier":                   "at_office",
  "dispatched_to_driver":                  "with_driver",
  "attempt_delivery":                      "with_driver",
  "return_asked":                          "returned",
  "return_in_transit":                     "returned",
  "Return_received":                       "returned",
  "livred":                                "delivered",
  "encaissed":                             "delivered",
  "payed":                                 "delivered",
};

/**
 * Map an EcoTrack status to a CodFlow order status.
 *
 * Returns null if the status is not recognized.
 * Caller should NOT change order status when null is returned.
 */
export function mapEcotrackStatus(
  status: string | null | undefined
): OrderStatus | null {
  if (!status) return null;
  // EcoTrack uses mixed case (e.g. "Return_received", "livred")
  // Normalize to lowercase for lookup
  const normalized = status.trim();
  // Try exact match first (handles "Return_received")
  if (ECOTRACK_STATUS_MAP[normalized]) {
    return ECOTRACK_STATUS_MAP[normalized];
  }
  // Try lowercase
  return ECOTRACK_STATUS_MAP[normalized.toLowerCase()] ?? null;
}

/**
 * Map an EcoTrack status to a carrier_tracking status (6-status model).
 *
 * Returns null if the status is not recognized.
 */
export function mapEcotrackCarrierStatus(
  status: string | null | undefined
): string | null {
  if (!status) return null;
  const normalized = status.trim();
  if (ECOTRACK_CARRIER_STATUS_MAP[normalized]) {
    return ECOTRACK_CARRIER_STATUS_MAP[normalized];
  }
  return ECOTRACK_CARRIER_STATUS_MAP[normalized.toLowerCase()] ?? null;
}

/**
 * Check if an EcoTrack status should trigger an automatic order status update.
 *
 * Some events (like "notification_on_order" for remarks) should NOT change the order status.
 * "encaissed" and "payed" are financial events — status is already "delivered" from "livred".
 */
export function shouldAutoUpdateEcotrackStatus(
  status: string | null | undefined
): boolean {
  if (!status) return false;
  const normalized = status.trim();
  // These should not trigger auto status update
  const noUpdateStatuses = [
    "notification_on_order", // remark added
    "encaissed",             // financial — already delivered
    "payed",                 // financial — already delivered
  ];
  return !noUpdateStatuses.includes(normalized) && !noUpdateStatuses.includes(normalized.toLowerCase());
}

/**
 * Get the human-readable Arabic label for an EcoTrack status.
 */
export function getEcotrackStatusLabel(
  status: string | null | undefined
): string {
  if (!status) return "حالة غير معروفة";
  const labels: Record<string, string> = {
    "order_information_received_by_carrier": "تم استلام الطلب من الشركة",
    "notification_on_order":                 "تحديث",
    "picked":                                "تم الاستلام",
    "accepted_by_carrier":                   "في مركز الفرز",
    "dispatched_to_driver":                  "مع السائق",
    "attempt_delivery":                      "محاولة تسليم",
    "return_asked":                          "مرتجع",
    "return_in_transit":                     "مرتجع في الطريق",
    "Return_received":                       "تم استلام المرتجع",
    "livred":                                "تم التسليم",
    "encaissed":                             "تم تحصيل المبلغ",
    "payed":                                 "تم الدفع",
  };
  return labels[status.trim()] ?? labels[status.trim().toLowerCase()] ?? status;
}
