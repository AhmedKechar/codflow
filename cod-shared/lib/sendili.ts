const SENDILI_BASE_URL = "https://api.sendili.com";

export interface SendiliSendOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  category?: string;
  idempotencyKey?: string;
}

export interface SendiliSendResult {
  id: string;
  status: string;
}

export interface SendiliAccount {
  email: string;
  credits: number;
  verifiedDomains: string[];
}

export class SendiliError extends Error {
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
    this.name = "SendiliError";
    this.code = opts.code;
    this.statusCode = opts.statusCode;
    this.details = opts.details;
    this.isOutOfCredits = opts.code === "OUT_OF_CREDITS";
    this.isTransient = opts.statusCode >= 500 || opts.code === "NETWORK_ERROR";
  }
}

const SENDILI_ERRORS = {
  UNAUTHORIZED: "UNAUTHORIZED",
  OUT_OF_CREDITS: "OUT_OF_CREDITS",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION: "VALIDATION",
  TRANSIENT: "TRANSIENT",
} as const;

function mapStatusToCode(status: number): string {
  if (status === 401) return SENDILI_ERRORS.UNAUTHORIZED;
  if (status === 402) return SENDILI_ERRORS.OUT_OF_CREDITS;
  if (status === 403) return SENDILI_ERRORS.FORBIDDEN;
  if (status === 404) return SENDILI_ERRORS.NOT_FOUND;
  if (status === 429) return SENDILI_ERRORS.RATE_LIMITED;
  if (status >= 500) return SENDILI_ERRORS.TRANSIENT;
  return SENDILI_ERRORS.VALIDATION;
}

function extractVerifiedDomains(data: Record<string, unknown>): string[] {
  const raw = data.verified_domains ?? data.verifiedDomains ?? data.domains;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => {
      if (typeof d === "string") return d;
      if (d && typeof d === "object" && "domain" in d) return (d as { domain: string }).domain;
      return null;
    })
    .filter((d): d is string => typeof d === "string" && d.length > 0);
}

export function createSendiliClient(apiKey: string) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  async function send(
    options: SendiliSendOptions
  ): Promise<SendiliSendResult> {
    const body: Record<string, unknown> = {
      to: options.to,
      subject: options.subject,
      html: options.html,
      from: options.from,
      category: options.category ?? "transactional",
    };
    if (options.fromName) body.from_name = options.fromName;
    if (options.replyTo) body.reply_to = options.replyTo;
    if (options.idempotencyKey) body.idempotency_key = options.idempotencyKey;

    const res = await fetch(`${SENDILI_BASE_URL}/v1/emails`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new SendiliError({
        message: (errBody.message as string) ?? `Sendili send failed (${res.status})`,
        code: mapStatusToCode(res.status),
        statusCode: res.status,
        details: errBody,
      });
    }

    const data = (await res.json()) as Record<string, unknown>;
    return {
      id: (data.id as string) ?? "",
      status: (data.status as string) ?? "queued",
    };
  }

  async function getAccount(): Promise<SendiliAccount> {
    const res = await fetch(`${SENDILI_BASE_URL}/v1/account`, {
      headers,
    });

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new SendiliError({
        message: (errBody.message as string) ?? `Sendili account fetch failed (${res.status})`,
        code: mapStatusToCode(res.status),
        statusCode: res.status,
        details: errBody,
      });
    }

    const data = (await res.json()) as Record<string, unknown>;
    return {
      email: (data.email as string) ?? "",
      credits: (data.credits as number) ?? 0,
      verifiedDomains: extractVerifiedDomains(data),
    };
  }

  return { send, getAccount };
}
