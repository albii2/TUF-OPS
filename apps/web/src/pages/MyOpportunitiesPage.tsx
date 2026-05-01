import { getStoredUser } from '../auth';
import { OpportunitiesPage } from './OpportunitiesPage';

export function MyOpportunitiesPage() {
  const user = getStoredUser();
  if (!user || (user.role !== 'REP' && user.role !== 'DIRECTOR')) return <OpportunitiesPage />;
  return <OpportunitiesPage forceRep={user.name} title="My Opportunities" />;
}
