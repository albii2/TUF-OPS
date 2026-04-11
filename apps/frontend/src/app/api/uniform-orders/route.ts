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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const opportunities = await prisma.opportunity.findMany({
    where: { stage: { in: ['invoice', 'closed_won'] } },
    include: {
      organization: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { updated_at: 'desc' },
  })

  const orders = opportunities.map((opp) => ({
    id: opp.id,
    opportunityId: opp.id,
    opportunityName: opp.name,
    organizationName: opp.organization?.name ?? 'Unassigned Organization',
    ownerName: opp.owner?.name ?? 'Unassigned',
    estimatedRevenue: Number(opp.estimated_value ?? 0),
    status: mapOrderStatus(opp.stage),
    stage: opp.stage,
    updatedAt: opp.updated_at,
    nextStep: opp.nextStep,
    nextStepDueDate: opp.nextStepDueDate,
  }))

  return NextResponse.json({ orders })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { opportunity_id, next_step } = await request.json()
  const opportunityId = Number(opportunity_id)

  if (Number.isNaN(opportunityId)) {
    return NextResponse.json({ error: 'Invalid opportunity_id' }, { status: 400 })
  }

  const updated = await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      stage: 'invoice',
      nextStep: next_step?.trim() || 'Prepare order handoff package for operations.',
    },
    include: {
      organization: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(
    {
      order: {
        id: updated.id,
        opportunityId: updated.id,
        opportunityName: updated.name,
        organizationName: updated.organization?.name ?? 'Unassigned Organization',
        estimatedRevenue: Number(updated.estimated_value ?? 0),
        status: mapOrderStatus(updated.stage),
        stage: updated.stage,
      },
    },
    { status: 201 },
  )
}
