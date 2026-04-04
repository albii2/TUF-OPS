import { z } from "zod";

export const addContactSchema = z.object({
  programId: z.number(),
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
});
