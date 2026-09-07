import { Context, Next } from "hono";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function lazyCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}

export function rateLimit(opts: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  message?: string;
}) {
  const { windowMs, max, keyPrefix = "rl", message = "Too many requests" } = opts;

  return async (c: Context, next: Next) => {
    lazyCleanup();

    const ip =
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const path = new URL(c.req.url).pathname;
    const key = `${keyPrefix}:${ip}:${path}`;
    const now = Date.now();

    let entry = buckets.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count++;

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      return c.json({ success: false, error: message }, 429);
    }

    await next();
  };
}

export const storeRateLimit = rateLimit({
  windowMs: 60_000,
  max: 100,
  keyPrefix: "store",
  message: "طلبات كثيرة جداً. يرجى المحاولة لاحقاً.",
});

export const webhookRateLimit = rateLimit({
  windowMs: 60_000,
  max: 200,
  keyPrefix: "webhook",
  message: "Webhook rate limit exceeded",
});

export const authRateLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyPrefix: "auth",
  message: "طلبات مصادقة كثيرة جداً.",
});
