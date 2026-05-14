import type { Role } from '../types';

export type RoleCta = { label: string; to: string };

export const dashboardCtaContract: Record<Role, RoleCta[]> = {
  OWNER: [
    { label: 'Deals Need Action', to: '/team-opportunities' },
    { label: 'Close This Week', to: '/team-opportunities' },
    { label: 'Payments Pending', to: '/orders' },
    { label: 'Territory Exposure', to: '/territory' },
  ],
  DIRECTOR: [
    { label: 'Stuck Deals', to: '/team-opportunities' },
    { label: 'Reps Needing Coaching', to: '/team-performance' },
    { label: 'Close This Week', to: '/team-opportunities' },
    { label: 'Territory Coverage', to: '/territory' },
  ],
  REP: [
    { label: 'Today’s Mission', to: '/my-opportunities' },
    { label: 'Close This Week', to: '/my-opportunities' },
    { label: 'Cash to Collect', to: '/orders' },
    { label: 'Momentum', to: '/my-opportunities' },
  ],
  OPS: [
    { label: 'Needs Review', to: '/ops-workspace' },
    { label: 'Blocked Orders', to: '/orders' },
    { label: 'Ready for Vendor', to: '/ops-workspace' },
    { label: 'In Production', to: '/ops-workspace' },
  ],
};
