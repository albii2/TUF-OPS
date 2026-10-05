import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMarkets } from '../../hooks/useMarkets';
import { useLetteredDeployment } from '../../hooks/useLetteredDeployment';
import { formatMarketNumber, priorityTone, urgencyOf, urgencyTone } from './markets.view';
import {
  MARKET_DETAIL_COPY,
  buildDropsPanel,
  buildLetteredPanel,
  buildMarketDetail,
} from './marketDetail.view';

/**
 * Market detail (plan §2.4). Wave 3B fills the Wave-2 shell so the acceptance
 * walk works: identity/state, priority, owner, objective, next action + due
 * date (the single most important thing), blocker, the universe relationship
 * the market was activated from, the three revenue-engine statuses, the
 * LETTERED deployment panel (consuming the backend endpoint being built this
 * wave), and the Drops commerce panel (honest not-yet-wired state).
 *
 * Hard rules: no fabricated numbers; a record without a `marketNumber` is never
 * rendered as a Market; a missing/failing LETTERED endpoint renders an honest
 * "not yet available" state.
 */
export function MarketDetailPage({ now = new Date() }: { now?: Date }) {
  const { marketNumber } = useParams();
  const { markets, loading, error } = useMarkets();

  const market = useMemo(
    () => markets.find((m) => String(m.marketNumber) === String(marketNumber)),
    [markets, marketNumber],
  );

  // Hooks are all called before any early return so the hook order is stable.
  const { lookup, loading: letteredLoading } = useLetteredDeployment(market?.marketNumber);
  const detail = useMemo(() => (market ? buildMarketDetail(market, now) : null), [market, now]);
  const letteredPanel = useMemo(
    () => buildLetteredPanel(lookup, letteredLoading, now),
    [lookup, letteredLoading, now],
  );
  const dropsPanel = useMemo(() => buildDropsPanel(), []);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[#0a121b] p-5 text-sm text-[var(--text-secondary)]">
        Loading market…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-200">
        <p className="font-semibold">Market unavailable</p>
        <p className="mt-1 text-rose-200/80">{error}</p>
        <p className="mt-1 text-xs text-rose-200/60">Nothing is shown rather than a number that is not real.</p>
      </div>
    );
  }

  // `buildMarketDetail` returns null for anything that is not an activated
  // Market (a universe organization row, or a zero/absent marketNumber).
  if (!detail) {
    return (
      <div className="space-y-3">
        <Link to="/ops/markets" className="text-xs text-[#1FB6FF] hover:underline">← War Board</Link>
        <div
          className="rounded-xl border border-dashed border-slate-700 bg-[#0a121b] p-6 text-center text-sm text-[var(--text-secondary)]"
          data-testid="not-a-market"
        >
          <p className="font-medium text-[var(--text-primary)]">No activated market {marketNumber}</p>
          <p className="mt-1">Only activated Markets have a detail page. Universe schools do not.</p>
        </div>
      </div>
    );
  }

  const urgency = urgencyOf(market as Exclude<typeof market, undefined>, now);

  return (
    <div className="space-y-4">
      <Link to="/ops/markets" className="text-xs text-[#1FB6FF] hover:underline">← War Board</Link>

      {/* Identity + state */}
      <header className="rounded-lg panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-[var(--text-secondary)]" data-testid="market-number">
              MARKET {detail.marketNumberDisplay}
            </p>
            <h1 className="text-xl font-black text-[#dff5ff]" data-testid="market-school">
              {detail.schoolName}
            </h1>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail.location}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityTone(detail.priority)}`}>
              {detail.priority}
            </span>
            <span className="rounded-full border border-[#23557a] bg-[#0e2131] px-2 py-0.5 text-[10px] font-semibold text-[#cdeaff]" data-testid="market-state">
              {detail.stateLabel}
            </span>
          </div>
        </div>
      </header>

      {/* The single most important thing: the next action and its due date. */}
      <section className="rounded-lg border border-[#1FB6FF]/40 bg-[#0d2234] p-4" data-testid="next-action-panel">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9fd8ff]">Next action</h2>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${urgencyTone(urgency)}`} data-testid="next-action-due">
            {detail.nextActionDueLabel}
          </span>
        </div>
        <p className="mt-2 text-base font-semibold text-[#dff5ff]" data-testid="next-action-text">
          {detail.nextAction}
        </p>
        {detail.hasDueDate ? (
          <p className="mt-1 text-xs text-[var(--text-secondary)]" data-testid="next-action-due-absolute">
            Due {detail.nextActionDueAbsolute}
          </p>
        ) : (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{MARKET_DETAIL_COPY.noDueDate}</p>
        )}
      </section>

      {/* Blocker — shown prominently when present. */}
      {detail.hasBlocker ? (
        <section
          className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4"
          data-testid="blocker"
          role="alert"
        >
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-200">Blocker</h2>
          <p className="mt-1 text-sm font-semibold text-rose-100">{detail.blocker}</p>
        </section>
      ) : null}

      {/* Identity fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Owner" value={detail.owner} testId="market-owner" />
        <Field label="Priority" value={detail.priority} testId="market-priority" />
        <Field label="Objective" value={detail.objective} className="md:col-span-2" testId="market-objective" />
        <Field label="Blocker" value={detail.blocker ?? MARKET_DETAIL_COPY.noBlocker} testId="blocker-field" />
        <Field label="Lifecycle state" value={detail.stateLabel} testId="market-state-field" />
        <Field label="Activated at" value={detail.activatedAtAbsolute || '—'} testId="market-activated-at" />
        <Field
          label="Activated from (universe)"
          value={detail.universeReference}
          className="md:col-span-2"
          testId="market-universe"
        />
      </div>

      {/* Revenue-engine status: TEAM UNIFORMS · LETTERED · ISSUE */}
      <section className="rounded-lg panel p-4" data-testid="revenue-engines">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Revenue engine status</h2>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          {detail.revenue.map((row) => (
            <div
              key={row.key}
              className="rounded-lg border border-[var(--border)] bg-[#0a121b] p-3"
              data-testid={`revenue-${row.key}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                {row.label}
              </p>
              <p className={`mt-1 text-sm ${row.isReported ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                {row.value}
              </p>
            </div>
          ))}
        </div>
        {detail.hasRevenueData ? null : (
          <p className="mt-2 text-xs text-[var(--text-secondary)]" data-testid="revenue-empty">
            {MARKET_DETAIL_COPY.noRevenueEngine} {MARKET_DETAIL_COPY.noRevenueEngineDetail}
          </p>
        )}
      </section>

      {/* LETTERED deployment — consumes GET /markets/:idOrNumber/lettered */}
      <LetteredPanelView panel={letteredPanel} />

      {/* Drops OS commerce — honest not-yet-wired state (Wave 4). */}
      <section className="rounded-lg panel p-4" data-testid="drops-panel">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{dropsPanel.title}</h2>
          <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] font-semibold text-slate-300" data-testid="drops-status">
            NOT WIRED
          </span>
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]" data-testid="drops-message">{dropsPanel.message}</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{dropsPanel.detail}</p>
      </section>
    </div>
  );
}

function LetteredPanelView({ panel }: { panel: ReturnType<typeof buildLetteredPanel> }) {
  return (
    <section className="rounded-lg panel p-4" data-testid="lettered-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">LETTERED deployment</h2>
        {panel.kind === 'available' ? (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
              panel.isKnownState ? 'border-[#23557a] bg-[#0e2131] text-[#cdeaff]' : 'border-amber-500/50 text-amber-200'
            }`}
            data-testid="lettered-state"
          >
            {panel.stateLabel}
          </span>
        ) : null}
      </div>

      {panel.kind === 'loading' ? (
        <p className="mt-2 text-sm text-[var(--text-secondary)]" data-testid="lettered-loading">
          {MARKET_DETAIL_COPY.letteredLoading}
        </p>
      ) : panel.kind === 'unavailable' ? (
        <div className="mt-2" data-testid="lettered-unavailable">
          <p className="text-sm font-medium text-amber-100">{panel.title}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{panel.detail}</p>
        </div>
      ) : panel.kind === 'none' ? (
        <p className="mt-2 text-sm text-[var(--text-secondary)]" data-testid="lettered-none">
          {panel.title}
        </p>
      ) : (
        <div className="mt-2 space-y-3" data-testid="lettered-available">
          {/* Canonical LETTERED lifecycle (rendered from @tuf/shared states). */}
          <ol className="flex flex-wrap gap-1" data-testid="lettered-lifecycle">
            {panel.lifecycle.map((state) => {
              const isCurrent = state === panel.state;
              return (
                <li
                  key={state}
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                    isCurrent
                      ? 'border-[#1FB6FF] bg-[#0d2234] text-[#dff5ff]'
                      : 'border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  {state.split('_').join(' ')}
                </li>
              );
            })}
          </ol>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Field label="Objective" value={panel.objective} testId="lettered-objective" />
            <Field
              label="Next action due"
              value={panel.hasDueDate ? `${panel.nextActionDueAbsolute} (${panel.nextActionDueLabel})` : MARKET_DETAIL_COPY.noDueDate}
              testId="lettered-next-action-due"
            />
            <Field label="Next action" value={panel.nextAction} className="md:col-span-2" testId="lettered-next-action" />
            {panel.hasBlocker ? (
              <Field label="Blocker" value={panel.blocker as string} tone="danger" className="md:col-span-2" testId="lettered-blocker" />
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  tone = 'default',
  className = '',
  testId,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'danger';
  className?: string;
  testId?: string;
}) {
  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[#0a121b] p-3 ${className}`} data-testid={testId}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</p>
      <p className={`mt-1 text-sm ${tone === 'danger' ? 'text-rose-200' : 'text-[var(--text-primary)]'}`}>{value}</p>
    </div>
  );
}
