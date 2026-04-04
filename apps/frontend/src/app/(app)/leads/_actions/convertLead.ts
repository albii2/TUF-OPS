'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { convertLeadSchema } from "@/lib/validation/lead";

export async function convertLead(input: unknown) {
  const session = await requireSession();
  const data = convertLeadSchema.parse(input);

  const lead = await prisma.lead.findUnique({
    where: { id: data.leadId },
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  const organization = await prisma.organization.create({
    data: {
      name: lead.organizationName,
      ownerId: lead.assignedToId,
    },
  });

  const opportunity = await prisma.opportunity.create({
    data: {
      name: `${lead.organizationName} - New Opportunity`,
      organization_id: organization.id,
      ownerId: lead.assignedToId,
    },
  });

  await prisma.lead.update({
    where: { id: data.leadId },
    data: {
      status: "CONVERTED",
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/opportunities/${opportunity.id}`);
}
