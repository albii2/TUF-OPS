"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrganizationOwner(input: {
  id: number;
  ownerId?: number | null;
}) {
  const updated = await prisma.organization.update({
    where: { id: input.id },
    data: {
      ownerId: input.ownerId,
    },
  });

  revalidatePath(`/organizations/${input.id}`);
  revalidatePath("/organizations");
  revalidatePath("/dashboard");

  return updated;
}
