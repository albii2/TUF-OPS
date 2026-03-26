import { prisma } from "@/lib/prisma";
import { 
  selectFocusMetrics,
  selectNextActions,
  selectPipelineSnapshot,
  selectRevenueSummary,
  selectDealsNearClose,
  selectRecentActivity
} from "./selectors";
import { DashboardData } from "@/types/dashboard";
import { requireSession } from "@/lib/auth/session";

export async function getDashboardData(): Promise<DashboardData> {
  const session = await requireSession();
  const user = session.user;

  const opportunities = await prisma.opportunity.findMany({
    include: { organization: true, owner: true },
  });

  const organizations = await prisma.organization.findMany({
    include: { owner: true },
  });

  const focusMetrics = selectFocusMetrics(opportunities, user);
  const nextActions = selectNextActions(opportunities, user);
  const pipelineSnapshot = selectPipelineSnapshot(opportunities, user);
  const revenueSummary = selectRevenueSummary(opportunities, user);
  const dealsNearClose = selectDealsNearClose(opportunities, user);
  const recentActivity = selectRecentActivity(opportunities, user);

  return {
    focusMetrics,
    nextActions,
    pipelineSnapshot,
    revenueSummary,
    dealsNearClose,
    recentActivity,
  };
}
