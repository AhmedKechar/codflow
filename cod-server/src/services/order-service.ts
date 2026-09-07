import type { AppDb } from "../../../cod-shared/db/client";
import {
  assignCompany as assignCompanyQuery,
  updateOrderTracking as updateOrderTrackingQuery,
} from "../../../cod-shared/queries/orders";

export async function dispatchToCarrier(
  db: AppDb,
  storeId: string,
  orderId: string,
  companyId: string,
  trackingNumber: string,
  trackingUrl?: string,
  deliveryMethodName?: string,
) {
  await assignCompanyQuery(db, storeId, orderId, companyId);
  await updateOrderTrackingQuery(
    db,
    storeId,
    orderId,
    trackingNumber,
    trackingUrl,
    deliveryMethodName,
  );
}
