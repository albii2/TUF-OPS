import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [pipeline, organizationStatuses, totalEstimatedValue] = await Promise.all([
    prisma.opportunity.groupBy({ by: ['stage'], _count: { id: true } }),
    prisma.organization.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.opportunity.aggregate({ _sum: { estimated_value: true } }),
  ])

  return NextResponse.json({
    pipeline,
    organizationStatuses,
    totalEstimatedValue: totalEstimatedValue._sum.estimated_value?.toNumber() ?? 0,
  })
}
