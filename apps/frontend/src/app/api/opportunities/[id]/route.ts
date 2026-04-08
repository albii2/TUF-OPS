import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { OpportunityStage } from '@prisma/client'

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

  const body = await request.json()

  const dataToUpdate: {
    name?: string
    stage?: OpportunityStage
    estimated_value?: number
    probability?: number
    last_contact_date?: Date
    nextStepDueDate?: Date
    organization?: { connect: { id: number } }
  } = {}

  if (body.name) dataToUpdate.name = body.name
  if (body.stage && Object.values(OpportunityStage).includes(body.stage)) dataToUpdate.stage = body.stage
  if (body.estimated_value !== undefined) dataToUpdate.estimated_value = Number(body.estimated_value)
  if (body.probability !== undefined) dataToUpdate.probability = Number(body.probability)
  if (body.last_contact_date) dataToUpdate.last_contact_date = new Date(body.last_contact_date)
  if (body.next_step_due_date) dataToUpdate.nextStepDueDate = new Date(body.next_step_due_date)
  if (body.organization_id) dataToUpdate.organization = { connect: { id: Number(body.organization_id) } }

  const opportunity = await prisma.opportunity.update({
    where: { id: Number(params.id) },
    data: dataToUpdate,
  })

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
