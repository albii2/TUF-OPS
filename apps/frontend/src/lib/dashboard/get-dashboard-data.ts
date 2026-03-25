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

export async function getDashboardData(): Promise<DashboardData> {
  // For now, we fetch all opportunities. In the future, this would be scoped
  // to the current user and filtered by relevant date ranges.
  const opportunities = await prisma.opportunity.findMany({
    include: { organization: true },
  });

  const organizations = await prisma.organization.findMany();

  // Use selectors to shape the data
  const focusMetrics = selectFocusMetrics(opportunities);
  const nextActions = selectNextActions(opportunities);
  const pipelineSnapshot = selectPipelineSnapshot(opportunities);
  const revenueSummary = selectRevenueSummary(opportunities);
  const dealsNearClose = selectDealsNearClose(opportunities);
  const recentActivity = selectRecentActivity(opportunities);

  return {
    focusMetrics,
    nextActions,
    pipelineSnapshot,
    revenueSummary,
    dealsNearClose,
    recentActivity,
  };
}
