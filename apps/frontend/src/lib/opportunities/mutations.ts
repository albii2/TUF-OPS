'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth/session'
import { OpportunityStage } from '@prisma/client'

export async function updateOpportunityWorkflow(input: {
  id: string
  stage?: OpportunityStage
  nextStep?: string | null
  nextStepDueDate?: Date | null
}) {
  const session = await requireSession()
  const opportunityId = Number(input.id)
  const userId = Number(session.user.id)

  if (Number.isNaN(opportunityId) || Number.isNaN(userId)) {
    throw new Error('Invalid opportunity or user identifier.')
  }

  if (!['admin', 'director', 'rep'].includes(session.user.role)) {
    throw new Error('Unauthorized.')
  }

  const updated = await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      stage: input.stage,
      nextStep: input.nextStep ?? null,
      nextStepDueDate: input.nextStepDueDate ?? null,
    },
  })

  revalidatePath(`/opportunities/${opportunityId}`)
  revalidatePath('/opportunities')
  revalidatePath('/dashboard')

  return updated
}

export async function updateOpportunityOwner(input: {
  id: number
  ownerId?: number | null
}) {
  const session = await requireSession()

  const userRole = session.user.role
  const userId = Number(session.user.id)

  if (Number.isNaN(userId)) {
    throw new Error('Invalid session user id.')
  }

  if (userRole === 'rep') {
    throw new Error('Unauthorized: Reps cannot reassign opportunities.')
  }

  if (userRole === 'director') {
    const subordinates = await prisma.user.findMany({
      where: { managerId: userId },
      select: { id: true },
    })
    const subordinateIds = subordinates.map((s) => s.id)
    const allowedOwnerIds = [userId, ...subordinateIds]

    if (input.ownerId && !allowedOwnerIds.includes(input.ownerId)) {
      throw new Error('Unauthorized: Directors can only assign to themselves or their direct reports.')
    }
  }

  const updated = await prisma.opportunity.update({
    where: { id: input.id },
    data: { ownerId: input.ownerId },
  })

  revalidatePath(`/opportunities/${input.id}`)
  revalidatePath('/opportunities')
  revalidatePath('/dashboard')

  return updated
}
