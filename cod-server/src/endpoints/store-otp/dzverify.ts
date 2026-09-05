const DZVERIFY_BASE_URL = "https://api.dzverify.com";

export interface DzverifySendOptions {
  phone: string;
  language?: string;
}

export interface DzverifySendResult {
  requestId: string;
  expiresAt: number;
  maxAttempts: number;
}

export interface DzverifyVerifyResult {
  verified: boolean;
  attemptsRemaining?: number;
  reason?: string;
}

export interface DzverifyQuota {
  balance: number;
  plan: string;
}

export class DzverifyError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;
  isOutOfCredits: boolean;
  isTransient: boolean;

  constructor(opts: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
  }) {
    super(opts.message);
    this.name = "DzverifyError";
    this.code = opts.code;
    this.statusCode = opts.statusCode;
    this.details = opts.details;
    this.isOutOfCredits = opts.code === "OUT_OF_CREDITS";
    this.isTransient = opts.statusCode >= 500 || opts.code === "NETWORK_ERROR";
  }
}

const DZVERIFY_ERRORS = {
  UNAUTHORIZED: "UNAUTHORIZED",
  OUT_OF_CREDITS: "OUT_OF_CREDITS",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION: "VALIDATION",
  TRANSIENT: "TRANSIENT",
} as const;

function mapStatusToCode(status: number): string {
  if (status === 401) return DZVERIFY_ERRORS.UNAUTHORIZED;
  if (status === 402) return DZVERIFY_ERRORS.OUT_OF_CREDITS;
  if (status === 403) return DZVERIFY_ERRORS.FORBIDDEN;
  if (status === 404) return DZVERIFY_ERRORS.NOT_FOUND;
  if (status === 429) return DZVERIFY_ERRORS.RATE_LIMITED;
  if (status >= 500) return DZVERIFY_ERRORS.TRANSIENT;
  return DZVERIFY_ERRORS.VALIDATION;
}

export function createDzverifyClient(apiKey: string) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  async function sendOtp(
    options: DzverifySendOptions
  ): Promise<DzverifySendResult> {
    const res = await fetch(`${DZVERIFY_BASE_URL}/v1/otp/send`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        phone: options.phone,
        language: options.language ?? "ar",
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new DzverifyError({
        message: (body.message as string) ?? `DZVerify send failed (${res.status})`,
        code: mapStatusToCode(res.status),
        statusCode: res.status,
        details: body,
      });
    }

    const data = (await res.json()) as Record<string, unknown>;
    return {
      requestId: (data.request_id as string) ?? (data.requestId as string),
      expiresAt: (data.expires_at as number) ?? (data.expiresAt as number) ?? Date.now() + 300_000,
      maxAttempts: (data.max_attempts as number) ?? (data.maxAttempts as number) ?? 5,
    };
  }

  async function verifyOtp(
    phone: string,
    requestId: string,
    code: string
  ): Promise<DzverifyVerifyResult> {
    const res = await fetch(`${DZVERIFY_BASE_URL}/v1/otp/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone, request_id: requestId, code }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (res.status === 400 && body.code === "WRONG_CODE") {
        return {
          verified: false,
          attemptsRemaining: (body.attempts_remaining as number) ?? 0,
          reason: "wrong_code",
        };
      }

      throw new DzverifyError({
        message: (body.message as string) ?? `DZVerify verify failed (${res.status})`,
        code: mapStatusToCode(res.status),
        statusCode: res.status,
        details: body,
      });
    }

    const data = (await res.json()) as Record<string, unknown>;
    return { verified: true };
  }

  async function getQuota(): Promise<DzverifyQuota> {
    const res = await fetch(`${DZVERIFY_BASE_URL}/v1/account/quota`, {
      headers,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new DzverifyError({
        message: (body.message as string) ?? `DZVerify quota failed (${res.status})`,
        code: mapStatusToCode(res.status),
        statusCode: res.status,
        details: body,
      });
    }

    const data = (await res.json()) as Record<string, unknown>;
    return {
      balance: (data.balance as number) ?? 0,
      plan: (data.plan as string) ?? "unknown",
    };
  }

  return { sendOtp, verifyOtp, getQuota };
}
