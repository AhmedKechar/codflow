import { eq, and, desc } from "drizzle-orm";
import { customDomains } from "../db/schema";
import type { AppDb } from "../db/client";

export type CustomDomainStatus = "pending" | "verifying" | "active" | "failed" | "expired";
export type SslStatus = "pending" | "active" | "failed";

export interface CreateCustomDomainData {
  domain: string;
  status?: CustomDomainStatus;
  sslStatus?: SslStatus;
  verificationToken?: string;
}

export interface UpdateCustomDomainData {
  domain?: string;
  status?: CustomDomainStatus;
  sslStatus?: SslStatus;
  verificationToken?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

export async function listCustomDomains(db: AppDb, storeId: string) {
  return db
    .select()
    .from(customDomains)
    .where(eq(customDomains.storeId, storeId))
    .orderBy(desc(customDomains.createdAt))
    .all();
}

export async function getCustomDomainById(
  db: AppDb,
  storeId: string,
  id: string,
) {
  return (
    db
      .select()
      .from(customDomains)
      .where(and(eq(customDomains.storeId, storeId), eq(customDomains.id, id)))
      .get() ?? null
  );
}

export async function getCustomDomainByDomain(
  db: AppDb,
  storeId: string,
  domain: string,
) {
  return (
    db
      .select()
      .from(customDomains)
      .where(
        and(
          eq(customDomains.storeId, storeId),
          eq(customDomains.domain, domain.toLowerCase()),
        ),
      )
      .get() ?? null
  );
}

export async function createCustomDomain(
  db: AppDb,
  storeId: string,
  data: CreateCustomDomainData,
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const verificationToken = data.verificationToken ?? crypto.randomUUID().slice(0, 16);

  await db.insert(customDomains).values({
    id,
    storeId,
    domain: data.domain.toLowerCase(),
    status: data.status ?? "pending",
    sslStatus: data.sslStatus ?? "pending",
    verificationToken,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
}

export async function updateCustomDomain(
  db: AppDb,
  storeId: string,
  id: string,
  data: UpdateCustomDomainData,
) {
  const now = new Date().toISOString();

  await db
    .update(customDomains)
    .set({
      ...(data.domain !== undefined && { domain: data.domain.toLowerCase() }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.sslStatus !== undefined && { sslStatus: data.sslStatus }),
      ...(data.verificationToken !== undefined && {
        verificationToken: data.verificationToken,
      }),
      ...(data.verifiedAt !== undefined && { verifiedAt: data.verifiedAt }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      updatedAt: now,
    })
    .where(and(eq(customDomains.storeId, storeId), eq(customDomains.id, id)));
}

export async function deleteCustomDomain(
  db: AppDb,
  storeId: string,
  id: string,
) {
  await db
    .delete(customDomains)
    .where(and(eq(customDomains.storeId, storeId), eq(customDomains.id, id)));
}

export async function verifyCustomDomain(
  db: AppDb,
  storeId: string,
  id: string,
) {
  const domain = await getCustomDomainById(db, storeId, id);
  if (!domain) return null;

  const now = new Date().toISOString();

  await db
    .update(customDomains)
    .set({
      status: "active",
      sslStatus: "active",
      verifiedAt: now,
      updatedAt: now,
    })
    .where(and(eq(customDomains.storeId, storeId), eq(customDomains.id, id)));

  return getCustomDomainById(db, storeId, id);
}
