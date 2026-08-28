-- Migration 0021: Site Builder
-- Adds siteJson column to stores table — merchant site-builder layout config.
-- Schema: SiteBuilderConfig (see cod-shared/site-builder.ts)
-- NULL = use defaults (current storefront layout). Stored as raw JSON string.
ALTER TABLE stores ADD COLUMN site_json TEXT;
