import { useMemo } from 'react';
import { listEcosystemReferrals, type ReferralPipelineParams } from '../services/ecosystemReferralsService';

export function useEcosystemReferrals(params: ReferralPipelineParams = {}) {
  return useMemo(
    () => listEcosystemReferrals(params),
    [params.refreshKey, params.rep, params.search, params.sourceOrganizationId, params.status],
  );
}
