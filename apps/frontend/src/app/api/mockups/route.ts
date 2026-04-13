import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { opportunity_id, team_colors, logo_urls, notes } = await request.json()
  
  const newMockup = await prisma.mockup.create({
    data: {
      opportunity: { connect: { id: opportunity_id } },
      status: 'Requested',
      team_colors,
      logo_urls,
      notes
    }
  })

  // Log activity
  if (session.user && (session.user as any).id) {
    await prisma.repActivity.create({
      data: {
        activity_type: 'Mockup Requested',
        notes: `Mockup requested for opportunity ID: ${opportunity_id}`,
        opportunity: { connect: { id: opportunity_id } },
        user: { connect: { id: (session.user as any).id } }
      }
    })
  }

  return NextResponse.json(newMockup)
}