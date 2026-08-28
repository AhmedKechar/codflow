/**
 * Authentication Middleware
 *
 * Validates API keys, loads user scopes for RBAC,
 * and extracts storeId from X-Store-Id header for multi-tenant isolation.
 */

import { Context, Next } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import { users, userScopes, storeMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ERROR_CODES } from "../../../cod-shared/errors/codes";

export async function authMiddleware(c: Context<AppContext>, next: Next) {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    return c.json({ 
      error: "Missing API key",
      code: ERROR_CODES.MISSING_API_KEY,
      category: "AUTHENTICATION"
    }, 401);
  }

  try {
    const db = getDb(c.env.DB);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.apiKey, apiKey))
      .get();

    if (!user) {
      return c.json({ 
        error: "Invalid API key",
        code: ERROR_CODES.INVALID_API_KEY,
        category: "AUTHENTICATION"
      }, 401);
    }

    if (user.status !== "active") {
      return c.json({ 
        error: "User account is inactive",
        code: ERROR_CODES.USER_INACTIVE,
        category: "AUTHENTICATION"
      }, 403);
    }

    let scopes: string[];

    if (user.role === "admin" || user.role === "super_admin") {
      scopes = ["*"];
    } else {
      try {
        const rows = await db
          .select({ scope: userScopes.scope })
          .from(userScopes)
          .where(eq(userScopes.userId, user.id));
        scopes = rows.map((r) => r.scope);
      } catch (err) {
        console.error("[auth] Failed to load scopes for user", user.id, err);
        return c.json({ 
          error: "Authentication failed",
          code: ERROR_CODES.AUTHENTICATION_FAILED,
          category: "AUTHENTICATION"
        }, 401);
      }
    }

    c.set("user", { ...user, scopes });

    // ─── Multi-tenant: Extract storeId from X-Store-Id header ────────────────
    const storeIdHeader = c.req.header("X-Store-Id");
    if (storeIdHeader) {
      // Verify user has access to this store
      const membership = await db
        .select()
        .from(storeMembers)
        .where(
          and(
            eq(storeMembers.userId, user.id),
            eq(storeMembers.storeId, storeIdHeader),
            eq(storeMembers.status, "active")
          )
        )
        .get();

      // Admin and super_admin users can access any store even without membership
      const isAdmin = user.role === "admin" || user.role === "super_admin";

      if (membership || isAdmin) {
        c.set("storeId", storeIdHeader);
      } else {
        // Non-admin users must have explicit store membership
        return c.json({
          error: "User does not have access to this store",
          code: ERROR_CODES.FORBIDDEN,
          category: "AUTHORIZATION"
        }, 403);
      }
    }

    await next();
  } catch (err) {
    console.error("[auth] Middleware error:", err);
    return c.json({ 
      error: "Authentication failed",
      code: ERROR_CODES.AUTHENTICATION_FAILED,
      category: "AUTHENTICATION"
    }, 500);
  }
}
