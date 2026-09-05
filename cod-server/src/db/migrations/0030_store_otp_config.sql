CREATE TABLE IF NOT EXISTS `store_otp_config` (
  `id`         text PRIMARY KEY NOT NULL,
  `store_id`   text NOT NULL UNIQUE REFERENCES `stores`(`id`) ON DELETE CASCADE,
  `api_key`    text NOT NULL,
  `language`   text NOT NULL DEFAULT 'ar',
  `enabled`    integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
