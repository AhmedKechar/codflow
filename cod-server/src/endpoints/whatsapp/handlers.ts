import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { z } from "zod";
import * as whatsappMessages from "../../../../cod-shared/queries/whatsapp-messages";
import { sendWhatsAppMessage, getMessageTemplate } from "@/services/messaging/whatsapp";
import { logActivity, ACTIONS } from "@/lib/activity";
import { ValidationError, NotFoundError, ExternalApiError } from "@/lib/errors/classes";
import { ERROR_CODES } from "../../../../cod-shared/errors/codes";

const listFiltersSchema = z.object({
  messageType: z.enum(["order_update", "marketing", "support", "automated"]).optional(),
  status: z.enum(["pending", "sent", "delivered", "read", "failed"]).optional(),
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

  const messages = await whatsappMessages.listWhatsAppMessages(db, storeId, filters);

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
  const message = await whatsappMessages.createWhatsAppMessage(db, storeId, {
    phoneNumber: validated.phoneNumber,
    messageType: validated.messageType,
    content,
    orderId: validated.orderId,
    customerId: validated.customerId,
  });

  if (!message) {
    throw new ValidationError("Failed to create message record", ERROR_CODES.INTERNAL_SERVER_ERROR);
  }

  // Send via WhatsApp Business API
  const result = await sendWhatsAppMessage(validated.phoneNumber, content);

  if (!result.success) {
    await whatsappMessages.updateWhatsAppMessageStatus(db, storeId, message.id, "failed", result.error);
    throw new ExternalApiError("WhatsApp", result.error || "Failed to send message");
  }

  // Update status to sent
  await whatsappMessages.updateWhatsAppMessageStatus(db, storeId, message.id, "sent");

  const actor = c.get("user");
  await logActivity(db, actor, "messaging.whatsapp_sent" as any, {
    type: "whatsapp_message",
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
    message: "WhatsApp message sent successfully",
  }, 201);
}
