"use server";

import { revalidatePath } from "next/cache";
import { updateProgram } from "@/lib/programs/mutations";
import { updateProgramSchema } from "@/lib/programs/validation";
import { ProgramStatus } from '@prisma/client';

export async function updateProgramAction(input: {
  id: number;
  name: string;
  status: ProgramStatus;
  ownerId?: number | null;
  zohoAccountId?: string | null;
}) {
  const parsed = updateProgramSchema.parse({
    ...input,
    id: String(input.id), // Zod schema expects a string
    ownerId: String(input.ownerId ?? ""),
  });

  await updateProgram({
    id: input.id,
    name: parsed.name,
    status: parsed.status,
    ownerId: input.ownerId ?? null,
    zohoAccountId: parsed.zohoAccountId ?? null,
  });

  revalidatePath(`/programs/${parsed.id}`);
  revalidatePath(`/programs`);
  revalidatePath("/dashboard");
}
