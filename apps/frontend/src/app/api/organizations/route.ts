import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const skip = (page - 1) * limit

  const organizations = await prisma.organization.findMany({
    skip,
    take: limit,
  })

  const total = await prisma.organization.count()

  return NextResponse.json({
    organizations,
    total,
    page,
    limit,
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, zoho_account_id } = await request.json()

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  try {
    const organization = await prisma.organization.create({
      data: {
        name,
        zoho_account_id,
      },
    })

    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error("Failed to create organization:", error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
