export interface SmsSendOptions {
  senderId?: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("213")) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("0")) {
    return `+213${cleaned.slice(1)}`;
  }

  return `+213${cleaned}`;
}

export function getMessageTemplate(
  type: "order_update" | "marketing" | "support" | "automated",
  data: Record<string, string>,
): string {
  const templates: Record<string, string> = {
    order_update: `Bonjour ${data.customerName || "Client"},\nVotre commande ${data.orderNumber || ""} a été mise à jour: ${data.status || "En cours"}.\nMerci!`,
    marketing: `${data.message || "Découvrez nos nouveautés!"} ${data.storeName || ""}`,
    support: `${data.message || "Bonjour, comment pouvons-nous vous aider?"}`,
    automated: `Bonjour ${data.customerName || "Client"},\n${data.message || "Ceci est un message automatique."}`,
  };

  return templates[type] || templates.automated;
}

export async function sendSmsMessage(
  phone: string,
  message: string,
  options?: SmsSendOptions,
): Promise<SmsSendResult> {
  const formattedPhone = formatPhoneNumber(phone);

  // TODO: Replace with actual SMS provider integration (e.g., Twilio, Vonage, Africa's Talking)
  console.log(`[SMS] Sending to ${formattedPhone}: ${message.substring(0, 50)}...`);

  // Mock implementation - simulate API call
  const messageId = `sms_${crypto.randomUUID().slice(0, 12)}`;

  return {
    success: true,
    messageId,
  };
}
