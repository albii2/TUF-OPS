import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { OpportunityStage } from '@prisma/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const opportunities = await prisma.opportunity.findMany({
    include: {
      organization: true,
      owner: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ opportunities })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, stage = 'lead', estimated_value = 0, probability, organization_id } = await request.json()

  if (!name || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!Object.values(OpportunityStage).includes(stage)) {
    return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
  }

  try {
    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        stage,
        estimated_value,
        probability,
        organization: { connect: { id: Number(organization_id) } },
        owner: { connect: { id: Number(session.user.id) } },
      },
      include: { organization: true },
    })
    return NextResponse.json(opportunity, { status: 201 })
  } catch (error) {
    console.error('Failed to create opportunity:', error)
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 })
  }
}
