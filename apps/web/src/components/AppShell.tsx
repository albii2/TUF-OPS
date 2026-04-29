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
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 md:grid-cols-[230px_1fr]">
        <aside className="hidden border-r border-slate-800/90 bg-slate-950/76 p-3 md:block">
          <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-3">
            <TufLogo compact />
          </div>
          <nav className="mt-4 space-y-1.5">
            {config.sidebarItems.map((item) => {
              const nav = allSidebarItems[item];
              return (
                <NavLink
                  key={item}
                  to={nav.route}
                  className={({ isActive }) =>
                    `block rounded-lg border px-3 py-2 text-sm transition ${isActive ? 'border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.18)]' : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/65'}`
                  }
                >
                  {nav.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="px-3 py-3 md:px-5 md:py-4">
          <header className="mb-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/72 p-2.5 backdrop-blur">
            <input
              className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 placeholder:text-slate-500"
              placeholder="Search schools, deals..."
            />
            <select
              className="h-10 rounded-lg border border-slate-700 bg-slate-950/85 px-2 text-xs"
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
              className="h-10 rounded-lg border border-cyan-400/45 bg-cyan-500/14 px-3 text-xs text-cyan-100"
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
