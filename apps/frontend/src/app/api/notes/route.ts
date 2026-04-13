import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { opportunity_id, note } = await request.json()
  
  const newNote = await prisma.opportunityNote.create({
    data: {
      note,
      opportunity: { connect: { id: opportunity_id } },
      user: { connect: { id: (session.user as any).id } }
    }
  })
  return NextResponse.json(newNote)
}