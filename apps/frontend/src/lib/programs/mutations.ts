import { prisma } from "@/lib/prisma";
import { ProgramStatus } from "@prisma/client";

type UpdateProgramInput = {
  id: number;
  name: string;
  status: ProgramStatus;
  ownerId?: number | null;
  zohoAccountId?: string | null;
};

export async function updateProgram(input: UpdateProgramInput) {
  return prisma.program.update({
    where: { id: input.id },
    data: {
      name: input.name,
      status: input.status,
      ownerId: input.ownerId ?? null,
      zoho_account_id: input.zohoAccountId ?? null,
    },
  });
}
