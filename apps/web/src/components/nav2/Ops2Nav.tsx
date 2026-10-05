import { NavLink } from 'react-router-dom';
import { NAV2, type Nav2Item } from './nav2.config';

/**
 * The approved 2.0 navigation (plan §2.4), rendered from `NAV2`.
 *
 * Sections render their label as a group heading with child links beneath;
 * single-link items render directly. The Academy leaf is marked deferred (R7)
 * but still rendered so the architecture is complete and honest.
 */
export function Ops2Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="TUF Ops 2.0" className="space-y-4">
      {NAV2.map((item) => (
        <Nav2Group key={item.key} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function Nav2Group({ item, onNavigate }: { item: Nav2Item; onNavigate?: () => void }) {
  const children = item.children ?? [];
  const isSection = children.length > 0;

  if (!isSection) {
    return (
      <div>
        <Link item={item} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div>
      <p
        className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"
        title={item.purpose}
      >
        {item.label}
      </p>
      <ul className="mt-1 space-y-0.5">
        {children.map((child) => (
          <li key={child.key}>
            <Link item={child} onNavigate={onNavigate} nested />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Link({ item, nested = false, onNavigate }: { item: Nav2Item; nested?: boolean; onNavigate?: () => void }) {
  const label = item.deferred ? `${item.label} (deferred)` : item.label;
  return (
    <NavLink
      to={item.path ?? '#'}
      onClick={onNavigate}
      title={item.purpose}
      className={({ isActive }) =>
        [
          'block rounded-md border px-3 py-1.5 text-sm transition',
          nested ? 'ml-1' : 'font-semibold',
          isActive
            ? 'border-[#1FB6FF] bg-[#0d2234] text-[#dff5ff]'
            : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[#0d1723]',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}
