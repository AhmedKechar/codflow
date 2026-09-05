const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function base64urlEncode(data: Uint8Array): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + padding, "base64");
}

async function hmacSign(key: string, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

async function timingSafeEqual(a: Uint8Array, b: Uint8Array): Promise<boolean> {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i]! ^ b[i]!;
  }
  return result === 0;
}

function deriveKey(apiKey: string): string {
  // Deterministic key derived from the store's API key
  // In production, use a proper KDF; this is sufficient for HMAC integrity
  return `codflow-otp-v1:${apiKey}`;
}

export interface OtpTokenPayload {
  phone: string;
  expiresAt: number;
  type: "v" | "b"; // "v" = verified, "b" = bypass
}

/**
 * Sign an OTP token (stateless, no server-side sessions).
 */
export async function signOtpToken(
  apiKey: string,
  phone: string,
  type: "v" | "b" = "v"
): Promise<string> {
  const payload: OtpTokenPayload = {
    phone,
    expiresAt: Date.now() + TOKEN_TTL_MS,
    type,
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64urlEncode(new TextEncoder().encode(payloadStr));
  const sig = await hmacSign(deriveKey(apiKey), payloadB64);
  const sigB64 = base64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify an OTP token. Returns the payload or null if invalid/expired.
 */
export async function verifyOtpToken(
  apiKey: string,
  token: string
): Promise<OtpTokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts as [string, string];
  const expectedSig = await hmacSign(deriveKey(apiKey), payloadB64);
  const actualSig = base64urlDecode(sigB64);

  const valid = await timingSafeEqual(expectedSig, actualSig);
  if (!valid) return null;

  try {
    const payloadStr = new TextDecoder().decode(base64urlDecode(payloadB64));
    const payload = JSON.parse(payloadStr) as OtpTokenPayload;

    if (Date.now() > payload.expiresAt) return null;
    if (!payload.phone || !payload.type) return null;

    return payload;
  } catch {
    return null;
  }
}
