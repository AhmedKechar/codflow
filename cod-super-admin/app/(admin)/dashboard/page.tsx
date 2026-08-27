import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { stores, subscriptions, payments } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStatCards } from "@/components/dashboard/stat-cards";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user || user.role !== "super_admin") redirect("/sign-in");

  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const totalStores = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .get()
    .then((r) => Number(r?.count ?? 0));

  const activeSubscriptions = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(sql`${subscriptions.status} IN ('active', 'trialing', 'past_due')`)
    .get()
    .then((r) => Number(r?.count ?? 0));

  const pendingPayments = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(eq(payments.status, "pending"))
    .get()
    .then((r) => Number(r?.count ?? 0));

  const totalRevenue = await db
    .select({ total: sql<number>`COALESCE(SUM(${payments.amountDzd}), 0)` })
    .from(payments)
    .where(eq(payments.status, "approved"))
    .get()
    .then((r) => Number(r?.total ?? 0));

  return (
    <DashboardStatCards
      totalStores={totalStores}
      activeSubscriptions={activeSubscriptions}
      pendingPayments={pendingPayments}
      totalRevenue={totalRevenue}
    />
  );
}
