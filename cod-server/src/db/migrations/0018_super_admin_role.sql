-- Migration 0018: Add super_admin role for platform operators

-- Super Admin role must be valid (platform operators, not store owners)
ALTER TABLE `users` ADD CONSTRAINT `chk_users_role` CHECK (`role` IN ('admin', 'staff', 'super_admin'));
--> statement-breakpoint
