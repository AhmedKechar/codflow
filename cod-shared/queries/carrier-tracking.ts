import { eq, and, desc } from "drizzle-orm";
import { carrierTracking } from "../db/schema";
import type { AppDb } from "../db/client";

export interface CarrierTrackingFilters {
  orderId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function getCarrierTrackingByOrder(
  db: AppDb,
  storeId: string,
  orderId: string
) {
  return await db
    .select()
    .from(carrierTracking)
    .where(and(eq(carrierTracking.storeId, storeId), eq(carrierTracking.orderId, orderId)))
    .orderBy(desc(carrierTracking.eventTime))
    .all();
}

export async function getCarrierTrackingByStore(
  db: AppDb,
  storeId: string,
  filters?: CarrierTrackingFilters
) {
  const conditions = [eq(carrierTracking.storeId, storeId)];

  if (filters?.orderId) {
    conditions.push(eq(carrierTracking.orderId, filters.orderId));
  }
  if (filters?.status) {
    conditions.push(eq(carrierTracking.status, filters.status as any));
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  return await db
    .select()
    .from(carrierTracking)
    .where(and(...conditions))
    .orderBy(desc(carrierTracking.eventTime))
    .limit(limit)
    .offset(offset)
    .all();
}

export async function getLatestCarrierStatus(
  db: AppDb,
  storeId: string,
  orderId: string
) {
  const result = await db
    .select()
    .from(carrierTracking)
    .where(and(eq(carrierTracking.storeId, storeId), eq(carrierTracking.orderId, orderId)))
    .orderBy(desc(carrierTracking.eventTime))
    .limit(1)
    .get();

  return result || null;
}

export async function upsertCarrierTracking(
  db: AppDb,
  data: {
    orderId: string;
    storeId: string;
    companyId: string;
    trackingNumber: string;
    status: string;
    statusRaw?: string;
    statusAr?: string;
    location?: string;
    eventTime: string;
    rawData?: string;
  }
) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Check if tracking event already exists for this tracking number + status + time
  const existing = await db
    .select()
    .from(carrierTracking)
    .where(
      and(
        eq(carrierTracking.trackingNumber, data.trackingNumber),
        eq(carrierTracking.status, data.status as any),
        eq(carrierTracking.eventTime, data.eventTime)
      )
    )
    .get();

  if (existing) {
    return existing;
  }

  const record = {
    id,
    orderId: data.orderId,
    storeId: data.storeId,
    companyId: data.companyId,
    trackingNumber: data.trackingNumber,
    status: data.status as any,
    statusRaw: data.statusRaw ?? null,
    statusAr: data.statusAr ?? null,
    location: data.location ?? null,
    eventTime: data.eventTime,
    rawData: data.rawData ?? null,
    createdAt: now,
  };

  await db.insert(carrierTracking).values(record);

  return record;
}

export async function deleteCarrierTrackingByOrder(
  db: AppDb,
  storeId: string,
  orderId: string
) {
  await db
    .delete(carrierTracking)
    .where(and(eq(carrierTracking.storeId, storeId), eq(carrierTracking.orderId, orderId)));
}
