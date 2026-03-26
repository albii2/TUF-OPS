"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createOpportunity(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    organization_id: parseInt(formData.get("organizationId") as string, 10),
    stage: formData.get("stage") as string,
    estimated_value: parseFloat(formData.get("estimatedValue") as string),
    probability: parseInt(formData.get("probability") as string, 10),
  };

  // In a real app, you would add validation here (e.g., with Zod)

  await prisma.opportunity.create({ data });

  revalidatePath("/opportunities");
  redirect("/opportunities");
}
