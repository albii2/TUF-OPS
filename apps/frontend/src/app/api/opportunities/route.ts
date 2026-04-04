import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const opportunities = await prisma.opportunity.findMany({
    orderBy: {
      created_at: 'desc'
    }
  })

  return NextResponse.json({ opportunities })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, stage, estimated_value, probability, organization_id } = await request.json()

  if (!name || !stage || !organization_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        stage,
        estimated_value,
        probability,
        organization: {
          connect: { id: organization_id },
        },
      },
    })
    return NextResponse.json(opportunity, { status: 201 })
  } catch (error) {
    console.error("Failed to create opportunity:", error)
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 })
  }
}
