/**
 * NOEST Status Mapper
 *
 * NOEST tracking activity uses event_key as machine-readable identifier.
 * These are the known event_key values from the NOEST API:
 *
 *   - "upload"                   → Order uploaded to NOEST system
 *   - "customer_validation"      → Order validated by NOEST
 *   - "prise_en_charge"          → Order picked up / in transit
 *   - "livreur_en_cours"         → With driver for delivery
 *   - "livre"                    → Delivered successfully
 *   - "return"                   → Return initiated
 *   - "retourne"                 → Returned to sender
 *   - "annule"                   → Cancelled
 *   - "echec_livraison"          → Delivery attempt failed
 *   - "mise_a_jour"              → Status update / remark added
 *
 * NOEST does NOT support inbound webhooks — tracking is pull-only.
 * This mapper is used when tracking events are pulled via getTrackingInfo().
 */

import type { OrderStatus } from "../../../../cod-shared/db/schema";

// Map NOEST event_key to CodFlow order status
// Keys are lowercased for case-insensitive lookup
const NOEST_EVENT_KEY_MAP: Record<string, OrderStatus> = {
  "upload":               "new",
  "customer_validation":  "confirmed",
  "prise_en_charge":      "shipped",
  "livreur_en_cours":     "shipped",
  "livre":                "delivered",
  "return":               "returned",
  "retourne":             "returned",
  "annule":               "cancelled",
  "echec_livraison":      "unreachable",
  "mise_a_jour":          "confirmed", // remark added — no status change, keep current
};

// Map NOEST event_key to carrier_tracking status (simplified 6-status model)
const NOEST_CARRIER_STATUS_MAP: Record<string, string> = {
  "upload":               "received",
  "customer_validation":  "received",
  "prise_en_charge":      "in_transit",
  "livreur_en_cours":     "with_driver",
  "livre":                "delivered",
  "return":               "returned",
  "retourne":             "returned",
  "annule":               "returned",
  "echec_livraison":      "with_driver",
  "mise_a_jour":          "in_transit",
};

/**
 * Map a NOEST event_key to a CodFlow order status.
 *
 * Returns null if the event_key is not recognized.
 * Caller should NOT change order status when null is returned.
 */
export function mapNoestEventKey(
  eventKey: string | null | undefined
): OrderStatus | null {
  if (!eventKey) return null;
  const normalized = eventKey.toLowerCase().trim();
  return NOEST_EVENT_KEY_MAP[normalized] ?? null;
}

/**
 * Map a NOEST event_key to a carrier_tracking status (6-status model).
 *
 * Returns null if the event_key is not recognized.
 */
export function mapNoestCarrierStatus(
  eventKey: string | null | undefined
): string | null {
  if (!eventKey) return null;
  const normalized = eventKey.toLowerCase().trim();
  return NOEST_CARRIER_STATUS_MAP[normalized] ?? null;
}

/**
 * Check if a NOEST event_key should trigger an automatic order status update.
 *
 * Some events (like "mise_a_jour" for remarks) should NOT change the order status
 * even though we can map them. This function returns false for those events.
 */
export function shouldAutoUpdateNoestStatus(
  eventKey: string | null | undefined
): boolean {
  if (!eventKey) return false;
  const normalized = eventKey.toLowerCase().trim();
  // "mise_a_jour" is a remark/update — no status change
  return normalized !== "mise_a_jour";
}

/**
 * Get the human-readable Arabic label for a NOEST event key.
 */
export function getNoestEventLabel(
  eventKey: string | null | undefined
): string {
  if (!eventKey) return "حدث غير معروف";
  const labels: Record<string, string> = {
    "upload":               "تم التسجيل في النظام",
    "customer_validation":  "تم التأكيد",
    "prise_en_charge":      "في الطريق",
    "livreur_en_cours":     "مع السائق",
    "livre":                "تم التسليم",
    "return":               "مرتجع",
    "retourne":             "مرتجع",
    "annule":               "ملغي",
    "echec_livraison":      "فشل التسليم",
    "mise_a_jour":          "تحديث",
  };
  return labels[eventKey.toLowerCase().trim()] ?? eventKey;
}
