-- Migration 0033: OAuth tables alignment with Better Auth 1.7
-- Adds new tables (oauthResources, oauthClientResources, oauthClientAssertions)
-- and missing columns on existing tables.

-- ─── New tables ──────────────────────────────────────────────────────────────

-- Protected resource definitions (RFC 8707 resource-bound tokens)
CREATE TABLE IF NOT EXISTS "oauthResources" (
  "id"                            text PRIMARY KEY,
  "identifier"                    text NOT NULL,
  "name"                          text,
  "accessTokenTtl"                integer,
  "refreshTokenTtl"               integer,
  "signingAlgorithm"              text,
  "signingKeyId"                  text,
  "allowedScopes"                 text,  -- JSON string[]
  "customClaims"                  text,  -- JSON
  "dpopBoundAccessTokensRequired" integer, -- boolean
  "disabled"                      integer, -- boolean
  "policyVersion"                 text,
  "metadata"                      text,  -- JSON
  "createdAt"                     integer NOT NULL,
  "updatedAt"                     integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "oauthResources_identifier_idx" ON "oauthResources" ("identifier");

-- Many-to-many join: clients ↔ resources
CREATE TABLE IF NOT EXISTS "oauthClientResources" (
  "id"        text PRIMARY KEY,
  "clientId"  text NOT NULL REFERENCES "oauthClients"("client_id"),
  "resourceId" text NOT NULL REFERENCES "oauthResources"("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "oauthClientResources_client_resource_idx"
  ON "oauthClientResources" ("clientId", "resourceId");

-- private_key_jwt assertion replay protection
CREATE TABLE IF NOT EXISTS "oauthClientAssertions" (
  "id"        text PRIMARY KEY,
  "clientId"  text NOT NULL REFERENCES "oauthClients"("client_id"),
  "expiresAt" integer NOT NULL,
  "createdAt" integer NOT NULL
);

-- ─── Missing columns on existing tables ──────────────────────────────────────

-- oauthClients: new columns for Better Auth 1.7
ALTER TABLE "oauthClients" ADD COLUMN "applicationType" text;
ALTER TABLE "oauthClients" ADD COLUMN "clientDiscoveryId" text;
ALTER TABLE "oauthClients" ADD COLUMN "clientCredentialsScopes" text;  -- JSON string[]
ALTER TABLE "oauthClients" ADD COLUMN "backchannelLogoutUri" text;
ALTER TABLE "oauthClients" ADD COLUMN "backchannelLogoutSessionRequired" integer; -- boolean

-- oauthAccessTokens: resource-bound tokens + revocation
ALTER TABLE "oauthAccessTokens" ADD COLUMN "resources" text;  -- JSON string[]
ALTER TABLE "oauthAccessTokens" ADD COLUMN "authorizationCodeId" text;
ALTER TABLE "oauthAccessTokens" ADD COLUMN "revoked" integer; -- timestamp_ms

-- oauthRefreshTokens: resource-bound tokens
ALTER TABLE "oauthRefreshTokens" ADD COLUMN "resources" text;  -- JSON string[]
ALTER TABLE "oauthRefreshTokens" ADD COLUMN "authorizationCodeId" text;

-- oauthConsents: requested user info claims
ALTER TABLE "oauthConsents" ADD COLUMN "requestedUserInfoClaims" text;  -- JSON string[]
