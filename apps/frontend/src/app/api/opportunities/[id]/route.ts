import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
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

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: Number(params.id) },
    include: {
      organization: true,
      owner: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  if (!opportunity) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
  }

  return NextResponse.json(opportunity)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const opportunityId = Number(params.id)
  if (Number.isNaN(opportunityId)) {
    return NextResponse.json({ error: 'Invalid opportunity id' }, { status: 400 })
  }

  const body = await request.json()
  const existingOpportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true, stage: true, nextStep: true },
  })

  if (!existingOpportunity) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
  }

  const dataToUpdate: {
    name?: string
    stage?: OpportunityStage
    estimated_value?: number
    probability?: number
    last_contact_date?: Date
    nextStep?: string | null
    nextStepDueDate?: Date
    organization?: { connect: { id: number } }
  } = {}

  if (body.name) dataToUpdate.name = body.name
  if (body.stage && Object.values(OpportunityStage).includes(body.stage)) {
    if (!canTransitionOpportunityStage(existingOpportunity.stage, body.stage)) {
      const allowedTransitions = getAllowedOpportunityStageTransitions(existingOpportunity.stage)
      return NextResponse.json(
        {
          error: `Invalid stage transition from ${existingOpportunity.stage} to ${body.stage}.`,
          allowedTransitions,
        },
        { status: 400 },
      )
    }

    dataToUpdate.stage = body.stage
  }
  if (body.estimated_value !== undefined) dataToUpdate.estimated_value = Number(body.estimated_value)
  if (body.probability !== undefined) dataToUpdate.probability = Number(body.probability)
  if (body.last_contact_date) dataToUpdate.last_contact_date = new Date(body.last_contact_date)
  if (body.next_step !== undefined) dataToUpdate.nextStep = body.next_step ? String(body.next_step) : null
  if (body.next_step_due_date) dataToUpdate.nextStepDueDate = new Date(body.next_step_due_date)
  if (body.organization_id) dataToUpdate.organization = { connect: { id: Number(body.organization_id) } }


  const targetStage = dataToUpdate.stage ?? existingOpportunity.stage
  const nextStepValue = dataToUpdate.nextStep === undefined ? existingOpportunity.nextStep : dataToUpdate.nextStep

  if (!isTerminalOpportunityStage(targetStage) && !nextStepValue?.trim()) {
    return NextResponse.json(
      { error: 'next_step is required for non-terminal opportunities.' },
      { status: 400 },
    )
  }

  const opportunity = await prisma.opportunity.update({
    where: { id: opportunityId },
    data: dataToUpdate,
  })

  if (dataToUpdate.stage && dataToUpdate.stage !== existingOpportunity.stage) {
    const actorUserId = Number(session.user.id)
    if (!Number.isNaN(actorUserId)) {
      await recordOpportunityEvent({
        opportunityId,
        actorUserId,
        eventType: 'stage_changed',
        fromStage: existingOpportunity.stage,
        toStage: dataToUpdate.stage,
        metadata: {
          source: 'api/opportunities/[id]#PUT',
        },
      })
    }
  }

  return NextResponse.json(opportunity)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.opportunity.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ message: 'Opportunity deleted' })
}
