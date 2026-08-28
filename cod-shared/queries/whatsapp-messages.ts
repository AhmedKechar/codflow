import { eq, and, or, like, desc } from "drizzle-orm";
import { whatsappMessages } from "../db/schema";
import type { AppDb } from "../db/client";

export interface WhatsAppMessageFilters {
  messageType?: string;
  status?: string;
  orderId?: string;
  customerId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateWhatsAppMessageData {
  orderId?: string;
  customerId?: string;
  phoneNumber: string;
  messageType: "order_update" | "marketing" | "support" | "automated";
  content: string;
}

export async function listWhatsAppMessages(db: AppDb, storeId: string, filters?: WhatsAppMessageFilters) {
  const conditions = [eq(whatsappMessages.storeId, storeId)];

  if (filters?.messageType) {
    conditions.push(eq(whatsappMessages.messageType, filters.messageType as any));
  }

  if (filters?.status) {
    conditions.push(eq(whatsappMessages.status, filters.status as any));
  }

  if (filters?.orderId) {
    conditions.push(eq(whatsappMessages.orderId, filters.orderId));
  }

  if (filters?.customerId) {
    conditions.push(eq(whatsappMessages.customerId, filters.customerId));
  }

  if (filters?.search) {
    const searchConditions = or(
      like(whatsappMessages.phoneNumber, `%${filters.search}%`),
      like(whatsappMessages.content, `%${filters.search}%`),
    );
    if (searchConditions) conditions.push(searchConditions);
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  return await db
    .select()
    .from(whatsappMessages)
    .where(and(...conditions))
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

export async function getWhatsAppMessageById(db: AppDb, storeId: string, id: string) {
  return await db
    .select()
    .from(whatsappMessages)
    .where(and(eq(whatsappMessages.id, id), eq(whatsappMessages.storeId, storeId)))
    .get();
}

export async function createWhatsAppMessage(db: AppDb, storeId: string, data: CreateWhatsAppMessageData) {
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
    deliveredAt: null,
    readAt: null,
    createdAt: now,
  };

  await db.insert(whatsappMessages).values(message);

  return getWhatsAppMessageById(db, storeId, id);
}

export async function updateWhatsAppMessageStatus(
  db: AppDb,
  storeId: string,
  id: string,
  status: "sent" | "delivered" | "read" | "failed",
  errorMessage?: string,
) {
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { status };

  if (status === "sent") updateData.sentAt = now;
  if (status === "delivered") updateData.deliveredAt = now;
  if (status === "read") updateData.readAt = now;
  if (status === "failed" && errorMessage) updateData.errorMessage = errorMessage;

  await db
    .update(whatsappMessages)
    .set(updateData)
    .where(and(eq(whatsappMessages.id, id), eq(whatsappMessages.storeId, storeId)));

  return getWhatsAppMessageById(db, storeId, id);
}
