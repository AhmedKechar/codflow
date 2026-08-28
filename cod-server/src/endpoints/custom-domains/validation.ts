import { z } from "zod";

const domainRegex =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const customDomainBaseSchema = z.object({
  domain: z
    .string()
    .min(3, "Domain must be at least 3 characters")
    .max(253, "Domain must be at most 253 characters")
    .regex(domainRegex, "Invalid domain format"),
});

export const createCustomDomainSchema = customDomainBaseSchema;

export const updateCustomDomainSchema = customDomainBaseSchema.partial();

export type CreateCustomDomainInput = z.infer<typeof createCustomDomainSchema>;
export type UpdateCustomDomainInput = z.infer<typeof updateCustomDomainSchema>;
