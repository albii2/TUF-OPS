import { z } from "zod";

export const programStatusSchema = z.enum([
  "active",
  "inactive",
  "archived",
]);

export const updateProgramSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Program name is required."),
  status: programStatusSchema,
  ownerId: z.string().nullable().optional(),
  zohoAccountId: z.string().nullable().optional(),
});
