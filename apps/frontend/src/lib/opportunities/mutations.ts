"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { UpdateOpportunityWorkflowSchema, UpdateOpportunityWorkflowData } from "./validation";

export async function updateOpportunityWorkflow(data: UpdateOpportunityWorkflowData) {
  const validation = UpdateOpportunityWorkflowSchema.safeParse(data);

  if (!validation.success) {
    // In a real app, you'd return a structured error
    throw new Error("Invalid input.");
  }

  const { id, ...workflowData } = validation.data;

  try {
    await prisma.opportunity.update({
      where: { id },
      data: workflowData,
    });

    // Revalidate the path to show the updated data immediately
    revalidatePath(`/opportunities/${id}`);

    return { success: true };

  } catch (error) {
    console.error("Failed to update opportunity workflow:", error);
    // In a real app, you'd return a structured error
    throw new Error("Database operation failed.");
  }
}
