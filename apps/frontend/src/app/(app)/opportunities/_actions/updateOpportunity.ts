'use server'

import { updateOpportunitySchema } from '@/lib/validation/opportunity'
import { prisma } from '@/lib/prisma' // Corrected from db
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { validateAssignment } from '@/lib/opportunities/mutations'

export async function updateOpportunity(input: unknown) {
  const session = await requireSession()
  const parsed = updateOpportunitySchema.parse(input)
  const parsedOpportunityId = parseInt(parsed.id, 10)
  const parsedOwnerId =
    parsed.ownerId && parsed.ownerId.trim() !== ''
      ? parseInt(parsed.ownerId, 10)
      : null;

  if (Number.isNaN(parsedOpportunityId)) {
    throw new Error('Invalid opportunity id.')
  }

  if (parsedOwnerId !== null && Number.isNaN(parsedOwnerId)) {
    throw new Error('Invalid owner id.')
  }

  const opp = await prisma.opportunity.findUnique({
    where: { id: parsedOpportunityId } // Corrected for integer ID
  })

  if (!opp) return null

  if (parsedOwnerId !== null) {
    const ownerExists = await prisma.user.findUnique({
      where: { id: parsedOwnerId },
      select: { id: true },
    })

    if (!ownerExists) {
      throw new Error('Owner not found.')
    }
  }

  await validateAssignment(session.user, parsedOwnerId)

  const updated = await prisma.opportunity.update({
    where: { id: parsedOpportunityId }, // Corrected for integer ID
    data: {
      name: parsed.name,
      ownerId: parsedOwnerId, // Corrected for integer ID
      stage: parsed.stage,
      estimated_value: parsed.estimatedValue, // Corrected field name
      close_date: parsed.closeDate // Corrected field name
    }
  })
  
  revalidatePath(`/opportunities/${updated.id}`);
  revalidatePath(`/opportunities`);
  revalidatePath("/dashboard");

  return updated
}
