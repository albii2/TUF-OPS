import { opportunities, type Opportunity, opportunityStages, type OpportunityStage, revenueLanes, type RevenueLane } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';

export type OpportunityListParams = {
  search?: string;
  stage?: 'ALL' | OpportunityStage;
  lane?: 'ALL' | RevenueLane;
  rep?: string;
  sport?: string;
};

export function listOpportunities(params: OpportunityListParams = {}): Opportunity[] {
  if (DATA_MODE !== 'mock') return [];

  return opportunities.filter((opp) => {
    const matchesSearch = (params.search ?? '').trim()
      ? [opp.title, opp.organizationName].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase())
      : true;
    const matchesStage = !params.stage || params.stage === 'ALL' || opp.stage === params.stage;
    const matchesLane = !params.lane || params.lane === 'ALL' || opp.lane === params.lane;
    const matchesRep = !params.rep || params.rep === 'ALL' || opp.assignedRep === params.rep;
    const matchesSport = !params.sport || params.sport === 'ALL' || opp.sport === params.sport;
    return matchesSearch && matchesStage && matchesLane && matchesRep && matchesSport;
  });
}

export function getOpportunityById(id: string): Opportunity | undefined {
  if (DATA_MODE !== 'mock') return undefined;
  return opportunities.find((opp) => opp.id === id);
}

export function getOpportunityStages() {
  return opportunityStages;
}

export function getRevenueLanes() {
  return revenueLanes;
}
