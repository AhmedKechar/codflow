"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { requireSuperAdmin } from "@/lib/auth";
import { getAllUsers } from "../../cod-shared/queries/users";

export async function listUsers() {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  return getAllUsers(db);
}
