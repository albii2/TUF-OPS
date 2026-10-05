import { Link, useLocation } from 'react-router-dom';
import { NAV2, type Nav2Item } from '../../components/nav2/nav2.config';

/**
 * Honest placeholder for an approved 2.0 surface that is NOT built in this
 * wave (Wave 2B ships COMMAND, MARKETS and Market detail only). It names the
 * surface and says plainly that it is not built yet — it does not render fake
 * rows or metrics.
 */
export function Nav2PlaceholderPage() {
  const { pathname } = useLocation();
  const surface = findSurface(NAV2, pathname);

  return (
    <div className="space-y-3">
      <header className="rounded-lg panel p-4">
        <h1 className="text-lg font-black tracking-[0.12em] text-[#dff5ff]">
          {surface ? surface.label.toUpperCase() : 'TUF OPS 2.0'}
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {surface?.purpose ?? 'Part of the approved 2.0 navigation architecture.'}
        </p>
      </header>

      <div className="rounded-xl border border-dashed border-slate-700 bg-[#0a121b] p-6 text-center text-sm text-[var(--text-secondary)]">
        <p className="font-medium text-[var(--text-primary)]">Not built yet</p>
        <p className="mt-1">This surface is scheduled for a later wave. Nothing is shown rather than placeholder data.</p>
        <div className="mt-3 flex justify-center gap-3 text-xs">
          <Link to="/ops/command" className="text-[#1FB6FF] hover:underline">Command</Link>
          <Link to="/ops/markets" className="text-[#1FB6FF] hover:underline">Markets</Link>
        </div>
      </div>
    </div>
  );
}

function findSurface(items: readonly Nav2Item[], pathname: string): Nav2Item | null {
  for (const item of items) {
    if (item.path && item.path === pathname) return item;
    if (item.children) {
      const match = item.children.find((child) => child.path === pathname);
      if (match) return match;
    }
  }
  return null;
}
