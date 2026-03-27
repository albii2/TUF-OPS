'use server'

import { updateOpportunitySchema } from '@/lib/validation/opportunity'
import { prisma } from '@/lib/prisma' // Corrected from db
import { revalidatePath } from 'next/cache'

export async function updateOpportunity(input: unknown) {
  const parsed = updateOpportunitySchema.parse(input)

  const opp = await prisma.opportunity.findUnique({
    where: { id: parseInt(parsed.id, 10) } // Corrected for integer ID
  })

  if (!opp) return null

  const updated = await prisma.opportunity.update({
    where: { id: parseInt(parsed.id, 10) }, // Corrected for integer ID
    data: {
      name: parsed.name,
      ownerId: parsed.ownerId ? parseInt(parsed.ownerId, 10) : null, // Corrected for integer ID
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
