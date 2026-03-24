import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await request.json()

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt((session.user as any).id) },
      data: { full_name: name },
    })
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
