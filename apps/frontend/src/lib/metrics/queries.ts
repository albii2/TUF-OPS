import { prisma } from "@/lib/prisma";
import { OpportunityStage } from "@prisma/client";

export async function getMyDashboardMetrics(userId: string) {
  const myOppCount = await prisma.opportunity.count({
    where: { ownerId: parseInt(userId) },
  });

  const myProgramCount = await prisma.program.count({
    where: { ownerId: parseInt(userId) },
  });

  const myStaleCount = await prisma.opportunity.count({
    where: {
      ownerId: parseInt(userId),
      updated_at: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      stage: { notIn: [OpportunityStage.closed_won, OpportunityStage.closed_lost] },
    },
  });

  const myMissingNextStepCount = await prisma.opportunity.count({
    where: {
      ownerId: parseInt(userId),
      nextStep: null,
      stage: { notIn: [OpportunityStage.closed_won, OpportunityStage.closed_lost] },
    },
  });

  const myOverdueNextStepCount = await prisma.opportunity.count({
    where: {
      ownerId: parseInt(userId),
      nextStepDueDate: { lt: new Date() },
      stage: { notIn: [OpportunityStage.closed_won, OpportunityStage.closed_lost] },
    },
  });

  return {
    myOppCount,
    myProgramCount,
    myStaleCount,
    myMissingNextStepCount,
    myOverdueNextStepCount,
  };
}
