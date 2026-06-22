import { seedBaselineUsers } from './usersService';

const CLEANUP_FLAG = 'tuf_ops_v085_cleanup_complete';
const ARCHIVE_PREFIX = 'tuf_ops_archive_v085';
const ACTIVE_DATA_KEYS = [
  'tuf_ops_user_v1',
  'tuf_ops_user_v2',
  'tuf_ops_user_v3',
  'tuf_ops_users_v1',
  'tuf_ops_users_v2',
  'tuf_ops_users_v3',
  'tuf_ops_users_v4',
  'tuf_ops_mock_organizations_v1',
  'tuf_ops_opportunities_v2',
  'tuf_ops_mock_opportunities_v1',
  'tuf_ops_mock_orders_v1',
  'tuf_creative_requests_v1',
  'tuf_ops_ecosystem_referrals_v2',
  'tuf_ops_ecosystem_referrals_v3',
  'tuf_ops_ecosystem_referrals_v1',
];

export function runV085DataCleanup() {
  if (typeof window === 'undefined') return;

  // Clean up any training cache that has the old structure
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tuf_ops_training_v1_')) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const hasOldModules = parsed.modules?.some((m: any) => m.title === 'Welcome to TUF Sports Apparel' || !m.title.startsWith('Playbook'));
            if (hasOldModules) {
              keysToRemove.push(key);
            }
          } catch {}
        }
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.error('Failed to cleanup old training cache:', err);
  }

  if (localStorage.getItem(CLEANUP_FLAG) === 'true') return;

  const archive: Record<string, string> = {};
  ACTIVE_DATA_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) archive[key] = value;
  });

  if (Object.keys(archive).length > 0) {
    localStorage.setItem(`${ARCHIVE_PREFIX}_${new Date().toISOString()}`, JSON.stringify(archive));
  }

  ACTIVE_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  seedBaselineUsers();
  localStorage.setItem(CLEANUP_FLAG, 'true');
}
