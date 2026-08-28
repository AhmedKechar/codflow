import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Invalid hex color");

export const updateStoreSchema = z.object({
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
});

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
