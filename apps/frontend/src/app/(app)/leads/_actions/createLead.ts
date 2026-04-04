'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createLeadSchema } from "@/lib/validation/lead";

export async function createLead(prevState: any, formData: FormData) {
  const session = await requireSession();

  const validatedFields = createLeadSchema.safeParse({
    organizationName: formData.get("organizationName"),
    contactName: formData.get("contactName"),
    contactInfo: formData.get("contactInfo"),
    sport: formData.get("sport"),
    notes: formData.get("notes"),
    source: formData.get("source"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Lead.",
    };
  }

  await prisma.lead.create({
    data: {
      organizationName: validatedFields.data.organizationName,
      contactName: validatedFields.data.contactName,
      contactInfo: validatedFields.data.contactInfo,
      sport: validatedFields.data.sport,
      notes: validatedFields.data.notes,
      source: validatedFields.data.source,
    },
  });

  revalidatePath("/leads");

  return { message: "Successfully created lead" };
}
