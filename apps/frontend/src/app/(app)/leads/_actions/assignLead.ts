'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { assignLeadSchema } from "@/lib/validation/lead";
import { getAssignableUsers } from "@/lib/users/queries";

export async function assignLead(input: unknown) {
  const session = await requireSession();
  const data = assignLeadSchema.parse(input);

  // Authorization Check
  const assignableUsers = await getAssignableUsers();
  const isAllowed = assignableUsers.some((user) => user.id === data.userId);

  if (!isAllowed) {
    throw new Error("Unauthorized: You cannot assign this lead to the selected user.");
  }

  await prisma.lead.update({
    where: { id: data.leadId },
    data: {
      assignedToId: data.userId,
      status: "ASSIGNED",
    },
  });

  revalidatePath("/leads");
}
