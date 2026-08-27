-- Migration 0015: Seed default subscription plans
-- Four plans for the Algerian COD market

-- Free Trial (تجريبي)
INSERT INTO `plans` (`id`, `name`, `name_ar`, `name_fr`, `description`, `description_ar`, `description_fr`, `price_dzd`, `currency`, `billing_cycle`, `trial_days`, `max_orders`, `max_products`, `max_drivers`, `max_customers`, `max_team_members`, `max_ai_credits`, `features`, `is_active`, `sort_order`, `created_at`, `updated_at`)
VALUES ('plan_free_trial', 'free_trial', 'تجريبي', 'Essai gratuit', 'Free trial with limited features', 'تجريبي مجاني بميزات محدودة', 'Essai gratuit avec fonctionnalités limitées', 0, 'DZD', 'monthly', 30, 20, 100, 5, 1000, 2, 0, '["basic_orders","basic_products","basic_customers","basic_delivery"]', 1, 0, datetime('now'), datetime('now'));
--> statement-breakpoint

-- Basic (أساسي) - 2,000 DZD/month
INSERT INTO `plans` (`id`, `name`, `name_ar`, `name_fr`, `description`, `description_ar`, `description_fr`, `price_dzd`, `currency`, `billing_cycle`, `trial_days`, `max_orders`, `max_products`, `max_drivers`, `max_customers`, `max_team_members`, `max_ai_credits`, `features`, `is_active`, `sort_order`, `created_at`, `updated_at`)
VALUES ('plan_basic', 'basic', 'أساسي', 'Basique', 'For small merchants starting online', 'للمتاجر الصغيرة التي تبدأ البيع عبر الإنترنت', 'Pour les petits commerçants qui commencent en ligne', 2000, 'DZD', 'monthly', 0, 2000, 500, 10, 5000, 3, 50, '["basic_orders","basic_products","basic_customers","basic_delivery","analytics","whatsapp_basic"]', 1, 1, datetime('now'), datetime('now'));
--> statement-breakpoint

-- Pro (احترافي) - 5,000 DZD/month
INSERT INTO `plans` (`id`, `name`, `name_ar`, `name_fr`, `description`, `description_ar`, `description_fr`, `price_dzd`, `currency`, `billing_cycle`, `trial_days`, `max_orders`, `max_products`, `max_drivers`, `max_customers`, `max_team_members`, `max_ai_credits`, `features`, `is_active`, `sort_order`, `created_at`, `updated_at`)
VALUES ('plan_pro', 'pro', 'احترافي', 'Professionnel', 'For growing businesses with advanced needs', 'للأعمال النامية مع احتياجات متقدمة', 'Pour les entreprises en croissance avec des besoins avancés', 5000, 'DZD', 'monthly', 0, 10000, 2000, 25, 20000, 5, 200, '["basic_orders","basic_products","basic_customers","basic_delivery","analytics","whatsapp_advanced","ai_agents","custom_themes","priority_support"]', 1, 2, datetime('now'), datetime('now'));
--> statement-breakpoint

-- Enterprise (مؤسسات) - 15,000 DZD/month
INSERT INTO `plans` (`id`, `name`, `name_ar`, `name_fr`, `description`, `description_ar`, `description_fr`, `price_dzd`, `currency`, `billing_cycle`, `trial_days`, `max_orders`, `max_products`, `max_drivers`, `max_customers`, `max_team_members`, `max_ai_credits`, `features`, `is_active`, `sort_order`, `created_at`, `updated_at`)
VALUES ('plan_enterprise', 'enterprise', 'مؤسسات', 'Entreprise', 'For large operations with custom requirements', 'للعمليات الكبيرة مع متطلبات مخصصة', 'Pour les grandes opérations avec des exigences personnalisées', 15000, 'DZD', 'monthly', 0, -1, -1, -1, -1, -1, 1000, '["basic_orders","basic_products","basic_customers","basic_delivery","analytics","whatsapp_advanced","ai_agents","custom_themes","priority_support","custom_domain","api_access","dedicated_support"]', 1, 3, datetime('now'), datetime('now'));
