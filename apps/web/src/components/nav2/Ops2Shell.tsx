import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Ops2Nav } from './Ops2Nav';
import { logout } from '../../auth';
import { OPS2_BASE_PATH } from './nav2.config';

type ShellUser = { name: string; role: string };

/**
 * TUF Ops 2.0 application shell — hosts the approved navigation (plan §2.4)
 * and the 2.0 spine routes. It is deliberately separate from the legacy
 * `AppShell` so the 2.0 surface can be built without disturbing the 1.0 shell
 * that still serves the rest of the app during the rebuild.
 */
export function Ops2Shell({ user, setUser }: { user: ShellUser; setUser: (u: null) => void }) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-tuf-texture text-[var(--text-primary)]">
      <div className="mx-auto grid min-h-screen max-w-[1280px] grid-cols-1 md:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[var(--border)] bg-[#070c13]/95 p-3.5 md:flex md:flex-col">
          <NavLink to={OPS2_BASE_PATH} className="mb-4 block px-3 py-2">
            <p className="text-sm font-black tracking-[0.2em] text-[#1FB6FF]">TUF OPS</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">2.0 spine</p>
          </NavLink>

          <Ops2Nav />

          <div className="mt-auto space-y-2 pt-4">
            <div className="rounded-lg panel-elevated p-3">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{user.role}</p>
            </div>
            <div className="flex flex-col gap-1">
              <NavLink to="/command" className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[#0d1723]">
                ← Legacy Ops
              </NavLink>
              <button
                type="button"
                className="rounded-md border border-[#1FB6FF]/60 bg-[#10324a] px-3 py-1.5 text-xs text-[#dff5ff]"
                onClick={() => {
                  logout();
                  setUser(null);
                  navigate('/login');
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 pb-24 pt-4 md:px-6">
          <div className="mb-4 md:hidden">
            <NavLink to={OPS2_BASE_PATH} className="mb-2 inline-block text-sm font-black tracking-[0.2em] text-[#1FB6FF]">
              TUF OPS 2.0
            </NavLink>
            <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[#0b1118] p-2">
              <Ops2Nav />
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
