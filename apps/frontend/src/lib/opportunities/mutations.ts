'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth/session'
import { Prisma, OpportunityStage } from '@prisma/client'
import { canTransitionOpportunityStage, getAllowedOpportunityStageTransitions } from '@/lib/workflow/transitions'
import { isTerminalOpportunityStage } from '@/lib/workflow/stage-utils'


async function recordOpportunityEvent(params: {
  opportunityId: number
  actorUserId: number
  eventType: 'stage_changed' | 'owner_changed'
  fromStage?: OpportunityStage | null
  toStage?: OpportunityStage | null
  metadata?: Record<string, unknown>
}) {
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO "opportunity_events" ("opportunity_id", "actor_user_id", "event_type", "from_stage", "to_stage", "metadata")
               VALUES (${params.opportunityId}, ${params.actorUserId}, CAST(${params.eventType} AS "OpportunityEventType"), ${params.fromStage ?? null}, ${params.toStage ?? null}, ${params.metadata ? JSON.stringify(params.metadata) : null}::jsonb)`,
  )
}

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

  const existingOpportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true, stage: true, nextStep: true, nextStepDueDate: true },
  })

  if (!existingOpportunity) {
    throw new Error('Opportunity not found.')
  }

  if (input.stage && !canTransitionOpportunityStage(existingOpportunity.stage, input.stage)) {
    const allowedTransitions = getAllowedOpportunityStageTransitions(existingOpportunity.stage)
    throw new Error(
      `Invalid stage transition from ${existingOpportunity.stage} to ${input.stage}. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}.`,
    )
  }


  const targetStage = input.stage ?? existingOpportunity.stage
  const nextStepValue = input.nextStep === undefined ? existingOpportunity.nextStep : input.nextStep

  if (!isTerminalOpportunityStage(targetStage) && !nextStepValue?.trim()) {
    throw new Error('Next step is required for non-terminal opportunities.')
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

  if (input.stage && input.stage !== existingOpportunity.stage) {
    await recordOpportunityEvent({
      opportunityId,
      actorUserId: userId,
      eventType: 'stage_changed',
      fromStage: existingOpportunity.stage,
      toStage: input.stage,
      metadata: {
        source: 'updateOpportunityWorkflow',
      },
    })
  }

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

  if (existingOpportunity.ownerId !== input.ownerId) {
    await recordOpportunityEvent({
      opportunityId: input.id,
      actorUserId: userId,
      eventType: 'owner_changed',
      metadata: {
        previousOwnerId: existingOpportunity.ownerId,
        nextOwnerId: input.ownerId ?? null,
        source: 'updateOpportunityOwner',
      },
    })
  }

  revalidatePath(`/opportunities/${input.id}`)
  revalidatePath('/opportunities')
  revalidatePath('/dashboard')

  return updated
}
