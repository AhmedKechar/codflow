import { Context, Next } from "hono";

export async function performanceTiming(c: Context, next: Next) {
  const start = performance.now();
  await next();
  const duration = performance.now() - start;

  c.header("X-Response-Time", `${duration.toFixed(1)}ms`);

  if (duration > 1000) {
    console.warn(`[perf] slow request: ${c.req.method} ${new URL(c.req.url).pathname} ${duration.toFixed(0)}ms`);
  }
}
