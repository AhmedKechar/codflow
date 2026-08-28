-- Migration 0019: Add theme design tokens (border radius, shadow intensity)
-- These columns allow merchants to customize the visual feel of their storefront
-- beyond colors and fonts. Existing rows get the default values automatically.
ALTER TABLE `stores` ADD COLUMN `border_radius` text DEFAULT 'rounded' NOT NULL;
--> statement-breakpoint
ALTER TABLE `stores` ADD COLUMN `shadow_intensity` text DEFAULT 'soft' NOT NULL;
