import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { allSidebarItems, roleConfig } from '../config/roles';
import type { AppUser } from '../types';
import { logout } from '../auth';
import { TufLogo } from './ui';

export function AppShell({ user, setUser }: { user: AppUser; setUser: (u: AppUser | null) => void }) {
  const navigate = useNavigate();
  const config = roleConfig[user.role];

  return (
    <div className="min-h-screen bg-tuf-texture text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1320px] grid-cols-1 md:grid-cols-[210px_1fr]">
        <aside className="hidden border-r border-slate-800/90 bg-slate-950/74 p-2.5 md:block">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
            <TufLogo compact />
          </div>
          <nav className="mt-3 space-y-1">
            {config.sidebarItems.map((item) => {
              const nav = allSidebarItems[item];
              return (
                <NavLink key={item} to={nav.route} className={({ isActive }) => `block rounded-md border px-2.5 py-1.5 text-sm transition ${isActive ? 'border-cyan-400/50 bg-gradient-to-r from-cyan-500/18 to-blue-500/8 text-cyan-100' : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/65'}`}>
                  {nav.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="px-3 py-2 md:px-4 md:py-3">
          <header className="mb-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-2">
            <input className="h-9 flex-1 rounded-md border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 placeholder:text-slate-500" placeholder="Search schools, deals..." />
            <div className="h-9 rounded-md border border-slate-700 bg-slate-950/85 px-2 text-xs flex items-center text-slate-300">{user.role}</div>
            <button className="h-9 rounded-md border border-cyan-400/45 bg-cyan-500/12 px-3 text-xs text-cyan-100" onClick={() => { logout(); setUser(null); navigate('/login'); }}>{user.name}</button>
          </header>
          <Outlet />
          <div className="pointer-events-none mt-3 flex justify-center opacity-15">
            <img src="/tuf-mark.svg" alt="" className="h-auto w-12 md:w-14" />
          </div>
        </main>
      </div>
    </div>
  );
}
