"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { UpdateOpportunityWorkflowSchema, UpdateOpportunityWorkflowData } from "./validation";

export async function updateOpportunityWorkflow(data: UpdateOpportunityWorkflowData) {
  const validation = UpdateOpportunityWorkflowSchema.safeParse(data);

  if (!validation.success) {
    throw new Error("Invalid input.");
  }

  const { id, ...workflowData } = validation.data;

  try {
    await prisma.opportunity.update({
      where: { id },
      data: workflowData,
    });

    revalidatePath(`/opportunities/${id}`);

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
