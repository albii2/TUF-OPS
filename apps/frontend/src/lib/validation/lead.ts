import { z } from "zod";

export const createLeadSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required."),
  contactName: z.string().optional(),
  contactInfo: z.string().optional(),
  sport: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const assignLeadSchema = z.object({
  leadId: z.string(),
  userId: z.coerce.number(),
});

export const convertLeadSchema = z.object({
  leadId: z.string(),
});
