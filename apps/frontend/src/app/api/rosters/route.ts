import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { uniform_order_id } = await request.json()

  // In a real implementation, we would handle the file upload to a storage service (S3, etc.)
  // and get a file URL. For now, we'll just simulate this.
  const file_url = `https://fake-storage.com/roster-${uniform_order_id}-${Date.now()}.csv`

  const newRosterUpload = await prisma.rosterUpload.create({
    data: {
      uniform_order: { connect: { id: uniform_order_id } },
      status: 'Uploaded',
      file_url,
    },
  })

  // Log activity
  await prisma.repActivity.create({
    data: {
      activity_type: 'Roster Uploaded',
      notes: `Roster uploaded for uniform order ID: ${uniform_order_id}`,
      user: { connect: { id: (session.user as any).id } },
    },
  })

  return NextResponse.json(newRosterUpload)
}
