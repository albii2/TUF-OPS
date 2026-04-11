import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { archiveTrelloCard, createMockupTrelloCard, getTrelloCardIdFromUrl } from '@/lib/trello'

function isAuthorizedRole(role: string | undefined) {
  return role === 'admin' || role === 'director' || role === 'rep'
}

const RESTORE_STAGES = ['lead', 'contacted', 'sample', 'invoice', 'closed_won', 'closed_lost'] as const
type RestoreStage = (typeof RESTORE_STAGES)[number]

function isRestoreStage(value: string): value is RestoreStage {
  return RESTORE_STAGES.includes(value as RestoreStage)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isAuthorizedRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { opportunity_id, teamName, jerseyNumber, primaryColor, secondaryColor, tertiaryColor, notes } =
      await request.json()

    if (!opportunity_id || !teamName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: Number(opportunity_id) },
      include: { organization: true },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    const description = [
      `Opportunity: ${opportunity.name}`,
      `Program: ${opportunity.organization?.name ?? 'N/A'}`,
      `Requested by user ID: ${session.user.id}`,
      `Team: ${teamName}`,
      `Jersey Number: ${jerseyNumber ?? 'N/A'}`,
      `Primary Color: ${primaryColor ?? 'N/A'}`,
      `Secondary Color: ${secondaryColor ?? 'N/A'}`,
      `Tertiary Color: ${tertiaryColor ?? 'N/A'}`,
      `Notes: ${notes ?? 'N/A'}`,
    ].join('\n')

    const card = await createMockupTrelloCard({
      name: `Mockup Request: ${teamName}`,
      description,
    })

    await prisma.opportunity.update({
      where: { id: opportunity.id },
      data: {
        stage: 'mockup',
        nextStep: `Mockup requested (Trello card: ${card.url})`,
      },
    })

    return NextResponse.json({
      success: true,
      card,
      opportunityId: opportunity.id,
    })
  } catch (error) {
    console.error('mockup request failed', error)
    return NextResponse.json({ error: 'Failed to request mockup' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isAuthorizedRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { opportunity_id, restore_stage = 'contacted' } = await request.json()

    if (!isRestoreStage(restore_stage)) {
      return NextResponse.json({ error: 'Invalid restore_stage' }, { status: 400 })
    }

    if (!opportunity_id) {
      return NextResponse.json({ error: 'Missing opportunity_id' }, { status: 400 })
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: Number(opportunity_id) },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    const cardUrlMatch = opportunity.nextStep?.match(/https:\/\/trello\.com\/c\/[^\s)]+/)
    const cardId = getTrelloCardIdFromUrl(cardUrlMatch?.[0])

    if (cardId) {
      await archiveTrelloCard(cardId)
    }

    await prisma.opportunity.update({
      where: { id: opportunity.id },
      data: {
        stage: restore_stage,
        nextStep: null,
      },
    })

    return NextResponse.json({
      success: true,
      opportunityId: opportunity.id,
      archivedCardId: cardId,
    })
  } catch (error) {
    console.error('remove mockup request failed', error)
    return NextResponse.json({ error: 'Failed to remove mockup request' }, { status: 500 })
  }
}
