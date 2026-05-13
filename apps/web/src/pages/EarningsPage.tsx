import { getStoredUser } from '../auth';
import { OwnerEarnings } from '../components/OwnerEarnings';
import { DirectorEarnings } from '../components/DirectorEarnings';
import { RepEarnings } from '../components/RepEarnings';

export function EarningsPage() {
  const user = getStoredUser();

  return (
    <div className="space-y-3">
      {user?.role === 'OWNER' && <OwnerEarnings />}
      {user?.role === 'DIRECTOR' && <DirectorEarnings directorName={user.name} />}
      {user?.role === 'REP' && <RepEarnings repName={user.name} />}
    </div>
  );
}
