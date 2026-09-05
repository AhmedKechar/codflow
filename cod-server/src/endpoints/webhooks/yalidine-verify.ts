/**
 * Yalidine Webhook Signature Verification
 *
 * Verifies incoming Yalidine webhooks using HMAC-SHA256.
 * Header: X-YALIDINE-SIGNATURE
 * Algorithm: HMAC-SHA256(raw_request_body, webhook_secret_key)
 */

export async function verifyYalidineSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  if (!signatureHeader) {
    return { valid: false, error: "Missing X-YALIDINE-SIGNATURE header" };
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(rawBody)
    );

    const computedHex = [...new Uint8Array(sigBuffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison to prevent timing attacks
    if (computedHex.length !== signatureHeader.length) {
      return { valid: false, error: "Invalid signature" };
    }

    let mismatch = 0;
    for (let i = 0; i < computedHex.length; i++) {
      mismatch |= computedHex.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
    }

    if (mismatch !== 0) {
      return { valid: false, error: "Invalid signature" };
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: `Signature verification failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}
