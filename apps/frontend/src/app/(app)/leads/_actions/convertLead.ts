'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { convertLeadSchema } from "@/lib/validation/lead";

export async function convertLead(input: unknown) {
  const session = await requireSession();
  if (session.user.role === "rep") {
    throw new Error("Unauthorized");
  }

  const { leadId } = convertLeadSchema.parse(input);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  if (!lead.assignedToId) {
    throw new Error("Cannot convert an unassigned lead.");
  }

  // Find or create the organization
  let organization = await prisma.organization.findFirst({
    where: { name: { equals: lead.organizationName, mode: 'insensitive' } },
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: lead.organizationName,
        ownerId: lead.assignedToId,
      },
    });
  }

  // Create the opportunity
  const opportunity = await prisma.opportunity.create({
    data: {
      name: `[LEAD] - ${lead.organizationName}`,
      organization_id: organization.id,
      ownerId: lead.assignedToId,
      stage: "lead", // Default stage
      // nextStep and nextStepDueDate are now required, so we must provide defaults
      nextStep: "Initial follow-up",
      nextStepDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
  });

  // Update the lead status
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "CONVERTED" },
  });

  revalidatePath("/leads");
  revalidatePath("/opportunities/my");
  revalidatePath("/opportunities/team");
}
