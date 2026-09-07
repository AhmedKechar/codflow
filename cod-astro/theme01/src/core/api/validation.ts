import { z } from "astro/zod";

/**
 * Product Image Schema
 */
export const ProductImageSchema = z.object({
  id: z.string(),
  src: z.url(),
  srcSm: z.url().nullable(),
  srcMd: z.url().nullable(),
  srcLg: z.url().nullable(),
  altText: z.string().nullable(),
  position: z.number(),
});

/**
 * Product Variant Schema
 */
export const ProductVariantSchema = z.object({
  id: z.string(),
  variations: z.record(z.string(), z.string()),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  inventory: z.number(),
  sku: z.string().nullable(),
  isDefault: z.boolean(),
  imageId: z.string().nullable(),
});

/**
 * Offer Schema
 */
export const OfferSchema = z.object({
  id: z.string(),
  name: z.string(),
  discountType: z.enum(["free", "free_shipping"]),
  triggerQuantity: z.number(),
  triggerVariantId: z.string().nullable(),
  rewardQuantity: z.number(),
  rewardProductId: z.string().nullable(),
  rewardProductName: z.string(),
  rewardVariantId: z.string().nullable(),
  rewardVariantLabel: z.string().nullable(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
});

/**
 * Product Schema for Content Collections
 */
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  handle: z.string(),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  currency: z.string(),
  hasVariants: z.boolean(),
  variantOptions: z.array(z.object({
    name: z.string(),
    values: z.array(z.object({ 
      value: z.string(), 
      hexColor: z.string().optional() 
    })),
  })).nullable(),
  tags: z.array(z.string()),
  status: z.string(),
  storeFeatured: z.boolean(),
  inventory: z.number(),
  trackInventory: z.boolean(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).nullable(),
  variants: z.array(ProductVariantSchema),
  images: z.array(ProductImageSchema),
  coverImage: ProductImageSchema.nullable(),
  reviewStats: z.object({
    avgRating: z.number(),
    reviewCount: z.number(),
  }).nullable().optional(),
  offers: z.array(OfferSchema),
  orderCount: z.number().int().optional().default(0),
  viewCount: z.number().int().optional().default(0),
  popupConfig: z.object({
    enabled: z.boolean(),
    delaySeconds: z.number().optional(),
    discountPercent: z.number().optional(),
    discountCode: z.string().optional(),
    expiresAt: z.string().optional(),
  }).nullable().optional(),
});

/**
 * Category Schema for Content Collections
 */
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.url().nullable(),
  position: z.number(),
});
