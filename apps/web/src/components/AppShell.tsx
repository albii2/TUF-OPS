import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { allSidebarItems, roleConfig } from '../config/roles';
import type { AppUser, Role } from '../types';
import { logout, updateRole } from '../auth';
import { TufLogo } from './ui';

export function AppShell({ user, setUser }: { user: AppUser; setUser: (u: AppUser | null) => void }) {
  const navigate = useNavigate();
  const config = roleConfig[user.role];

  return (
    <div className="min-h-screen bg-tuf-texture text-[var(--text-primary)]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-[var(--border)] bg-[#070c13]/95 p-3.5 md:flex md:flex-col">
          <div className="rounded-lg panel-elevated p-3"><TufLogo compact /></div>
          <nav className="mt-3.5 space-y-1 flex-1">
            {config.sidebarItems.map((item) => {
              const nav = allSidebarItems[item];
              return (
                <NavLink key={item} to={nav.route} className={({ isActive }) => `block rounded-md border px-3 py-1.5 text-sm ${isActive ? 'glow-blue border-[#1FB6FF] bg-[#0d2234] text-[#dff5ff]' : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[#0d1723]'}`}>
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

        <main className="px-4 py-3 md:px-5">
          <header className="mb-3 flex items-center gap-2 rounded-lg panel p-2">
            <div className="flex-1 flex justify-center">
              <input className="h-9 w-full max-w-[540px] rounded-md panel-elevated px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" placeholder="Search organizations, opportunities, reps..." />
            </div>
            {user.role === 'OWNER' ? <select aria-label='Role preview (owner only)' className="h-9 rounded-md panel-elevated px-2 text-xs" value={user.role} onChange={(e) => { const next = updateRole(e.target.value as Role); if (next) setUser(next); }}>
              {(['OWNER', 'DIRECTOR', 'REP', 'OPS'] as Role[]).map((role) => <option key={role} value={role}>{role}</option>)}
            </select> : null}
            <button className="h-9 rounded-md border border-[#1FB6FF]/60 bg-[#10324a] px-3 text-xs text-[#dff5ff]" onClick={() => { logout(); setUser(null); navigate('/login'); }}>{user.name}</button>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
