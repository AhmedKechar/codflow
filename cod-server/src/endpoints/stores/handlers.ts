import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import * as queries from "./queries";
import { updateStoreSchema } from "./validation";
import { NotFoundError, SystemError, BusinessLogicError } from "@/lib/errors/classes";
import { getPixelConfig as queryPixelConfig, upsertPixelConfig } from "../../../../cod-shared/queries/pixel-config";
import { getOtpConfig as queryOtpConfig, getOtpConfigRaw, upsertOtpConfig } from "../../../../cod-shared/queries/otp-config";
import { getEmailConfig as queryEmailConfig, getEmailConfigRaw, upsertEmailConfig } from "../../../../cod-shared/queries/email-config";
import { createDzverifyClient } from "../store-otp/dzverify";
import { createSendiliClient } from "../../../../cod-shared/lib/sendili";
import { ERROR_CODES } from "../../../../cod-shared/errors/codes";
import { z } from "zod";

export async function getMyStore(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);
  
  if (!store) {
    throw new NotFoundError("Store");
  }
  
  return c.json({ success: true, data: store }, 200);
}

export async function updateMyStore(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);

  if (!store) {
    throw new NotFoundError("Store");
  }

  const jsonBody: any = (c.req as any).valid?.("json");
  const validated = jsonBody ?? updateStoreSchema.parse(await c.req.json());
  const updated = await queries.updateStore(db, storeId, validated);
  if (!updated) {
    throw new SystemError("Failed to update store");
  }
  return c.json({ success: true, data: updated }, 200);
}

const pixelConfigSchema = z.object({
  pixelId: z.string().min(1),
  accessToken: z.string().default(""),
  testEventCode: z.string().optional().nullable(),
  enabled: z.boolean().optional(),
});

export async function getPixelConfig(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);
  if (!store) throw new NotFoundError("Store");
  const config = await queryPixelConfig(db, storeId);
  return c.json({ success: true, data: config ?? null }, 200);
}

export async function savePixelConfig(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);
  if (!store) throw new NotFoundError("Store");
  const jsonBody: any = (c.req as any).valid?.("json");
  const validated = jsonBody ?? pixelConfigSchema.parse(await c.req.json());
  const result = await upsertPixelConfig(db, storeId, validated);
  if (!result) {
    throw new SystemError("Failed to save pixel config");
  }
  return c.json({ success: true, data: result }, 200);
}

// ─── OTP Config Handlers ────────────────────────────────────────────────────

function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 10) return "****";
  return `${key.slice(0, 6)}${"*".repeat(12)}${key.slice(-4)}`;
}

export async function getOtpConfig(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);
  if (!store) throw new NotFoundError("Store");
  const config = await queryOtpConfig(db, storeId);
  if (!config) return c.json({ success: true, data: null }, 200);
  const rawConfig = await getOtpConfigRaw(db, storeId);
  return c.json({
    success: true,
    data: {
      language: config.language,
      enabled: config.enabled,
      apiKeyMasked: maskApiKey(rawConfig?.apiKey ?? null),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    },
  }, 200);
}

const saveOtpConfigSchema = z.object({
  apiKey: z.string().optional(),
  language: z.enum(["ar", "fr", "en"]).optional(),
  enabled: z.boolean().optional(),
});

export async function saveOtpConfig(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);
  if (!store) throw new NotFoundError("Store");
  const jsonBody: any = (c.req as any).valid?.("json");
  const validated = jsonBody ?? saveOtpConfigSchema.parse(await c.req.json());
  const result = await upsertOtpConfig(db, storeId, validated);
  if (!result) {
    throw new SystemError("Failed to save OTP config");
  }
  const rawConfig = await getOtpConfigRaw(db, storeId);
  return c.json({
    success: true,
    data: {
      language: result.language,
      enabled: result.enabled,
      apiKeyMasked: maskApiKey(rawConfig?.apiKey ?? null),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    },
  }, 200);
}

export async function testOtpConnection(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);
  if (!store) throw new NotFoundError("Store");

  const body = (c.req as any).valid?.("json") ?? {};
  const bodyApiKey = body?.apiKey as string | undefined;

  const config = await getOtpConfigRaw(db, storeId);
  const apiKey = bodyApiKey || config?.apiKey || "";

  if (!apiKey) {
    return c.json({ ok: false, reason: "missing_key" }, 200);
  }

  try {
    const client = createDzverifyClient(apiKey);
    const quota = await client.getQuota();

    if (quota.balance <= 0) {
      return c.json(
        {
          ok: false,
          reason: "out_of_credits",
          message: "DZVerify account has no credits",
          outOfCredits: true,
        },
        200
      );
    }

    return c.json(
      {
        ok: true,
        message: `Connection successful. Plan: ${quota.plan}. Credits remaining: ${quota.balance} DA.`,
        balanceDa: quota.balance,
        plan: quota.plan,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    return c.json({ ok: false, reason: "connection_failed", message }, 200);
  }
}

// ─── Email Config Handlers ──────────────────────────────────────────────────

const emailConfigResponseSchema = z.object({
  language: z.string(),
  enabled: z.boolean(),
  apiKeyMasked: z.string().nullable(),
  fromEmail: z.string(),
  fromName: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export async function getEmailConfig(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);
  if (!store) throw new NotFoundError("Store");
  const config = await queryEmailConfig(db, storeId);
  if (!config) return c.json({ success: true, data: null }, 200);
  const rawConfig = await getEmailConfigRaw(db, storeId);
  return c.json({
    success: true,
    data: {
      language: "ar",
      enabled: config.enabled,
      apiKeyMasked: rawConfig ? maskApiKey(rawConfig.apiKey) : null,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    },
  }, 200);
}

const saveEmailConfigSchema = z.object({
  apiKey: z.string().optional(),
  fromEmail: z.string().email().optional(),
  fromName: z.string().optional(),
  enabled: z.boolean().optional(),
});

export async function saveEmailConfig(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);
  if (!store) throw new NotFoundError("Store");
  const jsonBody: any = (c.req as any).valid?.("json");
  const validated = jsonBody ?? saveEmailConfigSchema.parse(await c.req.json());
  const result = await upsertEmailConfig(db, storeId, validated);
  if (!result) {
    throw new SystemError("Failed to save email config");
  }
  const rawConfig = await getEmailConfigRaw(db, storeId);
  return c.json({
    success: true,
    data: {
      language: "ar",
      enabled: result.enabled,
      apiKeyMasked: rawConfig ? maskApiKey(rawConfig.apiKey) : null,
      fromEmail: result.fromEmail,
      fromName: result.fromName,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    },
  }, 200);
}

export async function testEmailConnection(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const store = await queries.getStore(db, storeId);
  if (!store) throw new NotFoundError("Store");

  const body = (c.req as any).valid?.("json") ?? {};
  const bodyApiKey = body?.apiKey as string | undefined;

  const config = await getEmailConfigRaw(db, storeId);
  const apiKey = bodyApiKey || config?.apiKey || "";

  if (!apiKey) {
    return c.json({ ok: false, reason: "missing_key", verifiedDomains: [] }, 200);
  }

  try {
    const client = createSendiliClient(apiKey);
    const account = await client.getAccount();

    return c.json(
      {
        ok: true,
        message: `Connection successful. Credits remaining: ${account.credits}.`,
        credits: account.credits,
        verifiedDomains: account.verifiedDomains,
      },
      200
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    return c.json({ ok: false, reason: "connection_failed", message, verifiedDomains: [] }, 200);
  }
}
