import { Context } from "hono";
import type { AppContext } from "@/types";
import { getDb } from "@/db";
import * as queries from "../../../../cod-shared/queries/ai-credits";

export async function getBalance(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const data = await queries.getAiCredits(db, storeId);
  if (!data) {
    return c.json({ success: true, data: { totalCredits: 0, usedCredits: 0, remaining: 0 } }, 200);
  }
  const remaining = data.totalCredits - data.usedCredits;
  return c.json({ success: true, data: { ...data, remaining } }, 200);
}

export async function getUsageHistory(c: Context<AppContext>) {
  const db = getDb(c.env.DB);
  const storeId = c.get("storeId")!;
  const agentType = c.req.query("agentType") as any;
  const limit = Number(c.req.query("limit") ?? 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const data = await queries.getAiCreditUsageHistory(db, storeId, { agentType, limit, offset });
  return c.json({ success: true, data, count: data.length }, 200);
}
