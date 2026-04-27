import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { allSidebarItems, roleConfig } from '../config/roles';
import type { AppUser, Role } from '../types';
import { logout, updateRole } from '../auth';
import { TufLogo } from './ui';

export function AppShell({ user, setUser }: { user: AppUser; setUser: (u: AppUser | null) => void }) {
  const navigate = useNavigate();
  const config = roleConfig[user.role];

  return (
    <div className="min-h-screen bg-tuf-texture text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-slate-800/80 bg-slate-950/70 p-4 md:block">
          <TufLogo />
          <nav className="mt-8 space-y-1">
            {config.sidebarItems.map((item) => {
              const nav = allSidebarItems[item];
              return (
                <NavLink
                  key={item}
                  to={nav.route}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-cyan-400/20 text-cyan-200' : 'text-slate-300 hover:bg-slate-800/70'}`
                  }
                >
                  {nav.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="px-3 py-3 md:px-6 md:py-5">
          <header className="mb-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 backdrop-blur">
            <input
              className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              placeholder="Search organizations, opportunities, reps..."
            />
            <select
              className="h-10 rounded-lg border border-slate-700 bg-slate-950/80 px-2 text-xs"
              value={user.role}
              onChange={(e) => {
                const next = updateRole(e.target.value as Role);
                if (next) setUser(next);
              }}
            >
              {(['OWNER', 'DIRECTOR', 'REP', 'OPS'] as Role[]).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              className="h-10 rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 text-xs text-cyan-200"
              onClick={() => {
                logout();
                setUser(null);
                navigate('/login');
              }}
            >
              {user.name}
            </button>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
