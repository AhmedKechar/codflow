import { getDb } from "@/db";
import { sweepPendingToAbandoned } from "../../../cod-shared/queries/abandoned-orders";
import { abandonedOrders } from "../../../cod-shared/db/schema";
import { sql } from "drizzle-orm";
import type { Env } from "@/types";

export async function sweepAbandonedOrders(env: Env): Promise<void> {
  const db = getDb(env.DB);

  const storeRows = await db
    .select({ storeId: abandonedOrders.storeId })
    .from(abandonedOrders)
    .groupBy(abandonedOrders.storeId)
    .all();

  for (const row of storeRows) {
    const count = await sweepPendingToAbandoned(db, row.storeId);
    console.log(`[cron:sweep-abandoned] swept ${count} pending → abandoned (store ${row.storeId})`);
  }
}
