/**
 * bearerToProps — the security-critical gatekeeper in front of every MCP
 * request. These tests nail the contract at the boundary:
 *   • missing bearer              → throws UnauthenticatedError("missing_bearer")
 *   • bad JWT / unreachable JWKS  → throws UnauthenticatedError("invalid_token")
 *   • signature mismatch          → throws UnauthenticatedError("invalid_token")
 *   • happy path                  → returns fully-shaped McpProps
 *
 * Verification is fully offline: we fetch the issuer's JWKS (for
 * reachability + cacheability) and then verify the JWT signature,
 * issuer, audience and expiry locally. `fetch` is stubbed so tests
 * never touch the network.
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { bearerToProps, extractBearer, UnauthenticatedError } from "./auth";
import type { Env } from "@/types/env";

const env = {
  BETTER_AUTH_URL: "https://app.example.com",
  WORKER_SELF_URL: "https://api.example.com",
} as unknown as Env;

const JWKS_URL = "https://app.example.com/api/auth/jwks";

let rsaKeyPair: CryptoKeyPair;
let publicKeyJwk: JsonWebKey & { kid?: string };
const TEST_KID = "test-key-2024";

beforeAll(async () => {
  rsaKeyPair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  publicKeyJwk = (await crypto.subtle.exportKey("jwk", rsaKeyPair.publicKey)) as JsonWebKey & { kid?: string };
  publicKeyJwk.kid = TEST_KID;
  publicKeyJwk.alg = "RS256";
  publicKeyJwk.use = "sig";
});

function base64url(input: object | string): string {
  const raw = typeof input === "string" ? input : JSON.stringify(input);
  return Buffer.from(raw).toString("base64url");
}

async function makeSignedToken(payload: object): Promise<string> {
  const header = base64url({ alg: "RS256", typ: "JWT", kid: TEST_KID });
  const body = base64url(payload);
  const data = new TextEncoder().encode(`${header}.${body}`);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", rsaKeyPair.privateKey, data));
  const sigB64 = Buffer.from(sig).toString("base64url");
  return `${header}.${body}.${sigB64}`;
}

function stubJwks(ok = true, keys: (JsonWebKey & { kid?: string })[] = []): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ keys }),
  }));
}

function stubJwksWithTestKey(ok = true): void {
  stubJwks(ok, [publicKeyJwk]);
}

const validPayload = {
  iss: "https://app.example.com",
  aud: "https://api.example.com",
  sub: "user-abc",
  iat: Math.floor(Date.now() / 1000) - 60,
  exp: Math.floor(Date.now() / 1000) + 3600,
  scope: "orders:read customers:read",
  role: "staff",
  name: "Fatima",
  email: "fatima@example.com",
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extractBearer", () => {
  it("returns the token when header is well-formed", () => {
    expect(extractBearer("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("is case-insensitive on the scheme (RFC 6750)", () => {
    expect(extractBearer("bearer abc")).toBe("abc");
    expect(extractBearer("BEARER abc")).toBe("abc");
  });

  it("returns undefined for missing / non-Bearer headers", () => {
    expect(extractBearer(undefined)).toBeUndefined();
    expect(extractBearer("")).toBeUndefined();
    expect(extractBearer("Basic abc")).toBeUndefined();
    expect(extractBearer("abc")).toBeUndefined();
  });
});

describe("bearerToProps", () => {
  it("throws missing_bearer when no token is supplied", async () => {
    await expect(bearerToProps(undefined, env)).rejects.toMatchObject({
      name: "UnauthenticatedError",
      code: "missing_bearer",
    });
  });

  it("throws invalid_token for a malformed JWT", async () => {
    stubJwksWithTestKey();
    await expect(bearerToProps("bad.token", env)).rejects.toMatchObject({
      name: "UnauthenticatedError",
      code: "invalid_token",
    });
  });

  it("throws invalid_token when the issuer JWKS is unreachable", async () => {
    stubJwks(false);
    const token = await makeSignedToken(validPayload);
    await expect(bearerToProps(token, env)).rejects.toMatchObject({
      name: "UnauthenticatedError",
      code: "invalid_token",
    });
  });

  it("throws invalid_token when the token is expired", async () => {
    stubJwksWithTestKey();
    const expired = {
      ...validPayload,
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600,
    };
    const token = await makeSignedToken(expired);
    await expect(bearerToProps(token, env)).rejects.toMatchObject({
      name: "UnauthenticatedError",
      code: "invalid_token",
    });
  });

  it("throws invalid_token on issuer mismatch", async () => {
    stubJwksWithTestKey();
    const wrongIssuer = { ...validPayload, iss: "https://evil.example" };
    const token = await makeSignedToken(wrongIssuer);
    await expect(bearerToProps(token, env)).rejects.toMatchObject({
      name: "UnauthenticatedError",
      code: "invalid_token",
    });
  });

  it("throws invalid_token on audience mismatch", async () => {
    stubJwksWithTestKey();
    const wrongAud = { ...validPayload, aud: "https://other.example" };
    const token = await makeSignedToken(wrongAud);
    await expect(bearerToProps(token, env)).rejects.toMatchObject({
      name: "UnauthenticatedError",
      code: "invalid_token",
    });
  });

  it("throws invalid_token on signature mismatch (tampered payload)", async () => {
    stubJwksWithTestKey();
    const tampered = { ...validPayload, sub: "attacker" };
    const token = await makeSignedToken(tampered);
    const parts = token.split(".");
    parts[1] = base64url({ sub: "attacker", iss: validPayload.iss, aud: validPayload.aud, exp: validPayload.exp, iat: validPayload.iat });
    const tamperedToken = parts.join(".");
    await expect(bearerToProps(tamperedToken, env)).rejects.toMatchObject({
      name: "UnauthenticatedError",
      code: "invalid_token",
    });
  });

  it("throws invalid_token when no matching kid in JWKS", async () => {
    const wrongKeyJwk = { ...publicKeyJwk, kid: "wrong-kid-999" } as JsonWebKey & { kid?: string };
    stubJwks(true, [wrongKeyJwk]);
    const token = await makeSignedToken(validPayload);
    await expect(bearerToProps(token, env)).rejects.toMatchObject({
      name: "UnauthenticatedError",
      code: "invalid_token",
    });
  });

  it("throws invalid_token for alg=none tokens", async () => {
    const noneToken = `${base64url({ alg: "none", typ: "JWT" })}.${base64url(validPayload)}.fake-sig`;
    stubJwksWithTestKey();
    await expect(bearerToProps(noneToken, env)).rejects.toMatchObject({
      name: "UnauthenticatedError",
      code: "invalid_token",
    });
  });

  it("fetches the issuer's JWKS for reachability", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [publicKeyJwk] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const token = await makeSignedToken(validPayload);
    await bearerToProps(token, env);
    expect(fetchMock).toHaveBeenCalledWith(JWKS_URL);
  });

  it("projects JWT claims onto McpProps (happy path, staff)", async () => {
    stubJwksWithTestKey();
    const token = await makeSignedToken(validPayload);
    const props = await bearerToProps(token, env);
    expect(props).toEqual({
      userId: "user-abc",
      role: "staff",
      scopes: ["orders:read", "customers:read"],
      name: "Fatima",
      email: "fatima@example.com",
    });
  });

  it("marks admin role correctly", async () => {
    stubJwksWithTestKey();
    const token = await makeSignedToken({ ...validPayload, sub: "admin-1", scope: "", role: "admin" });
    const props = await bearerToProps(token, env);
    expect(props.role).toBe("admin");
  });

  it("defaults non-admin role to 'staff' even when missing", async () => {
    stubJwksWithTestKey();
    const { role: _role, ...noRole } = validPayload;
    const token = await makeSignedToken(noRole);
    const props = await bearerToProps(token, env);
    expect(props.role).toBe("staff");
  });

  it("handles empty scope string", async () => {
    stubJwksWithTestKey();
    const token = await makeSignedToken({ ...validPayload, scope: "", role: "staff" });
    const props = await bearerToProps(token, env);
    expect(props.scopes).toEqual([]);
  });

  it("handles array scope claim (future-proofing)", async () => {
    stubJwksWithTestKey();
    const token = await makeSignedToken({ ...validPayload, scope: ["orders:read", "customers:read"] });
    const props = await bearerToProps(token, env);
    expect(props.scopes).toEqual(["orders:read", "customers:read"]);
  });

  it("coerces missing name/email to empty strings (never undefined)", async () => {
    stubJwksWithTestKey();
    const { name: _name, email: _email, ...minimal } = validPayload;
    const token = await makeSignedToken(minimal);
    const props = await bearerToProps(token, env);
    expect(props.name).toBe("");
    expect(props.email).toBe("");
  });

  it("accepts the /mcp audience variant (RFC 8707 resource forms)", async () => {
    stubJwksWithTestKey();
    const token = await makeSignedToken({ ...validPayload, aud: "https://api.example.com/mcp" });
    const props = await bearerToProps(token, env);
    expect(props.userId).toBe("user-abc");
  });

  it("accepts the trailing-slash audience variant", async () => {
    stubJwksWithTestKey();
    const token = await makeSignedToken({ ...validPayload, aud: "https://api.example.com/" });
    const props = await bearerToProps(token, env);
    expect(props.userId).toBe("user-abc");
  });
});
