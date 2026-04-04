'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { MockupRequestStatus } from "@prisma/client";

const updateMockupRequestStatusSchema = z.object({
  mockupRequestId: z.string(),
  status: z.nativeEnum(MockupRequestStatus),
});

export async function updateMockupRequestStatus(input: unknown) {
  const session = await requireSession();
  if (session.user.role !== 'admin' && session.user.role !== 'director') {
    throw new Error("Unauthorized: You do not have permission to update the mockup request status.");
  }
  
  const data = updateMockupRequestStatusSchema.parse(input);

  const updatedMockupRequest = await prisma.mockupRequest.update({
    where: {
      id: data.mockupRequestId,
    },
    data: {
      status: data.status,
    },
  });

  revalidatePath(`/orders/.*`, 'page');
  
  return updatedMockupRequest;
}
