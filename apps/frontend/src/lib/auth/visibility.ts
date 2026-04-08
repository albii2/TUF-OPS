'use server'

import { prisma } from '@/lib/prisma'
import type { AppRole } from '@/types/auth'

type VisibilityUser = {
  id: string
  role: AppRole
}

/**
 * Retrieves opportunities based on the user's role and hierarchy.
 */
export async function getVisibleOpportunities(user: VisibilityUser) {
  const standardIncludes = { owner: true, organization: true }
  const userId = Number(user.id)

  if (Number.isNaN(userId)) {
    return []
  }

  if (user.role === 'admin') {
    return prisma.opportunity.findMany({ include: standardIncludes })
  }

  if (user.role === 'director') {
    const subordinateIds = await prisma.user
      .findMany({
        where: { managerId: userId },
        select: { id: true },
      })
      .then((users) => users.map((u) => u.id))

    const visibleOwnerIds = [userId, ...subordinateIds]

    return prisma.opportunity.findMany({
      where: {
        OR: [{ ownerId: { in: visibleOwnerIds } }, { ownerId: null }],
      },
      include: standardIncludes,
    })
  }

  return prisma.opportunity.findMany({
    where: { ownerId: userId },
    include: standardIncludes,
  })
}
