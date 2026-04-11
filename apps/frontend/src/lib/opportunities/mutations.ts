'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth/session'
import { OpportunityStage } from '@prisma/client'
import { canTransitionOpportunityStage } from '@/lib/workflow/transitions'

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

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
  })

  if (!opportunity) {
    throw new Error('Opportunity not found.')
  }

  if (session.user.role !== 'admin' && opportunity.ownerId !== userId) {
    throw new Error('Unauthorized.')
  }

  if (input.stage && !canTransitionOpportunityStage(opportunity.stage, input.stage)) {
    throw new Error(`Invalid stage transition from ${opportunity.stage} to ${input.stage}`)
  }

  if (input.stage && input.stage !== OpportunityStage.closed_won && input.stage !== OpportunityStage.closed_lost && !input.nextStep) {
    throw new Error('Next step is required for active opportunities.')
  }

  const updated = await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      stage: input.stage,
      nextStep: input.nextStep === undefined ? existingOpportunity.nextStep : input.nextStep ?? null,
      nextStepDueDate:
        input.nextStepDueDate === undefined ? existingOpportunity.nextStepDueDate : input.nextStepDueDate ?? null,
    },
  })

  // --- Event Logging ---
  if (input.stage && input.stage !== opportunity.stage) {
    await prisma.opportunityEvent.create({
      data: {
        opportunityId,
        actorUserId: userId,
        eventType: 'stage_changed',
        fromStage: opportunity.stage,
        toStage: input.stage,
      },
    })
  }

  if (input.nextStep !== opportunity.nextStep) {
      await prisma.opportunityEvent.create({
          data: {
              opportunityId,
              actorUserId: userId,
              eventType: "next_step_set",
              metadata: { old: opportunity.nextStep, new: input.nextStep },
          }
      })
  }

  if (String(input.nextStepDueDate) !== String(opportunity.nextStepDueDate)) {
       await prisma.opportunityEvent.create({
          data: {
              opportunityId,
              actorUserId: userId,
              eventType: "due_date_set",
              metadata: { old: opportunity.nextStepDueDate, new: input.nextStepDueDate },
          }
      })
  }
  // ---------------------

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
    const subordinateIds = subordinates.map((s: {id: number}) => s.id)
    const allowedOwnerIds = [userId, ...subordinateIds]

    if (input.ownerId && !allowedOwnerIds.includes(input.ownerId)) {
      throw new Error('Unauthorized: Directors can only assign to themselves or their direct reports.')
    }
  }

  const existingOpportunity = await prisma.opportunity.findUnique({
    where: { id: input.id },
    select: { id: true, ownerId: true },
  })

  if (!existingOpportunity) {
    throw new Error('Opportunity not found.')
  }

  const updated = await prisma.opportunity.update({
    where: { id: input.id },
    data: { ownerId: input.ownerId },
  })

  await prisma.opportunityEvent.create({
    data: {
      opportunityId: input.id,
      actorUserId: userId,
      eventType: "owner_changed",
      metadata: { newOwnerId: input.ownerId },
    },
  })

  revalidatePath(`/opportunities/${input.id}`)
  revalidatePath('/opportunities')
  revalidatePath('/dashboard')

  return updated
}
