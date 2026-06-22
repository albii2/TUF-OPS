import { getStoredUser } from '../auth';
import { OpportunitiesPage } from './OpportunitiesPage';

export function MyOpportunitiesPage() {
  const user = getStoredUser();
  if (!user) return <OpportunitiesPage />;
  if (user.role === 'DIRECTOR') {
    return <OpportunitiesPage title="My Team's Opportunities" />;
  }
  if (user.role !== 'REP') return <OpportunitiesPage />;
  return <OpportunitiesPage forceRep={user.name} title="My Opportunities" />;
}
