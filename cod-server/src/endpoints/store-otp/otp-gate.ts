import type { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { getOtpConfigRaw } from "../../../../cod-shared/queries/otp-config";
import { verifyOtpToken } from "./token";
import { normalizeAlgerianPhone } from "./phone";
import { BusinessLogicError } from "@/lib/errors/classes";
import { ERROR_CODES } from "../../../../cod-shared/errors/codes";

/**
 * Enforce OTP verification on order creation.
 * If OTP is disabled, this is a no-op.
 * If OTP is enabled but no token provided → throw OTP_VERIFICATION_REQUIRED.
 * If token is invalid/expired → throw OTP_TOKEN_INVALID.
 * If phone mismatch → throw OTP_PHONE_MISMATCH.
 */
export async function assertOtpVerification(
  c: Context<AppContext>,
  storeId: string,
  data: { phone?: string; otpToken?: string }
): Promise<void> {
  const db = getDb(c.env.DB);
  const config = await getOtpConfigRaw(db, storeId);

  // Feature disabled → no-op
  if (!config || !config.enabled) return;

  // Feature enabled but no token → block
  if (!data.otpToken) {
    throw new BusinessLogicError(
      "WhatsApp phone verification is required",
      ERROR_CODES.OTP_VERIFICATION_REQUIRED
    );
  }

  // Verify the token
  const payload = await verifyOtpToken(config.apiKey, data.otpToken);
  if (!payload) {
    throw new BusinessLogicError(
      "Verification token is invalid or expired",
      ERROR_CODES.OTP_TOKEN_INVALID
    );
  }

  // Bypass token (fail-open) → accept silently
  if (payload.type === "b") {
    console.info(`[otp] bypass token accepted for store=${storeId}`);
    return;
  }

  // Verified token → check phone match
  const orderPhone = normalizeAlgerianPhone(data.phone ?? "");
  const tokenPhone = normalizeAlgerianPhone(payload.phone);

  if (!orderPhone || !tokenPhone || orderPhone !== tokenPhone) {
    throw new BusinessLogicError(
      "Phone number does not match the verified number",
      ERROR_CODES.OTP_PHONE_MISMATCH
    );
  }
}
