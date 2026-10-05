import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMarkets } from '../../hooks/useMarkets';
import { dueLabel, formatMarketNumber } from '../markets/markets.view';
import { buildCommandBrief, COMMAND_COPY, type RevenueRow } from './command.view';

/**
 * COMMAND — the actionable operating surface (plan §2.4, §2.6). It is NOT a
 * vanity dashboard: every region below is driven by real 2.0 state and renders
 * an honest empty state ("No action required") rather than a placeholder
 * number. It answers five questions on one screen.
 */
export function CommandPage({ now = new Date() }: { now?: Date }) {
  const { markets, loading, error } = useMarkets();
  const brief = useMemo(() => buildCommandBrief(markets, now), [markets, now]);

  if (loading) {
    return <div className="rounded-xl border border-[var(--border)] bg-[#0a121b] p-5 text-sm text-[var(--text-secondary)]">Loading command state…</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-200">
        <p className="font-semibold">Command state unavailable</p>
        <p className="mt-1 text-rose-200/80">{error}</p>
        <p className="mt-1 text-xs text-rose-200/60">Nothing is shown rather than numbers that are not real.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="rounded-lg panel p-4">
        <h1 className="text-lg font-black tracking-[0.12em] text-[#dff5ff]">COMMAND</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Actionable operating surface. Driven by real 2.0 state — never a fabricated number.
        </p>
        <p className="mt-2 text-xs text-[var(--text-secondary)]" data-testid="command-markets-scope">
          {brief.totalMarkets > 0
            ? `${brief.totalMarkets} activated market${brief.totalMarkets === 1 ? '' : 's'} in scope`
            : 'No markets activated yet'}
        </p>
      </header>

      {/* 1. What requires action today? */}
      <Panel title="What requires action today?" testId="region-action-today">
        {brief.requiresActionToday.length === 0 ? (
          <p className="text-sm text-emerald-200" data-testid="no-action-required">{COMMAND_COPY.noActionRequired}</p>
        ) : (
          <ul className="space-y-2">
            {brief.requiresActionToday.map((market) => (
              <li key={market.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-[var(--border)] bg-[#0a121b] p-3">
                <MarketChip market={market} />
                <span className="text-sm">{market.nextAction || '—'}</span>
                <span className="text-xs font-semibold text-amber-200">{dueLabel(market, now)}</span>
              </li>
            ))}
          </ul>
        )}
        {brief.requiresActionToday.length === 0 ? (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{COMMAND_COPY.noActionDetail}</p>
        ) : null}
      </Panel>

      {/* 2. Which markets are advancing? */}
      <Panel title="Which markets are advancing?" testId="region-advancing">
        {brief.advancing.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">{COMMAND_COPY.noAdvancing}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {brief.advancing.map((market) => (
              <li key={market.id}>
                <MarketChip market={market} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* 3. Which are stalled? */}
      <Panel title="Which markets are stalled?" testId="region-stalled">
        {brief.stalled.length === 0 ? (
          <>
            <p className="text-sm text-emerald-200">{COMMAND_COPY.noStalled}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{COMMAND_COPY.noStalledDetail}</p>
          </>
        ) : (
          <ul className="space-y-2">
            {brief.stalled.map((market) => (
              <li key={market.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                <MarketChip market={market} />
                <span className="text-xs text-rose-200">
                  {market.blocker ? `Blocked: ${market.blocker}` : dueLabel(market, now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* 4. Where is revenue? */}
      <Panel title="Where is revenue?" testId="region-revenue">
        {!brief.revenue.hasData ? (
          <>
            <p className="text-sm text-[var(--text-secondary)]">{COMMAND_COPY.noRevenue}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{COMMAND_COPY.noRevenueDetail}</p>
          </>
        ) : (
          <ul className="space-y-2">
            {brief.revenue.rows.map((row) => (
              <RevenueLine key={row.market.id} row={row} />
            ))}
          </ul>
        )}
      </Panel>

      {/* 5. What is the next best action? */}
      <Panel title="What is the next best action?" testId="region-next-best">
        {!brief.nextBestAction ? (
          <p className="text-sm text-[var(--text-secondary)]">{COMMAND_COPY.noNextAction}</p>
        ) : (
          <div className="rounded-lg border border-[#1FB6FF]/50 bg-[#0d2234] p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <MarketChip market={brief.nextBestAction.market} />
              <span className="text-xs text-[#cdeaff]">{brief.nextBestAction.reason}</span>
            </div>
            <p className="mt-2 text-sm text-[#dff5ff]">{brief.nextBestAction.market.nextAction || '—'}</p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, testId, children }: { title: string; testId: string; children: ReactNode }) {
  return (
    <section className="rounded-lg panel p-4" data-testid={testId}>
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function MarketChip({ market }: { market: { marketNumber: number; schoolName: string | null } }) {
  return (
    <Link to={`/ops/markets/${market.marketNumber}`} className="font-mono text-xs font-semibold text-[#1FB6FF] hover:underline">
      {formatMarketNumber(market.marketNumber)} · {market.schoolName ?? 'Market'}
    </Link>
  );
}

function RevenueLine({ row }: { row: RevenueRow }) {
  return (
    <li className="rounded-lg border border-[var(--border)] bg-[#0a121b] p-3">
      <MarketChip market={row.market} />
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
        <span>Team Uniforms: {row.teamUniforms ?? '—'}</span>
        <span>LETTERED: {row.lettered ?? '—'}</span>
        <span>ISSUE: {row.issue ?? '—'}</span>
      </div>
    </li>
  );
}
