'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { updateOpportunitySchema } from "@/lib/validation/opportunity"; // Corrected path
import type { z } from 'zod';

type UpdateOpportunityData = z.infer<typeof updateOpportunitySchema>;

export async function updateOpportunityWorkflow(data: Partial<UpdateOpportunityData> & { id: string }) {

  // Since this is a partial update from the workflow, we can't use the full schema.
  // We will manually build the update object to ensure type safety.
  const updateData: any = {};
  if (data.stage) updateData.stage = data.stage;
  if (data.nextStep) updateData.nextStep = data.nextStep;
  if (data.nextStepDueDate) updateData.nextStepDueDate = data.nextStepDueDate;

  try {
    await prisma.opportunity.update({
      where: { id: parseInt(data.id, 10) },
      data: updateData,
    });

    revalidatePath(`/opportunities/${data.id}`);

    return { success: true };

  } catch (error) {
    console.error("Failed to update opportunity workflow:", error);
    throw new Error("Database operation failed.");
  }
}

export async function updateOpportunityOwner(input: {
    id: number;
    ownerId?: number | null;
  }) {
    const updated = await prisma.opportunity.update({
      where: { id: input.id },
      data: {
        ownerId: input.ownerId,
      },
    });
  
    revalidatePath(`/opportunities/${input.id}`);
    revalidatePath("/opportunities");
    revalidatePath("/dashboard");

    return updated;
  }
