import { z } from "zod";

export const organizationStatusSchema = z.enum([
  "active",
  "inactive",
  "archived",
]);

export const updateOrganizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Organization name is required."),
  status: organizationStatusSchema,
  ownerId: z.string().nullable().optional(),
  zohoAccountId: z.string().nullable().optional(),
});
