import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkets } from '../../hooks/useMarkets';
import type { MarketRecord } from '../../services/marketsService';
import {
  dueLabel,
  formatMarketNumber,
  isStalled,
  lifecycleLabel,
  priorityTone,
  sortMarketsByUrgency,
  urgencyOf,
  urgencyTone,
} from './markets.view';

/**
 * MARKETS — the War Board / pipeline (plan §2.4, §2.6). The central
 * operational surface. Built BEFORE any map (the map must not delay the MVP).
 *
 * Only ACTIVATED Markets appear here. Universe schools are never shown: the
 * service contracts to `MarketRecord` (which requires a `marketNumber`) and
 * this page additionally drops any row missing one.
 */
export function MarketsWarBoardPage({ now = new Date() }: { now?: Date }) {
  const navigate = useNavigate();
  const { markets, loading, error } = useMarkets();

  const rows = useMemo(
    () => sortMarketsByUrgency(markets.filter((m) => m.marketNumber > 0), now),
    [markets, now],
  );

  const stalledCount = rows.filter((m) => isStalled(m, now)).length;

  return (
    <div className="space-y-4">
      <header className="rounded-lg panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-black tracking-[0.12em] text-[#dff5ff]">MARKETS — WAR BOARD</h1>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Activated Markets only. Knowing a school exists does not make it a Market.
            </p>
          </div>
          <p className="text-xs text-[var(--text-secondary)]" data-testid="markets-count">
            {loading ? 'Loading…' : `${rows.length} activated market${rows.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[#0a121b] p-5 text-sm text-[var(--text-secondary)]">
          Loading activated markets…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-200">
          <p className="font-semibold">Markets unavailable</p>
          <p className="mt-1 text-rose-200/80">{error}</p>
          <p className="mt-1 text-xs text-rose-200/60">No markets are shown rather than a number that is not real.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-[#0a121b] p-6 text-center text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">No markets activated</p>
          <p className="mt-1">A Market appears here only after an ACTIVATE MARKET operation.</p>
        </div>
      ) : (
        <>
          {stalledCount > 0 ? (
            <p className="text-xs text-amber-200" data-testid="stalled-summary">
              {stalledCount} stalled — blocked, paused, or overdue.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#0a121b] text-[12px] text-[var(--text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Market</th>
                  <th className="px-3 py-2.5 font-semibold">School</th>
                  <th className="px-3 py-2.5 font-semibold">State</th>
                  <th className="px-3 py-2.5 font-semibold">Priority</th>
                  <th className="px-3 py-2.5 font-semibold">Owner</th>
                  <th className="px-3 py-2.5 font-semibold">Next action</th>
                  <th className="px-3 py-2.5 font-semibold">Next due</th>
                  <th className="px-3 py-2.5 font-semibold">Lifecycle</th>
                  <th className="px-3 py-2.5 font-semibold">Blocker</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((market) => (
                  <WarBoardRow
                    key={market.id}
                    market={market}
                    now={now}
                    onClick={() => navigate(`/ops/markets/${market.marketNumber}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function WarBoardRow({ market, now, onClick }: { market: MarketRecord; now: Date; onClick: () => void }) {
  const urgency = urgencyOf(market, now);
  return (
    <tr
      className="cursor-pointer border-t border-[var(--border)] text-[var(--text-primary)] hover:bg-[#0f1a27]"
      onClick={onClick}
      data-testid={`market-row-${market.marketNumber}`}
    >
      <td className="px-3 py-2.5 font-mono font-semibold text-[#dff5ff]">{formatMarketNumber(market.marketNumber)}</td>
      <td className="px-3 py-2.5">
        <p className="font-medium">{market.schoolName ?? `Market ${formatMarketNumber(market.marketNumber)}`}</p>
        {market.schoolCity ? <p className="text-xs text-[var(--text-secondary)]">{market.schoolCity}</p> : null}
      </td>
      <td className="px-3 py-2.5">{market.schoolState ?? '—'}</td>
      <td className="px-3 py-2.5">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityTone(market.priority)}`}>
          {market.priority}
        </span>
      </td>
      <td className="px-3 py-2.5">{market.ownerName ?? `User ${market.ownerId}`}</td>
      <td className="max-w-[280px] px-3 py-2.5">
        <p className="truncate" title={market.nextAction}>{market.nextAction || '—'}</p>
      </td>
      <td className="px-3 py-2.5">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${urgencyTone(urgency)}`}>
          {dueLabel(market, now)}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span className="rounded-full border border-[#23557a] bg-[#0e2131] px-2 py-0.5 text-[10px] font-semibold text-[#cdeaff]">
          {lifecycleLabel(market.state)}
        </span>
      </td>
      <td className="max-w-[220px] px-3 py-2.5">
        {market.blocker ? (
          <span className="text-rose-200" title={market.blocker}>{market.blocker}</span>
        ) : (
          <span className="text-[var(--text-secondary)]">—</span>
        )}
      </td>
    </tr>
  );
}
