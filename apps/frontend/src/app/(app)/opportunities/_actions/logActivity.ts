'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ActivityType } from "@prisma/client";

export const logActivitySchema = z.object({
  opportunityId: z.number(),
  contactId: z.number().optional(),
  type: z.nativeEnum(ActivityType),
  notes: z.string().min(1, "Notes are required"),
});

export async function logActivity(input: unknown) {
  const session = await requireSession();
  const data = logActivitySchema.parse(input);

  const activity = await prisma.activity.create({
    data: {
      ...data,
      userId: parseInt(session.user.id),
    },
  });

  // Also update the last_contact_date on the opportunity
  await prisma.opportunity.update({
    where: { id: data.opportunityId },
    data: { last_contact_date: new Date() },
  });

  revalidatePath(`/opportunities/${data.opportunityId}`);

  return activity;
}
