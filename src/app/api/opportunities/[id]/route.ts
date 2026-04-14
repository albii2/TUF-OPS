import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: parseInt(params.id) },
    include: { 
      organization: true, 
      team: true, 
      opportunity_notes: { include: { user: { select: { full_name: true } } } }, 
      rep_activities: { include: { user: { select: { full_name: true } } } }
    }
  })
  if (!opportunity) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
  }
  return NextResponse.json(opportunity)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const opportunityId = Number(params.id)
  if (Number.isNaN(opportunityId)) {
    return NextResponse.json({ error: 'Invalid opportunity id' }, { status: 400 })
  }

  const body = await request.json()
  const existingOpportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true, stage: true },
  })

  // Construct data object only with fields present in the request body
  const dataToUpdate: any = {};
  if (body.name) dataToUpdate.name = body.name;
  if (body.stage) dataToUpdate.stage = body.stage;
  if (body.estimated_value) dataToUpdate.estimated_value = body.estimated_value;
  if (body.probability) dataToUpdate.probability = body.probability;
  if (body.last_contact_date) dataToUpdate.last_contact_date = body.last_contact_date;
  if (body.next_action_date) dataToUpdate.next_action_date = body.next_action_date;
  if (body.organization_id) {
    dataToUpdate.organization = { connect: { id: body.organization_id } };
  }
  if (body.team_id) {
    dataToUpdate.team = { connect: { id: body.team_id } };
  }

  const opportunity = await prisma.opportunity.update({
    where: { id: parseInt(params.id) },
    data: dataToUpdate
  })
  return NextResponse.json(opportunity)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.opportunity.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ message: 'Opportunity deleted' })
}