"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { requireSuperAdmin } from "@/lib/auth";
import { users } from "@/db/schema";
import { getAllUsers } from "../../cod-shared/queries/users";

export async function listUsers() {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  return getAllUsers(db);
}

export async function createUserAction(data: {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "staff";
  status?: "active" | "inactive";
}) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const now = new Date();
  const user = await db.insert(users).values({
    id: randomUUID(),
    name: data.name,
    email: data.email,
    emailVerified: false,
    role: data.role ?? "staff",
    status: data.status ?? "active",
    createdAt: now,
    updatedAt: now,
  }).returning().get();

  revalidatePath("/users");
  return { ok: true as const, data: user };
}

export async function updateUserAction(userId: string, data: {
  name?: string;
  email?: string;
  role?: "admin" | "staff";
  status?: "active" | "inactive";
}) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const user = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()
    .get();

  revalidatePath("/users");
  return { ok: true as const, data: user };
}

export async function deleteUserAction(userId: string) {
  await requireSuperAdmin();
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  await db.delete(users).where(eq(users.id, userId)).run();

  revalidatePath("/users");
  return { ok: true as const };
}
