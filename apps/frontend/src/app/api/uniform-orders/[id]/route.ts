import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

function mapOrderStatus(stage: string): 'pending' | 'ready_for_ops' | 'completed' | 'blocked' {
  switch (stage) {
    case 'closed_won':
      return 'ready_for_ops'
    case 'closed_lost':
      return 'blocked'
    case 'invoice':
      return 'pending'
    default:
      return 'pending'
  }
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const opportunityId = Number(params.id)
  if (Number.isNaN(opportunityId)) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      organization: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  })

  if (!opportunity) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({
    order: {
      id: opportunity.id,
      opportunityId: opportunity.id,
      opportunityName: opportunity.name,
      organizationName: opportunity.organization?.name ?? 'Unassigned Organization',
      ownerName: opportunity.owner?.name ?? 'Unassigned',
      estimatedRevenue: Number(opportunity.estimated_value ?? 0),
      status: mapOrderStatus(opportunity.stage),
      stage: opportunity.stage,
      nextStep: opportunity.nextStep,
      nextStepDueDate: opportunity.nextStepDueDate,
      rosterUploads: [],
      orderItems: [],
      updatedAt: opportunity.updated_at,
    },
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const opportunityId = Number(params.id)
  if (Number.isNaN(opportunityId)) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
  }

  const { status, next_step } = await request.json()

  const stage = status === 'completed' ? 'closed_won' : status === 'blocked' ? 'closed_lost' : 'invoice'

  const updated = await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      stage,
      nextStep: typeof next_step === 'string' ? next_step : undefined,
    },
  })

  return NextResponse.json({
    order: {
      id: updated.id,
      status: mapOrderStatus(updated.stage),
      stage: updated.stage,
      nextStep: updated.nextStep,
      updatedAt: updated.updated_at,
    },
  })
}
