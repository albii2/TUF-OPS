import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCommandQueue } from '../../hooks/useCommandQueue';
import {
  COMMAND_QUEUE_COPY,
  buildCommandQueue,
  type CommandQueueReady,
  type ObligationView,
} from './command.view';

/**
 * COMMAND — the actionable operating surface (plan §2.4, §2.6).
 *
 * It answers exactly one question: **what needs to be done today?** Every row
 * is a real obligation from `GET /api/v1/tasks/command`, ordered overdue first,
 * then due today, then upcoming, each resolving:
 *
 *   STATE -> OBJECTIVE -> OWNER -> NEXT ACTION -> DEADLINE -> BLOCKER
 *
 * It is NOT a vanity dashboard and it NEVER fabricates: when the endpoint is
 * missing or failing it renders an honest "not yet available" state, when there
 * is genuinely nothing to do it says so, and a market with no next action is
 * shown separately — never as if it had one.
 */
export function CommandPage({ now = new Date() }: { now?: Date }) {
  const { lookup, loading } = useCommandQueue();
  const queue = useMemo(() => buildCommandQueue(lookup, loading, now), [lookup, loading, now]);

  return (
    <div className="space-y-4">
      <header className="rounded-lg panel p-4">
        <h1 className="text-lg font-black tracking-[0.12em] text-[#dff5ff]">COMMAND</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          What needs to be done today? Driven by real market/task state — never a fabricated task or number.
        </p>
        {queue.kind === 'ready' ? (
          <p className="mt-2 text-xs text-[var(--text-secondary)]" data-testid="command-scope">
            {queue.total} obligation{queue.total === 1 ? '' : 's'} in the queue
          </p>
        ) : null}
      </header>

      {queue.kind === 'loading' ? (
        <Panel title="Loading" testId="command-loading">
          <p className="text-sm text-[var(--text-secondary)]" data-testid="command-loading-copy">
            {COMMAND_QUEUE_COPY.loading}
          </p>
        </Panel>
      ) : null}

      {queue.kind === 'unavailable' ? (
        <Panel title={queue.title} testId="command-unavailable">
          <p className="text-sm text-rose-200/90" data-testid="command-unavailable-detail">
            {queue.detail}
          </p>
          <p className="mt-1 text-xs text-rose-200/60">
            Nothing is shown rather than tasks that are not real.
          </p>
        </Panel>
      ) : null}

      {queue.kind === 'empty' ? (
        <Panel title="What needs to be done today?" testId="command-empty">
          <p className="text-sm text-emerald-200" data-testid="command-empty-title">
            {queue.title}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{queue.detail}</p>
        </Panel>
      ) : null}

      {queue.kind === 'ready' ? <ReadyQueue queue={queue} /> : null}
    </div>
  );
}

function ReadyQueue({ queue }: { queue: CommandQueueReady }) {
  return (
    <>
      <ObligationGroup
        title={COMMAND_QUEUE_COPY.overdueHeading}
        tone="overdue"
        testId="region-overdue"
        rows={queue.overdue}
      />
      <ObligationGroup
        title={COMMAND_QUEUE_COPY.dueTodayHeading}
        tone="due-today"
        testId="region-due-today"
        rows={queue.dueToday}
      />
      <ObligationGroup
        title={COMMAND_QUEUE_COPY.upcomingHeading}
        tone="upcoming"
        testId="region-upcoming"
        rows={queue.upcoming}
      />
      {queue.noAction.length > 0 ? (
        <Panel title={COMMAND_QUEUE_COPY.noActionHeading} testId="region-no-action">
          <p className="mb-2 text-xs text-[var(--text-secondary)]">{COMMAND_QUEUE_COPY.noActionDetail}</p>
          <ul className="space-y-2">
            {queue.noAction.map((row) => (
              <ObligationCard key={row.id} row={row} tone="no-action" />
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}

function ObligationGroup({
  title,
  tone,
  testId,
  rows,
}: {
  title: string;
  tone: string;
  testId: string;
  rows: ObligationView[];
}) {
  return (
    <Panel title={title} testId={testId}>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]" data-testid={`${testId}-empty`}>
          Nothing in this band.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <ObligationCard key={row.id} row={row} tone={tone} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

const TONE_RING: Record<string, string> = {
  overdue: 'border-rose-500/50 bg-rose-500/5',
  'due-today': 'border-amber-500/50 bg-amber-500/5',
  upcoming: 'border-[var(--border)] bg-[#0a121b]',
  'no-action': 'border-slate-600/50 bg-slate-500/5',
};

function ObligationCard({ row, tone }: { row: ObligationView; tone: string }) {
  return (
    <li
      className={`rounded-lg border p-3 ${TONE_RING[tone] ?? TONE_RING.upcoming}`}
      data-testid={`obligation-${row.marketNumberDisplay}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link
          to={row.marketPath}
          className="font-mono text-xs font-semibold text-[#1FB6FF] hover:underline"
        >
          {row.marketNumberDisplay} · {row.schoolName}
        </Link>
        {row.hasBlocker ? (
          <span className="text-xs font-semibold text-rose-200" data-testid="obligation-blocker">
            Blocked: {row.blocker}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-secondary)]" data-testid="obligation-blocker">
            {row.blocker}
          </span>
        )}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        <Field label={COMMAND_QUEUE_COPY.state} value={row.state} testId="obligation-state" />
        <Field label={COMMAND_QUEUE_COPY.owner} value={row.owner} testId="obligation-owner" />
        <Field label={COMMAND_QUEUE_COPY.deadline} value={row.deadlineLabel} testId="obligation-deadline" />
        <Field label={COMMAND_QUEUE_COPY.objective} value={row.objective} testId="obligation-objective" full />
        <Field label={COMMAND_QUEUE_COPY.nextAction} value={row.nextAction} testId="obligation-next-action" full />
      </dl>
    </li>
  );
}

function Field({
  label,
  value,
  testId,
  full,
}: {
  label: string;
  value: string;
  testId: string;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-3 col-span-2' : ''}>
      <dt className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">{label}</dt>
      <dd className="text-[var(--text-primary)]" data-testid={testId}>
        {value}
      </dd>
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
