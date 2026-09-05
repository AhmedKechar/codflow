import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { getOtpConfigRaw } from "../../../../cod-shared/queries/otp-config";
import { createDzverifyClient, DzverifyError } from "./dzverify";
import { normalizeAlgerianPhone } from "./phone";
import { signOtpToken } from "./token";
import { createOtpSendGuards, recordOtpSend } from "./guards";
import { BusinessLogicError } from "@/lib/errors/classes";
import { ERROR_CODES } from "../../../../cod-shared/errors/codes";

const guards = createOtpSendGuards();

/**
 * POST /store/otp/send
 * Sends a WhatsApp OTP code to the customer's phone.
 */
export async function sendOtp(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const body = await c.req.json();
  const { phone: rawPhone } = body as { phone?: string };

  if (!rawPhone) {
    throw new BusinessLogicError("Phone is required", ERROR_CODES.REQUIRED_FIELD_MISSING);
  }

  const phone = normalizeAlgerianPhone(rawPhone);
  if (!phone) {
    throw new BusinessLogicError("Invalid phone number", ERROR_CODES.INVALID_PHONE_FORMAT);
  }

  // Load OTP config
  const config = await getOtpConfigRaw(db, storeId);
  if (!config || !config.enabled) {
    // Fail-open: OTP not enabled — mint a bypass token
    const bypassToken = await signOtpToken("bypass", phone, "b");
    return c.json({
      status: "unavailable",
      reason: "not_enabled",
      bypassToken,
    }, 200);
  }

  // Rate limiting guards
  const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "unknown";
  const guardResult = await guards.check(c.env.RATE_LIMIT_KV, storeId, phone, ip);
  if (!guardResult.allowed) {
    if (guardResult.reason === "cooldown") {
      throw new BusinessLogicError(
        `Please wait ${guardResult.retryAfterSeconds}s before requesting a new code`,
        ERROR_CODES.OTP_RATE_LIMITED
      );
    }
    throw new BusinessLogicError("Too many requests", ERROR_CODES.OTP_RATE_LIMITED);
  }

  // Call DZVerify
  const client = createDzverifyClient(config.apiKey);
  try {
    const result = await client.sendOtp({
      phone,
      language: config.language,
    });

    // Record the send for rate limiting (fire-and-forget)
    await recordOtpSend(c.env.RATE_LIMIT_KV, storeId, phone, ip);

    return c.json({
      status: "sent",
      requestId: result.requestId,
      expiresAt: result.expiresAt,
      maxAttempts: result.maxAttempts,
    }, 200);
  } catch (err) {
    if (err instanceof DzverifyError) {
      if (err.isOutOfCredits || err.isTransient) {
        // Fail-open: mint bypass token
        const bypassToken = await signOtpToken(config.apiKey, phone, "b");
        return c.json({
          status: "unavailable",
          reason: err.isOutOfCredits ? "out_of_credits" : "provider_error",
          bypassToken,
        }, 200);
      }
    }
    throw err;
  }
}

/**
 * POST /store/otp/verify
 * Verifies the OTP code entered by the customer.
 */
export async function verifyOtp(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const body = await c.req.json();
  const { phone: rawPhone, requestId, code } = body as {
    phone?: string;
    requestId?: string;
    code?: string;
  };

  if (!rawPhone || !requestId || !code) {
    throw new BusinessLogicError(
      "Phone, requestId, and code are required",
      ERROR_CODES.REQUIRED_FIELD_MISSING
    );
  }

  const phone = normalizeAlgerianPhone(rawPhone);
  if (!phone) {
    throw new BusinessLogicError("Invalid phone number", ERROR_CODES.INVALID_PHONE_FORMAT);
  }

  // Load OTP config
  const config = await getOtpConfigRaw(db, storeId);
  if (!config || !config.enabled) {
    throw new BusinessLogicError("OTP verification is not enabled", ERROR_CODES.OTP_NOT_ENABLED);
  }

  // Verify via DZVerify
  const client = createDzverifyClient(config.apiKey);
  try {
    const result = await client.verifyOtp(phone, requestId, code);

    if (!result.verified) {
      return c.json({
        status: "wrong_code",
        attemptsRemaining: result.attemptsRemaining ?? 0,
      }, 200);
    }

    // Mint a verified token
    const otpToken = await signOtpToken(config.apiKey, phone, "v");
    return c.json({
      status: "verified",
      otpToken,
    }, 200);
  } catch (err) {
    if (err instanceof DzverifyError) {
      if (err.isTransient) {
        return c.json({
          status: "error",
          reason: "provider_error",
        }, 200);
      }
    }
    throw err;
  }
}
