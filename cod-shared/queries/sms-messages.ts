import { eq, and, or, like, desc } from "drizzle-orm";
import { smsMessages } from "../db/schema";
import type { AppDb } from "../db/client";

export interface SmsMessageFilters {
  messageType?: string;
  status?: string;
  orderId?: string;
  customerId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateSmsMessageData {
  orderId?: string;
  customerId?: string;
  phoneNumber: string;
  messageType: "order_update" | "marketing" | "support" | "automated";
  content: string;
}

export async function listSmsMessages(db: AppDb, storeId: string, filters?: SmsMessageFilters) {
  const conditions = [eq(smsMessages.storeId, storeId)];

  if (filters?.messageType) {
    conditions.push(eq(smsMessages.messageType, filters.messageType as any));
  }

  if (filters?.status) {
    conditions.push(eq(smsMessages.status, filters.status as any));
  }

  if (filters?.orderId) {
    conditions.push(eq(smsMessages.orderId, filters.orderId));
  }

  if (filters?.customerId) {
    conditions.push(eq(smsMessages.customerId, filters.customerId));
  }

  if (filters?.search) {
    const searchConditions = or(
      like(smsMessages.phoneNumber, `%${filters.search}%`),
      like(smsMessages.content, `%${filters.search}%`),
    );
    if (searchConditions) conditions.push(searchConditions);
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  return await db
    .select()
    .from(smsMessages)
    .where(and(...conditions))
    .orderBy(desc(smsMessages.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

export async function getSmsMessageById(db: AppDb, storeId: string, id: string) {
  return await db
    .select()
    .from(smsMessages)
    .where(and(eq(smsMessages.id, id), eq(smsMessages.storeId, storeId)))
    .get();
}

export async function createSmsMessage(db: AppDb, storeId: string, data: CreateSmsMessageData) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const message = {
    id,
    storeId,
    orderId: data.orderId ?? null,
    customerId: data.customerId ?? null,
    phoneNumber: data.phoneNumber,
    messageType: data.messageType,
    content: data.content,
    status: "pending" as const,
    errorMessage: null,
    sentAt: null,
    createdAt: now,
  };

  await db.insert(smsMessages).values(message);

  return getSmsMessageById(db, storeId, id);
}

export async function updateSmsMessageStatus(
  db: AppDb,
  storeId: string,
  id: string,
  status: "sent" | "delivered" | "failed",
  errorMessage?: string,
) {
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { status };

  if (status === "sent") updateData.sentAt = now;
  if (status === "failed" && errorMessage) updateData.errorMessage = errorMessage;

  await db
    .update(smsMessages)
    .set(updateData)
    .where(and(eq(smsMessages.id, id), eq(smsMessages.storeId, storeId)));

  return getSmsMessageById(db, storeId, id);
}
