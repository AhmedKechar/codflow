import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { z } from "zod";
import * as smsMessages from "../../../../cod-shared/queries/sms-messages";
import { sendSmsMessage, getMessageTemplate } from "@/services/messaging/sms";
import { logActivity, ACTIONS } from "@/lib/activity";
import { ValidationError, ExternalApiError } from "@/lib/errors/classes";
import { ERROR_CODES } from "../../../../cod-shared/errors/codes";

const listFiltersSchema = z.object({
  messageType: z.enum(["order_update", "marketing", "support", "automated"]).optional(),
  status: z.enum(["pending", "sent", "delivered", "failed"]).optional(),
  orderId: z.string().optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const sendMessageSchema = z.object({
  phoneNumber: z.string().min(1),
  messageType: z.enum(["order_update", "marketing", "support", "automated"]),
  content: z.string().optional(),
  orderId: z.string().optional(),
  customerId: z.string().optional(),
  templateData: z.record(z.string(), z.string()).optional(),
});

export async function listMessages(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;

  const query: any = (c.req as any).valid?.("query");
  const filters = query ?? listFiltersSchema.parse({
    messageType: c.req.query("messageType"),
    status: c.req.query("status"),
    orderId: c.req.query("orderId"),
    customerId: c.req.query("customerId"),
    search: c.req.query("search"),
    limit: c.req.query("limit"),
    offset: c.req.query("offset"),
  });

  const messages = await smsMessages.listSmsMessages(db, storeId, filters);

  return c.json({
    success: true,
    data: messages,
    count: messages.length,
  }, 200);
}

export async function sendMessage(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;

  const jsonBody: any = (c.req as any).valid?.("json");
  const validated = jsonBody ?? sendMessageSchema.parse(await c.req.json());

  const content = validated.content || getMessageTemplate(
    validated.messageType,
    validated.templateData || {},
  );

  // Create the message record
  const message = await smsMessages.createSmsMessage(db, storeId, {
    phoneNumber: validated.phoneNumber,
    messageType: validated.messageType,
    content,
    orderId: validated.orderId,
    customerId: validated.customerId,
  });

  if (!message) {
    throw new ValidationError("Failed to create message record", ERROR_CODES.INTERNAL_SERVER_ERROR);
  }

  // Send via SMS provider
  const result = await sendSmsMessage(validated.phoneNumber, content);

  if (!result.success) {
    await smsMessages.updateSmsMessageStatus(db, storeId, message.id, "failed", result.error);
    throw new ExternalApiError("SMS", result.error || "Failed to send SMS");
  }

  // Update status to sent
  await smsMessages.updateSmsMessageStatus(db, storeId, message.id, "sent");

  const actor = c.get("user");
  await logActivity(db, actor, "messaging.sms_sent" as any, {
    type: "sms_message",
    id: message.id,
    label: validated.phoneNumber,
  }, { messageType: validated.messageType });

  return c.json({
    success: true,
    data: {
      id: message.id,
      status: "sent",
      messageId: result.messageId,
    },
    message: "SMS message sent successfully",
  }, 201);
}
