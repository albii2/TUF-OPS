import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { allSidebarItems, roleConfig } from '../config/roles';
import type { AppUser, Role } from '../types';
import { logout, updateRole } from '../auth';
import { TufLogo } from './ui';
import { listOpportunities } from '../services/opportunitiesService';
import { listOrders } from '../services/ordersService';
import { listOrganizations } from '../services/organizationsService';

export function AppShell({ user, setUser }: { user: AppUser; setUser: (u: AppUser | null) => void }) {
  const navigate = useNavigate();
  const config = roleConfig[user.role];
  const [search, setSearch] = useState('');
  const [searchMessage, setSearchMessage] = useState('');

  const runSearch = () => {
    const term = search.trim().toLowerCase();
    if (!term) return;

    const org = listOrganizations({}).find((row) => [row.name, row.city, row.state, row.assignedRep, row.assignedDirector].join(' ').toLowerCase().includes(term));
    if (org) {
      setSearchMessage('');
      navigate(`/organizations/${org.id}`);
      return;
    }

    const opportunity = listOpportunities({}).find((row) => [row.title, row.organizationName, row.assignedRep, row.sport, row.season].join(' ').toLowerCase().includes(term));
    if (opportunity) {
      setSearchMessage('');
      navigate(`/opportunities/${opportunity.id}`);
      return;
    }

    const order = listOrders({}).find((row) => [row.id, row.organizationName, row.vendor, row.productionStatus].join(' ').toLowerCase().includes(term));
    if (order) {
      setSearchMessage('');
      navigate(`/orders/${order.id}`);
      return;
    }

    setSearchMessage('No matching account, deal, or order in your current role scope.');
  };

  const navItems = config.sidebarItems.map((item) => ({ key: item, ...allSidebarItems[item] }));

  return (
    <div className="relative min-h-screen bg-tuf-texture text-[var(--text-primary)]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-[var(--border)] bg-[#070c13]/95 p-3.5 md:flex md:flex-col">
          <div className="flex h-20 items-center justify-center rounded-lg panel-elevated p-2"><TufLogo compact /></div>
          <nav className="mt-3.5 space-y-1 flex-1">
            {navItems.map((nav) => {
              return (
                <NavLink key={nav.key} to={nav.route} className={({ isActive }) => `block rounded-md border px-3 py-1.5 text-sm ${isActive ? 'glow-blue border-[#1FB6FF] bg-[#0d2234] text-[#dff5ff]' : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[#0d1723]'}`}>
                  {nav.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-auto rounded-lg panel-elevated p-3 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#113055] text-[#dff5ff] flex items-center justify-center text-xs font-semibold">{user.name.slice(0,2).toUpperCase()}</div>
            <div>
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{user.role}</p>
            </div>
          </div>
        </aside>

        <main className="px-4 pb-20 pt-3 md:px-5">
          <div className="mb-3 md:hidden">
            <div className="mb-2 flex h-16 items-center justify-center rounded-lg panel-elevated p-2"><TufLogo compact /></div>
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map((nav) => (
                <NavLink key={nav.key} to={nav.route} className={({ isActive }) => `shrink-0 rounded-md border px-3 py-2 text-xs ${isActive ? 'border-[#1FB6FF] bg-[#0d2234] text-[#dff5ff]' : 'border-[var(--border)] bg-[#0b1118] text-[var(--text-secondary)]'}`}>
                  {nav.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <header className="mb-3 rounded-lg panel p-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex-1">
                <input
                  className="h-9 w-full rounded-md panel-elevated px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                  placeholder="Search accounts, deals, orders..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSearchMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runSearch();
                  }}
                />
              </div>
              <select aria-label='Beta role context' className="h-9 rounded-md panel-elevated px-2 text-xs" value={user.role} onChange={(e) => { const next = updateRole(e.target.value as Role); if (next) { setUser(next); navigate('/dashboard'); } }}>
                {(['OWNER', 'DIRECTOR', 'REP', 'OPS'] as Role[]).map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <button className="h-9 rounded-md border border-[#1FB6FF]/60 bg-[#10324a] px-3 text-xs text-[#dff5ff]" onClick={() => { logout(); setUser(null); navigate('/login'); }}>{user.name}</button>
            </div>
            {searchMessage ? <p className="mt-2 text-xs text-amber-200">{searchMessage}</p> : null}
          </header>
          <Outlet />
        </main>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-2 z-0 flex justify-center md:bottom-4">
        <img src="/tuf-mark-white.svg" alt="" aria-hidden="true" className="h-8 w-8 opacity-[0.09] md:h-12 md:w-12" />
      </div>
    </div>
  );
}
