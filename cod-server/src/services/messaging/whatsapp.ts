export interface WhatsAppSendOptions {
  templateName?: string;
  templateLanguage?: string;
  variables?: string[];
}

export interface WhatsAppSendResult {
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
    order_update: `Bonjour ${data.customerName || "Client"},\n\nVotre commande ${data.orderNumber || ""} a été mise à jour.\nStatut: ${data.status || "En cours"}\n\nMerci pour votre confiance!`,
    marketing: `${data.message || "Découvrez nos nouveautés!"}\n\n${data.storeName || ""}`,
    support: `${data.message || "Bonjour, comment pouvons-nous vous aider?"}`,
    automated: `Bonjour ${data.customerName || "Client"},\n\n${data.message || "Ceci est un message automatique."}`,
  };

  return templates[type] || templates.automated;
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  options?: WhatsAppSendOptions,
): Promise<WhatsAppSendResult> {
  const formattedPhone = formatPhoneNumber(phone);

  // TODO: Replace with actual WhatsApp Business API integration
  // https://developers.facebook.com/docs/whatsapp/cloud-api
  console.log(`[WhatsApp] Sending to ${formattedPhone}: ${message.substring(0, 50)}...`);

  // Mock implementation - simulate API call
  const messageId = `wam_${crypto.randomUUID().slice(0, 12)}`;

  return {
    success: true,
    messageId,
  };
}
