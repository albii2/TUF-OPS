import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { opportunity_id, activity_type, notes } = await request.json()
  
  const newActivity = await prisma.repActivity.create({
    data: {
      activity_type,
      notes,
      opportunity: opportunity_id ? { connect: { id: opportunity_id } } : undefined,
      user: { connect: { id: (session.user as any).id } }
    }
  })
  return NextResponse.json(newActivity)
}