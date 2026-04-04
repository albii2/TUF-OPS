'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPrograms() {
    return await prisma.program.findMany({ include: { owner: true } });
}

export async function updateProgramOwner(input: {
    id: number;
    ownerId?: number | null;
  }) {
    const updated = await prisma.program.update({
      where: { id: input.id },
      data: {
        ownerId: input.ownerId,
      },
    });
  
    revalidatePath(`/programs/${input.id}`);
    revalidatePath("/programs");
    revalidatePath("/dashboard");

    return updated;
  }
