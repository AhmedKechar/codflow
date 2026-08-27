/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;

  WORKER_URL: string;
  NEXT_PUBLIC_WORKER_URL: string;

  NEXT_PUBLIC_APP_URL: string;

  // Set via: wrangler secret put BETTER_AUTH_SECRET
  BETTER_AUTH_SECRET: string;

  SEND_EMAIL: SendEmail;

  RATE_LIMIT_KV: KVNamespace;
}
