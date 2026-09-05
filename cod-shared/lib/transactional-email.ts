import { createSendiliClient, SendiliError } from "./sendili";
import type { AppDb } from "../db/client";
import { getEmailConfigRaw } from "../queries/email-config";

export interface SendEmailResult {
  sent: boolean;
  error?: string | null;
  id?: string;
}

/**
 * Single send path for all transactional email.
 *
 * Key contracts:
 * - **Never throws** — every failure returns `{ sent: false, error: <code> }`
 * - **Never leaks** — provider message text is dropped
 * - **Silent skip** — no config row or `enabled=false` means `{ sent: false, error: null }`
 * - **Idempotency** — conflict errors reported as `{ sent: true }` (original already happened)
 */
export async function sendTransactionalEmail(
  db: AppDb,
  storeId: string,
  options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    fromName?: string;
    replyTo?: string;
    idempotencyKey?: string;
  }
): Promise<SendEmailResult> {
  const config = await getEmailConfigRaw(db, storeId);

  // Feature not configured or disabled — silent skip
  if (!config || !config.enabled) {
    return { sent: false, error: null };
  }

  try {
    const client = createSendiliClient(config.apiKey);
    const result = await client.send({
      to: options.to,
      subject: options.subject,
      html: options.html,
      from: options.from ?? config.fromEmail,
      fromName: options.fromName ?? config.fromName ?? undefined,
      replyTo: options.replyTo,
      category: "transactional",
      idempotencyKey: options.idempotencyKey,
    });

    return { sent: true, id: result.id };
  } catch (err) {
    if (err instanceof SendiliError) {
      // Idempotency conflict = original already sent = success
      if (err.code === "IDEMPOTENCY_CONFLICT") {
        return { sent: true };
      }
      return { sent: false, error: err.code };
    }
    return { sent: false, error: "UNKNOWN" };
  }
}
