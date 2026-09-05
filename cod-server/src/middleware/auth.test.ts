import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authMiddleware } from "./auth";
import type { Env } from "@/types/env";

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "@/db";

function mockCtx(headers: Record<string, string> = {}) {
  const store: Record<string, unknown> = {};
  return {
    req: { header: (name: string) => headers[name] },
    env: { DB: {} } as Env,
    json: vi.fn().mockReturnValue(new Response(null, { status: 401 })),
    get: (key: string) => store[key],
    set: (key: string, val: unknown) => { store[key] = val; },
    _store: store,
  } as any;
}

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "user_1",
    apiKey: "key_abc123",
    status: "active",
    role: "staff",
    name: "Test User",
    email: "test@example.com",
    ...overrides,
  };
}

function mockDbChain() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: vi.fn(),
    then: vi.fn(),
  };
  vi.mocked(getDb).mockReturnValue(chain as any);
  return chain;
}

function mockDbWithUser(user: Record<string, unknown>, scopes: { scope: string }[] = []) {
  let callCount = 0;
  vi.mocked(getDb).mockReturnValue({
    select: vi.fn().mockImplementation(() => {
      callCount++;
      return {
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            get: vi.fn().mockReturnValue(user),
            then: vi.fn().mockImplementation((resolve: any) => resolve(scopes)),
          })),
        })),
      };
    }),
  } as any);
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authMiddleware", () => {
  it("returns 401 when X-API-Key header is missing", async () => {
    const c = mockCtx({});
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "MISSING_API_KEY" }),
      401,
    );
  });

  it("returns 401 when API key is not found in DB", async () => {
    mockDbChain().get.mockReturnValue(undefined);
    const c = mockCtx({ "X-API-Key": "invalid_key" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "INVALID_API_KEY" }),
      401,
    );
  });

  it("returns 403 when user account is inactive", async () => {
    mockDbChain().get.mockReturnValue(userRow({ status: "inactive" }));
    const c = mockCtx({ "X-API-Key": "key_abc123" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "USER_INACTIVE" }),
      403,
    );
  });

  it("loads wildcard scopes for admin users", async () => {
    mockDbChain().get.mockReturnValue(userRow({ role: "admin" }));
    const c = mockCtx({ "X-API-Key": "key_abc123" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("user")).toMatchObject({ scopes: ["*"] });
  });

  it("loads wildcard scopes for super_admin users", async () => {
    mockDbChain().get.mockReturnValue(userRow({ role: "super_admin" }));
    const c = mockCtx({ "X-API-Key": "key_abc123" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("user")).toMatchObject({ scopes: ["*"] });
  });

  it("loads specific scopes from DB for staff users", async () => {
    mockDbWithUser(userRow(), [{ scope: "orders:read" }, { scope: "orders:write" }]);
    const c = mockCtx({ "X-API-Key": "key_abc123" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("user")).toMatchObject({ scopes: ["orders:read", "orders:write"] });
  });

  it("sets storeId when X-Store-Id header matches admin role", async () => {
    mockDbWithUser(userRow({ role: "admin" }));
    const c = mockCtx({ "X-API-Key": "key_abc123", "X-Store-Id": "store_1" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("storeId")).toBe("store_1");
  });

  it("returns 403 when non-admin user has no membership for store", async () => {
    let userFound = false;
    vi.mocked(getDb).mockReturnValue({
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            get: vi.fn().mockImplementation(() => {
              if (!userFound) {
                userFound = true;
                return userRow({ role: "staff" });
              }
              return null;
            }),
            then: vi.fn().mockImplementation((resolve: any) => resolve([])),
          })),
        })),
      })),
    } as any);
    const c = mockCtx({ "X-API-Key": "key_abc123", "X-Store-Id": "store_1" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "FORBIDDEN" }),
      403,
    );
  });

  it("allows admin access to any store without explicit membership", async () => {
    mockDbWithUser(userRow({ role: "admin" }));
    const c = mockCtx({ "X-API-Key": "key_abc123", "X-Store-Id": "store_999" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("storeId")).toBe("store_999");
  });

  it("returns 500 on unexpected DB errors", async () => {
    vi.mocked(getDb).mockImplementation(() => { throw new Error("DB connection failed"); });
    const c = mockCtx({ "X-API-Key": "key_abc123" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "AUTHENTICATION_FAILED" }),
      500,
    );
  });

  it("calls next() on successful auth without storeId header", async () => {
    mockDbWithUser(userRow());
    const c = mockCtx({ "X-API-Key": "key_abc123" });
    const next = vi.fn();
    await authMiddleware(c, next);
    expect(next).toHaveBeenCalled();
    expect(c.get("user")).toMatchObject({
      id: "user_1",
      role: "staff",
      scopes: [],
    });
  });
});
