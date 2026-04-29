import { reportsSummary } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';

export function getReportsSummary() {
  if (DATA_MODE !== 'mock') {
    return {
      weeklySummary: { pipelineAdded: 0, closedWon: 0, newOrganizations: 0, blockedOrders: 0 },
      monthlySummary: { pipelineTotal: 0, closedWon: 0, winRate: 0, averageDeal: 0 },
      lanePerformance: [],
      repPerformance: [],
    };
  }
  return reportsSummary;
}
