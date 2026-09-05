-- Store email configuration for transactional email via Sendili.
-- No row = feature inert (safe default for fresh installs).
CREATE TABLE IF NOT EXISTS `store_email_config` (
  `id`         text PRIMARY KEY NOT NULL,
  `store_id`   text NOT NULL UNIQUE REFERENCES `stores`(`id`) ON DELETE CASCADE,
  `api_key`    text NOT NULL,          -- Sendili API key (plaintext, merchant-editable)
  `from_email` text NOT NULL,          -- e.g. noreply@acme.com
  `from_name`  text,                   -- optional display name
  `enabled`    integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
