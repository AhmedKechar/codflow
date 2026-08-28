import { z } from "zod";

const discountCodeBaseSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be at most 50 characters")
    .regex(
      /^[A-Za-z0-9-]+$/,
      "Code must be alphanumeric (hyphens allowed)",
    ),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().int().min(1, "Value must be greater than 0"),
  minOrderAmount: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  startsAt: z.string().datetime({ offset: true }).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  status: z.enum(["active", "inactive", "expired"]).default("active"),
});

export const createDiscountCodeSchema = discountCodeBaseSchema;

export const updateDiscountCodeSchema = discountCodeBaseSchema.partial();

export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;
export type UpdateDiscountCodeInput = z.infer<typeof updateDiscountCodeSchema>;
