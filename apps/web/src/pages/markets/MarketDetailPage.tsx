import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMarkets } from '../../hooks/useMarkets';
import { dueLabel, formatMarketNumber, lifecycleLabel, priorityTone } from './markets.view';

/**
 * Market detail shell (plan §2.4). Wave 2B exposes the Market's identity and
 * obligations; the operational children (LETTERED deployments, revenue
 * opportunities, tasks, activity) are Wave 3 and are shown as honest,
 * clearly-labelled placeholders — never fabricated rows.
 */
export function MarketDetailPage({ now = new Date() }: { now?: Date }) {
  const { marketNumber } = useParams();
  const { markets, loading, error } = useMarkets();

  const market = useMemo(
    () => markets.find((m) => String(m.marketNumber) === String(marketNumber)),
    [markets, marketNumber],
  );

  if (loading) {
    return <div className="rounded-xl border border-[var(--border)] bg-[#0a121b] p-5 text-sm text-[var(--text-secondary)]">Loading market…</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-200">
        <p className="font-semibold">Market unavailable</p>
        <p className="mt-1 text-rose-200/80">{error}</p>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="space-y-3">
        <Link to="/ops/markets" className="text-xs text-[#1FB6FF] hover:underline">← War Board</Link>
        <div className="rounded-xl border border-dashed border-slate-700 bg-[#0a121b] p-6 text-center text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">No activated market {marketNumber}</p>
          <p className="mt-1">Only activated Markets have a detail page. Universe schools do not.</p>
        </div>
      </div>
    );
  }

  const engine = market.revenueEngineStatus;

  return (
    <div className="space-y-4">
      <Link to="/ops/markets" className="text-xs text-[#1FB6FF] hover:underline">← War Board</Link>

      <header className="rounded-lg panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-[var(--text-secondary)]" data-testid="market-number">
              MARKET {formatMarketNumber(market.marketNumber)}
            </p>
            <h1 className="text-xl font-black text-[#dff5ff]" data-testid="market-school">
              {market.schoolName ?? `Market ${formatMarketNumber(market.marketNumber)}`}
            </h1>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {[market.schoolCity, market.schoolState].filter(Boolean).join(', ') || 'Location unknown'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityTone(market.priority)}`}>
              {market.priority}
            </span>
            <span className="rounded-full border border-[#23557a] bg-[#0e2131] px-2 py-0.5 text-[10px] font-semibold text-[#cdeaff]">
              {lifecycleLabel(market.state)}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Owner" value={market.ownerName ?? `User ${market.ownerId}`} />
        <Field label="Priority" value={market.priority} />
        <Field label="Objective" value={market.objective || '—'} className="md:col-span-2" />
        <Field label="Next action" value={market.nextAction || '—'} className="md:col-span-2" />
        <Field label="Next action due" value={market.nextActionDue ? `${new Date(market.nextActionDue).toLocaleString()} (${dueLabel(market, now)})` : '—'} />
        <Field
          label="Blocker"
          value={market.blocker && market.blocker.trim().length > 0 ? market.blocker : 'None'}
          tone={market.blocker ? 'danger' : 'default'}
        />
        <Field label="Activated at" value={market.activatedAt ? new Date(market.activatedAt).toLocaleString() : '—'} />
        <Field label="State" value={lifecycleLabel(market.state)} />
      </div>

      <section className="rounded-lg panel p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Revenue engine status</h2>
        {engine && (engine.teamUniforms || engine.lettered || engine.issue || engine.note) ? (
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            <Field label="Team Uniforms" value={engine.teamUniforms ?? '—'} />
            <Field label="LETTERED" value={engine.lettered ?? '—'} />
            <Field label="ISSUE" value={engine.issue ?? '—'} />
            {engine.note ? <p className="text-xs text-[var(--text-secondary)] md:col-span-3">{engine.note}</p> : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">No revenue engine data available yet.</p>
        )}
      </section>

      <section className="rounded-lg panel p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Market operations</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          The operational children below are Wave 3. They are shown as empty placeholders on purpose — no row is
          fabricated.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <Placeholder title="LETTERED deployments" note="Not built yet (Wave 3)" />
          <Placeholder title="Revenue opportunities" note="Team Uniforms · ISSUE — not built yet (Wave 3)" />
          <Placeholder title="Tasks" note="Not built yet (Wave 3)" />
          <Placeholder title="Activity" note="Not built yet (Wave 3)" />
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  tone = 'default',
  className = '',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'danger';
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[#0a121b] p-3 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</p>
      <p className={`mt-1 text-sm ${tone === 'danger' ? 'text-rose-200' : 'text-[var(--text-primary)]'}`}>{value}</p>
    </div>
  );
}

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 bg-[#080e16] p-3">
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{note}</p>
    </div>
  );
}
