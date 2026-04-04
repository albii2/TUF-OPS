'use server'

import { updateOpportunitySchema } from '@/lib/validation/opportunity'
import { prisma } from '@/lib/prisma' // Corrected from db
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { validateAssignment } from '@/lib/opportunities/mutations'

export async function updateOpportunity(input: unknown) {
  const session = await requireSession()
  const data = updateOpportunitySchema.parse(input)

  const opp = await prisma.opportunity.findUnique({
    where: { id: data.id }
  })

  if (!opp) throw new Error('Opportunity not found.')

  if (data.ownerId !== null && data.ownerId !== undefined) {
    await validateAssignment(session.user, data.ownerId)
  }

  const updated = await prisma.opportunity.update({
    where: { id: data.id }, 
    data: {
      name: data.name,
      ownerId: data.ownerId,
      stage: data.stage,
      estimated_value: data.estimatedValue,
      close_date: data.closeDate,
      nextStep: data.nextStep,
      nextStepDueDate: data.nextStepDueDate,
    }
  })
  
  revalidatePath(`/opportunities/${updated.id}`);
  revalidatePath(`/opportunities`);
  revalidatePath("/dashboard");

  return updated
}
