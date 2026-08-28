import { z } from "zod";

const giftCardBaseSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(/^[A-Za-z0-9]+$/, "Code must be alphanumeric")
    .optional(),
  initialAmountDzd: z.number().int().min(1, "Amount must be greater than 0"),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientEmail: z.string().email("Invalid email address").optional(),
  senderName: z.string().optional(),
  message: z.string().optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  status: z.enum(["active", "used", "expired", "disabled"]).default("active"),
});

export const createGiftCardSchema = giftCardBaseSchema;

export const updateGiftCardSchema = giftCardBaseSchema.partial();

export type CreateGiftCardInput = z.infer<typeof createGiftCardSchema>;
export type UpdateGiftCardInput = z.infer<typeof updateGiftCardSchema>;
