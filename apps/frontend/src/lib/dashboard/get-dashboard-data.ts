import { prisma } from "@/lib/prisma";
import { DashboardData } from "@/types/dashboard";
import { requireSession } from "@/lib/auth/session";
import { getTeamOpportunityFilter } from "@/lib/auth/visibility";
import { OpportunityStage } from "@prisma/client";

import { Session } from "next-auth";

export async function getDashboardData(session: Session): Promise<DashboardData> {
  const userId = session.user.id;

  const where = session.user.role === 'admin' ? {} : await getTeamOpportunityFilter(userId);

  const [totalOpportunities, totalValue, opportunitiesByStage, dealsNearClose, ownerLeaderboard, needsAction, needsNextStep, needsUpdate] = await Promise.all([
    prisma.opportunity.count({ where }),
    prisma.opportunity.aggregate({
      _sum: { estimated_value: true },
      where,
    }),
    prisma.opportunity.groupBy({
      by: ['stage'],
      _count: { id: true },
      where,
    }),
    prisma.opportunity.findMany({
        where: { ...where, stage: OpportunityStage.invoice },
        orderBy: { estimated_value: 'desc' },
        take: 5,
        include: { program: true, owner: true }
    }),
    prisma.opportunity.groupBy({
        by: ['ownerId'],
        _count: { id: true },
        where: { ...where, ownerId: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 5
    }),
    prisma.opportunity.count({
        where: { ...where, nextStepDueDate: { lt: new Date() }, stage: { notIn: [OpportunityStage.closed_won, OpportunityStage.closed_lost] } }
    }),
    prisma.opportunity.count({
        where: { ...where, nextStep: null, stage: { notIn: [OpportunityStage.closed_won, OpportunityStage.closed_lost] } }
    }),
    prisma.opportunity.count({
        where: { ...where, updated_at: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, stage: { notIn: [OpportunityStage.closed_won, OpportunityStage.closed_lost] } }
    }),
  ]);

  const owners = await prisma.user.findMany({
      where: { id: { in: ownerLeaderboard.map(o => o.ownerId!) } },
      select: { id: true, name: true }
  });

  return {
    metrics: {
        needsAction,
        needsNextStep,
        needsUpdate,
    },
    snapshot: {
        totalOpportunities,
        totalValue: totalValue._sum.estimated_value?.toNumber() ?? 0,
        byStage: opportunitiesByStage.reduce((acc, { stage, _count }) => ({ ...acc, [stage]: _count.id }), {} as any)
    },
    deals: dealsNearClose.map(d => ({ ...d, value: d.estimated_value?.toNumber() ?? 0, closingDate: d.close_date, opportunityName: d.name, programName: d.program?.name ?? ''})),
    owners: ownerLeaderboard.map(o => ({ 
        ownerId: o.ownerId!,
        count: o._count.id,
        ownerName: owners.find(u => u.id === o.ownerId)?.name ?? 'Unknown'
    })),
  };
}
