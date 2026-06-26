import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Permissions that allow logging/viewing activities
const ALLOWED_ROLES = ['admin', 'regional_director', 'director', 'tae'];

function hasActivityPermission(role: string | undefined): boolean {
  if (!role) return false;
  return ALLOWED_ROLES.includes(role.toLowerCase());
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (session.user as any).role;
  if (!hasActivityPermission(role)) {
    return NextResponse.json({ error: 'Permission denied: LOG_RELATIONSHIP_ACTIVITY required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get('opportunity_id');

  if (!opportunityId) {
    return NextResponse.json({ error: 'opportunity_id query parameter is required' }, { status: 400 });
  }

  const activities = await prisma.repActivity.findMany({
    where: { opportunity_id: parseInt(opportunityId) },
    include: {
      user: { select: { id: true, full_name: true, email: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (session.user as any).role;
  if (!hasActivityPermission(role)) {
    return NextResponse.json({ error: 'Permission denied: LOG_RELATIONSHIP_ACTIVITY required' }, { status: 403 })
  }

  const { opportunity_id, activity_type, notes } = await request.json()

  if (!activity_type || !['call', 'email', 'meeting', 'note'].includes(activity_type)) {
    return NextResponse.json({ error: 'Invalid activity_type. Must be one of: call, email, meeting, note' }, { status: 400 })
  }

  if (!opportunity_id) {
    return NextResponse.json({ error: 'opportunity_id is required' }, { status: 400 })
  }
  
  const newActivity = await prisma.repActivity.create({
    data: {
      activity_type,
      notes: notes || null,
      opportunity: { connect: { id: opportunity_id } },
      user: { connect: { id: (session.user as any).id } }
    },
    include: {
      user: { select: { id: true, full_name: true, email: true } },
    },
  })
  return NextResponse.json(newActivity, { status: 201 })
}