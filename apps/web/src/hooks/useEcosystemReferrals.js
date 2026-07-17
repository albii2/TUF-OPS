import { useMemo } from 'react';
import { listEcosystemReferrals } from '../services/ecosystemReferralsService';
export function useEcosystemReferrals(params = {}) {
    return useMemo(() => listEcosystemReferrals(params), [params.refreshKey, params.rep, params.search, params.sourceOrganizationId, params.status]);
}
//# sourceMappingURL=useEcosystemReferrals.js.map