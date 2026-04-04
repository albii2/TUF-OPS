'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createLeadSchema } from "@/lib/validation/lead";

export type State = {
  errors?: {
    organizationName?: string[];
  };
  message?: string | null;
};

export async function createLead(prevState: State, formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    return {
      message: "Unauthorized",
    };
  }

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
      message: "Failed to create lead.",
    };
  }

  try {
    await prisma.lead.create({
      data: validatedFields.data,
    });
  } catch (e) {
    return { message: "Database Error: Failed to create lead." };
  }

  revalidatePath("/leads");
  redirect("/leads");
}
