import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { opportunity_id, estimated_revenue, vendor_cost, gross_profit } = await request.json()

  const newOrder = await prisma.uniformOrder.create({
    data: {
      opportunity: { connect: { id: opportunity_id } },
      status: 'Pending',
      estimated_revenue,
      vendor_cost,
      gross_profit,
    },
  })

  // Log activity
  await prisma.repActivity.create({
    data: {
      activity_type: 'Uniform Order Created',
      notes: `Uniform order created for opportunity ID: ${opportunity_id}`,
      opportunity: { connect: { id: opportunity_id } },
      user: { connect: { id: (session.user as any).id } },
    },
  })

  return NextResponse.json(newOrder)
}
