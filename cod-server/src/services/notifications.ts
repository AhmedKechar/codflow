/**
 * Notification Service
 *
 * Sends WhatsApp/SMS notifications to customers when order status changes.
 * Reads notification settings from the database to determine if a notification
 * should be sent and via which channel.
 */

import { eq, and } from "drizzle-orm";
import { notificationSettings, orders, customers } from "@/db/schema";
import type { AppDb } from "@/db";
import { sendWhatsAppMessage } from "./messaging/whatsapp";
import { sendSmsMessage } from "./messaging/sms";

export type OrderStatus =
  | "new" | "confirmed" | "unreachable" | "busy" | "postponed"
  | "shipped" | "delivered" | "cancelled" | "fake" | "duplicate" | "returned";

export type NotificationChannel = "whatsapp" | "sms" | "both";

interface NotificationResult {
  whatsapp?: { success: boolean; messageId?: string; error?: string };
  sms?: { success: boolean; messageId?: string; error?: string };
}

// Status labels in Arabic for customer messages
const STATUS_LABELS_AR: Record<OrderStatus, string> = {
  new: "جديد",
  confirmed: "تم تأكيد طلبك",
  unreachable: "لم نتمكن من الوصول إليك",
  busy: "الخط مشغول",
  postponed: "تم تأجيل التوصيل",
  shipped: "تم شحن طلبك",
  delivered: "تم توصيل طلبك",
  cancelled: "تم إلغاء طلبك",
  fake: "تم الإبلاغ كطلب مزيف",
  duplicate: "تم الإبلاغ كطلب مكرر",
  returned: "تم إرجاع طلبك",
};

// Status labels in French for customer messages
const STATUS_LABELS_FR: Record<OrderStatus, string> = {
  new: "Nouveau",
  confirmed: "Votre commande a été confirmée",
  unreachable: "Nous n'avons pas pu vous joindre",
  busy: "Ligne occupée",
  postponed: "La livraison a été reportée",
  shipped: "Votre commande a été expédiée",
  delivered: "Votre commande a été livrée",
  cancelled: "Votre commande a été annulée",
  fake: "Signalement comme commande fictive",
  duplicate: "Signalement comme commande en double",
  returned: "Votre commande a été retournée",
};

/**
 * Get notification setting for a specific store and status
 */
async function getNotificationSetting(
  db: AppDb,
  storeId: string,
  status: OrderStatus
) {
  const setting = await db
    .select()
    .from(notificationSettings)
    .where(
      and(
        eq(notificationSettings.storeId, storeId),
        eq(notificationSettings.orderStatus, status)
      )
    )
    .get();

  return setting || null;
}

/**
 * Format a notification message using template or default
 */
function formatMessage(
  template: string | null,
  channel: "whatsapp" | "sms",
  data: {
    customerName: string;
    orderNumber: string;
    status: OrderStatus;
    trackingNumber?: string;
    storeName?: string;
  }
): string {
  if (template) {
    return template
      .replace(/\{\{customerName\}\}/g, data.customerName)
      .replace(/\{\{orderNumber\}\}/g, data.orderNumber)
      .replace(/\{\{status\}\}/g, STATUS_LABELS_AR[data.status] ?? data.status)
      .replace(/\{\{trackingNumber\}\}/g, data.trackingNumber ?? "")
      .replace(/\{\{storeName\}\}/g, data.storeName ?? "");
  }

  // Default templates
  const statusLabel = STATUS_LABELS_AR[data.status] ?? data.status;
  const tracking = data.trackingNumber ? `\nرقم التتبع: ${data.trackingNumber}` : "";

  if (channel === "whatsapp") {
    return `مرحباً ${data.customerName}،\n\nطلبك ${data.orderNumber} ${statusLabel}.${tracking}\n\nشكراً لثقتك بنا!`;
  }

  return `${data.customerName}، طلبك ${data.orderNumber} ${statusLabel}.${tracking}`;
}

/**
 * Send notification for order status change
 */
export async function sendStatusNotification(
  db: AppDb,
  orderId: string,
  newStatus: OrderStatus,
  storeId: string
): Promise<NotificationResult> {
  const result: NotificationResult = {};

  try {
    // 1. Get notification setting
    const setting = await getNotificationSetting(db, storeId, newStatus);
    if (!setting || !setting.enabled) {
      return result;
    }

    // 2. Get order details
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .get();

    if (!order) {
      return result;
    }

    // 3. Get customer details for phone number
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .get();

    const phone = customer?.phone ?? order.phone;
    if (!phone) {
      return result;
    }

    // 4. Format message
    const message = formatMessage(
      setting.channel === "sms" ? setting.templateSms : setting.templateWhatsapp,
      setting.channel === "sms" ? "sms" : "whatsapp",
      {
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        status: newStatus,
        trackingNumber: order.trackingNumber ?? undefined,
      }
    );

    // 5. Send via configured channel
    if (setting.channel === "whatsapp" || setting.channel === "both") {
      try {
        const waResult = await sendWhatsAppMessage(phone, message);
        result.whatsapp = waResult;
      } catch (err) {
        result.whatsapp = {
          success: false,
          error: err instanceof Error ? err.message : "WhatsApp send failed",
        };
      }
    }

    if (setting.channel === "sms" || setting.channel === "both") {
      try {
        const smsResult = await sendSmsMessage(phone, message);
        result.sms = smsResult;
      } catch (err) {
        result.sms = {
          success: false,
          error: err instanceof Error ? err.message : "SMS send failed",
        };
      }
    }
  } catch (err) {
    console.error("[NotificationService] Error sending notification:", err);
  }

  return result;
}

/**
 * Send carrier tracking notification to merchant
 */
export async function sendCarrierTrackingNotification(
  db: AppDb,
  orderId: string,
  carrierStatus: string,
  storeId: string
): Promise<void> {
  // This is a placeholder for future carrier tracking notifications
  // When carrier status changes, notify the merchant via their preferred channel
  console.log(`[NotificationService] Carrier tracking update for order ${orderId}: ${carrierStatus}`);
}
