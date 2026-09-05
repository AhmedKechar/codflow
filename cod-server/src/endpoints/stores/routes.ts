/**
 * Stores (Management) Routes
 *
 * Dashboard endpoints for reading and updating the store configuration and
 * Meta pixel tracking config. Single-tenant: the store is resolved from the
 * D1 database, not from the path. All routes are admin-only.
 *
 * Not to be confused with /api/store/* — the public storefront API.
 *
 * Migrated to defineRoute() from @/lib/route-builder.
 */

import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppContext } from "@/types";
import { defineRoute } from "@/lib/route-builder";
import * as handlers from "./handlers";
import {
  StoreSchema,
  StorePixelConfigSchema,
  SuccessResponseSchema,
} from "@/openapi/schemas";

const jsonContent = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});

const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Invalid hex color");

const getMyStoreRoute = defineRoute({
  method: "get",
  path: "/me",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Get store configuration",
  description:
    "Returns the current store's configuration including branding, theme, localization, SEO, and storefront settings.",
  operationId: "getMyStore",
  responses: {
    200: {
      description: "Store configuration",
      content: jsonContent(SuccessResponseSchema(StoreSchema)),
    },
  },
  handler: handlers.getMyStore,
});

const updateMyStoreRoute = defineRoute({
  method: "patch",
  path: "/me",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Update store configuration",
  description:
    "Partially updates the store configuration. All fields are optional — only include the fields you want to change. Set nullable fields to `null` to clear them.",
  operationId: "updateMyStore",
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    logoUrl: z.string().url().nullable().optional(),
    primaryColor: hexColor.optional(),
    accentColor: hexColor.optional(),
    bgColor: hexColor.optional(),
    fontFamily: z.string().min(1).max(200).optional(),
    fontUrl: z.string().url().nullable().optional(),
    borderRadius: z.enum(["rounded", "sharp", "minimal"]).optional(),
    shadowIntensity: z.enum(["soft", "medium", "strong"]).optional(),
    lang: z.enum(["ar", "en"]).optional(),
    currencySymbol: z.string().min(1).max(10).optional(),
    contentJson: z.string().nullable().optional(),
    siteJson: z.string().nullable().optional(),
    metaTitle: z.string().max(200).nullable().optional(),
    metaDescription: z.string().max(500).nullable().optional(),
    ogImage: z.string().url().nullable().optional(),
    announcementBar: z.string().max(500).nullable().optional(),
    reviewsEnabled: z.boolean().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    trustSeals: z
      .object({
        cashOnDelivery: z.boolean().optional(),
        freeReturns: z.boolean().optional(),
        secureCheckout: z.boolean().optional(),
        fastDelivery: z.boolean().optional(),
        customerSupport: z.boolean().optional(),
        qualityGuarantee: z.boolean().optional(),
      })
      .nullable()
      .optional(),
    orderFormConfig: z
      .object({
        showName: z.boolean().optional(),
        showPhone: z.boolean().optional(),
        showEmail: z.boolean().optional(),
        showAddress: z.boolean().optional(),
        showWilaya: z.boolean().optional(),
        showCommune: z.boolean().optional(),
        showDeliveryType: z.boolean().optional(),
        showNotes: z.boolean().optional(),
        showQuantity: z.boolean().optional(),
        submitButtonText: z.string().max(50).nullable().optional(),
        summaryDisplay: z.enum(["open", "closed", "hidden"]).optional(),
      })
      .nullable()
      .optional(),
  }),
  responses: {
    200: {
      description: "Updated store configuration",
      content: jsonContent(SuccessResponseSchema(StoreSchema)),
    },
  },
  handler: handlers.updateMyStore,
});

const getPixelConfigRoute = defineRoute({
  method: "get",
  path: "/pixel-config",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Get pixel configuration",
  description:
    "Returns the store's Meta pixel tracking configuration, or `null` when none has been configured yet.",
  operationId: "getPixelConfig",
  responses: {
    200: {
      description: "Pixel configuration (null when not configured)",
      content: jsonContent(
        z.object({
          success: z.boolean().openapi({ example: true }),
          data: StorePixelConfigSchema.nullable(),
        })
      ),
    },
  },
  handler: handlers.getPixelConfig,
});

const savePixelConfigRoute = defineRoute({
  method: "post",
  path: "/pixel-config",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Save pixel configuration",
  description:
    "Upserts the store's Meta pixel tracking configuration. Omitted optional fields fall back to defaults (`accessToken` empty, `enabled` true).",
  operationId: "savePixelConfig",
  body: z.object({
    pixelId: z.string().min(1),
    accessToken: z.string().default(""),
    testEventCode: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
  }),
  responses: {
    200: {
      description: "Saved pixel configuration",
      content: jsonContent(SuccessResponseSchema(StorePixelConfigSchema)),
    },
  },
  handler: handlers.savePixelConfig,
});

// ─── OTP Config Routes ─────────────────────────────────────────────────────

const otpConfigResponseSchema = z.object({
  language: z.string(),
  enabled: z.boolean(),
  apiKeyMasked: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

const getOtpConfigRoute = defineRoute({
  method: "get",
  path: "/otp-config",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Get OTP verification configuration",
  description: "Returns the store's WhatsApp OTP verification settings (API key is masked).",
  operationId: "getOtpConfig",
  responses: {
    200: {
      description: "OTP configuration",
      content: jsonContent(SuccessResponseSchema(otpConfigResponseSchema.nullable())),
    },
  },
  handler: handlers.getOtpConfig,
});

const saveOtpConfigRoute = defineRoute({
  method: "post",
  path: "/otp-config",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Save OTP verification configuration",
  description: "Creates or updates the store's WhatsApp OTP settings. Empty apiKey keeps the stored key.",
  operationId: "saveOtpConfig",
  body: z.object({
    apiKey: z.string().optional(),
    language: z.enum(["ar", "fr", "en"]).optional(),
    enabled: z.boolean().optional(),
  }),
  responses: {
    200: {
      description: "OTP configuration saved",
      content: jsonContent(SuccessResponseSchema(otpConfigResponseSchema)),
    },
  },
  handler: handlers.saveOtpConfig,
});

const testOtpConnectionRoute = defineRoute({
  method: "post",
  path: "/otp-config/test",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Test DZVerify connection",
  description: "Verifies the DZVerify API key and returns the account balance.",
  operationId: "testOtpConnection",
  responses: {
    200: {
      description: "Connection test result",
      content: jsonContent(
        z.object({
          ok: z.boolean(),
          reason: z.string().optional(),
          message: z.string().optional(),
          balanceDa: z.number().optional(),
          plan: z.string().optional(),
          outOfCredits: z.boolean().optional(),
        })
      ),
    },
  },
  handler: handlers.testOtpConnection,
});

// ─── Email Config Routes ────────────────────────────────────────────────────

const emailConfigResponseSchema = z.object({
  language: z.string(),
  enabled: z.boolean(),
  apiKeyMasked: z.string().nullable(),
  fromEmail: z.string(),
  fromName: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

const getEmailConfigRoute = defineRoute({
  method: "get",
  path: "/email-config",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Get email sending configuration",
  description: "Returns the store's Sendili email settings (API key is masked).",
  operationId: "getEmailConfig",
  responses: {
    200: {
      description: "Email configuration",
      content: jsonContent(SuccessResponseSchema(emailConfigResponseSchema.nullable())),
    },
  },
  handler: handlers.getEmailConfig,
});

const saveEmailConfigRoute = defineRoute({
  method: "post",
  path: "/email-config",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Save email sending configuration",
  description: "Creates or updates the store's Sendili email settings. Empty apiKey keeps the stored key.",
  operationId: "saveEmailConfig",
  body: z.object({
    apiKey: z.string().optional(),
    fromEmail: z.string().email().optional(),
    fromName: z.string().optional(),
    enabled: z.boolean().optional(),
  }),
  responses: {
    200: {
      description: "Email configuration saved",
      content: jsonContent(SuccessResponseSchema(emailConfigResponseSchema)),
    },
  },
  handler: handlers.saveEmailConfig,
});

const testEmailConnectionRoute = defineRoute({
  method: "post",
  path: "/email-config/test",
  auth: "admin",
  tags: ["Store Settings"],
  summary: "Test Sendili connection",
  description: "Verifies the Sendili API key and returns verified domains for the from-address picker.",
  operationId: "testEmailConnection",
  responses: {
    200: {
      description: "Connection test result",
      content: jsonContent(
        z.object({
          ok: z.boolean(),
          reason: z.string().optional(),
          message: z.string().optional(),
          credits: z.number().optional(),
          verifiedDomains: z.array(z.string()).optional(),
        })
      ),
    },
  },
  handler: handlers.testEmailConnection,
});

const router = new OpenAPIHono<AppContext>();

router.openapi(getMyStoreRoute.route, getMyStoreRoute.handler);
router.openapi(updateMyStoreRoute.route, updateMyStoreRoute.handler);
router.openapi(getPixelConfigRoute.route, getPixelConfigRoute.handler);
router.openapi(savePixelConfigRoute.route, savePixelConfigRoute.handler);
router.openapi(getOtpConfigRoute.route, getOtpConfigRoute.handler);
router.openapi(saveOtpConfigRoute.route, saveOtpConfigRoute.handler);
router.openapi(testOtpConnectionRoute.route, testOtpConnectionRoute.handler);
router.openapi(getEmailConfigRoute.route, getEmailConfigRoute.handler);
router.openapi(saveEmailConfigRoute.route, saveEmailConfigRoute.handler);
router.openapi(testEmailConnectionRoute.route, testEmailConnectionRoute.handler);

export default router;
