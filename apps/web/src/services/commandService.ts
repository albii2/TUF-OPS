/**
 * TUF Ops 2.0 — COMMAND task/obligation read client (frontend), Wave 5B.
 *
 * Consumes the backend endpoint being built THIS wave:
 *
 *   GET /api/v1/tasks/command
 *
 * COMMAND answers ONE question: **What needs to be done today?** Every row is
 * a real obligation attached to a real activated Market, carrying:
 *
 *   STATE -> OBJECTIVE -> OWNER -> NEXT ACTION -> DEADLINE -> BLOCKER
 *
 * The endpoint may not exist yet when this module is first consumed. It is
 * therefore NORMALISED DEFENSIVELY and NEVER throws to the caller: a missing,
 * failing, or empty endpoint resolves to an honest "not yet available" result
 * — never a crash and never a fabricated task. This mirrors the Wave 2B / 3B /
 * 4B approach for the markets, LETTERED and MarketMetric reads.
 *
 * HARD RULES (asserted in tests):
 *   1. NO fabricated rows or numbers. A task only exists if the endpoint sent
 *      one; an empty payload is an empty queue, never a placeholder row.
 *   2. A record without a positive-integer `marketNumber` is a UNIVERSE
 *      organization, not a Market — it is dropped, never rendered.
 *   3. A missing `next_action` is preserved as absent (`null`); it is NEVER
 *      invented, so a Market without a next action can never render as if it
 *      had one.
 *
 * The wire shape is the DOCUMENTED CONTRACT, normalised so the frontend accepts
 * an envelope or a bare array, camelCase or snake_case, flat or nested task /
 * market objects, and degrades honestly on anything unexpected.
 */

import { apiClient } from './apiClient';

/**
 * A normalised COMMAND obligation: one Market's next work item, with every
 * field needed to resolve STATE -> OBJECTIVE -> OWNER -> NEXT ACTION ->
 * DEADLINE -> BLOCKER.
 *
 * `state`, `objective`, `ownerName`, `nextAction` and `blocker` are `null` when
 * the endpoint did not report them — the view then renders honest "not
 * recorded" copy, never a fabricated value. `nextActionDue` is '' when absent
 * (NEVER a substituted date).
 */
export type CommandObligation = {
  /** Stable key for rendering; a formatted task id when reported. */
  id: string | null;
  /** The real Market this obligation belongs to (a positive integer). */
  marketNumber: number;
  marketId: number | null;
  schoolName: string | null;
  /** Lifecycle / task state, as reported. `null` when absent. */
  state: string | null;
  objective: string | null;
  ownerId: number | null;
  ownerName: string | null;
  /** The declared next action. `null` means there is genuinely none. */
  nextAction: string | null;
  /** ISO-8601 deadline, or '' when absent. NEVER a substituted date. */
  nextActionDue: string;
  blocker: string | null;
  priority: string | null;
  taskId: number | null;
  taskType: string | null;
};

/**
 * The outcome of a COMMAND lookup. `ok:false` is the honest
 * "endpoint not yet available" state — the caller must render that, not a
 * placeholder task list and not a zero. `ok:true` with an empty array means
 * the endpoint answered and there is genuinely nothing to do.
 */
export type CommandLookup =
  | { ok: true; obligations: CommandObligation[] }
  | { ok: false; error: string };

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Read the first present string across a list of scopes. Scopes are tried in
 * order (the obligation row, then a nested `task`, then a nested `market`), so
 * both flat and nested wire shapes resolve.
 */
function firstStringAcross(scopes: Record<string, unknown>[], keys: string[]): string | null {
  for (const scope of scopes) {
    for (const key of keys) {
      const value = asString(scope[key]);
      if (value !== null) return value;
    }
  }
  return null;
}

function firstIntAcross(scopes: Record<string, unknown>[], keys: string[]): number | null {
  for (const scope of scopes) {
    for (const key of keys) {
      const value = toPositiveInt(scope[key]);
      if (value !== null) return value;
    }
  }
  return null;
}

/**
 * Normalise one wire object into a `CommandObligation`.
 *
 * Returns `null` for anything that is not a Market obligation — most
 * importantly a row with no positive-integer `marketNumber`, which is a
 * universe organization record, not a Market.
 */
export function normalizeCommandObligation(raw: unknown): CommandObligation | null {
  const row = asObject(raw);
  if (row === null) return null;

  const task = asObject(row.task ?? row.obligation ?? row.next_task ?? row.nextTask);
  const market =
    asObject(row.market ?? row.market_record ?? row.marketRecord ?? row.organization ?? row.org) ?? null;

  // Scopes are tried in order (obligation row, then nested task, then nested
  // market). Only real objects are included — a null scope is never indexed.
  const taskScopes: Record<string, unknown>[] = task ? [row, task] : [row];
  const allScopes: Record<string, unknown>[] = [row];
  if (task) allScopes.push(task);
  if (market) allScopes.push(market);

  const marketNumber = firstIntAcross(allScopes, ['marketNumber', 'market_number']);
  if (marketNumber === null) return null;

  const taskId = toPositiveInt(row.taskId ?? row.task_id);
  const idRaw = firstStringAcross([row, market].filter((scope): scope is Record<string, unknown> => scope !== null), [
    'id',
    'obligationId',
    'obligation_id',
  ]);
  const id = taskId !== null ? String(taskId) : idRaw;

  return {
    id,
    marketNumber,
    marketId: firstIntAcross(allScopes, ['marketId', 'market_id']),
    schoolName: firstStringAcross(allScopes, [
      'schoolName',
      'school_name',
      'organizationName',
      'organization_name',
      'marketName',
      'market_name',
      'name',
    ]),
    state: firstStringAcross(taskScopes, [
      'state',
      'taskState',
      'task_state',
      'lifecycleState',
      'lifecycle_state',
      'status',
    ]),
    objective: firstStringAcross(taskScopes, ['objective', 'goal']),
    ownerId: firstIntAcross(taskScopes, ['ownerId', 'owner_id', 'assigneeId', 'assignee_id']),
    ownerName: firstStringAcross(taskScopes, [
      'ownerName',
      'owner_name',
      'owner',
      'assigneeName',
      'assignee_name',
      'assignedRep',
      'assigned_rep',
      'assignee',
    ]),
    nextAction: firstStringAcross(taskScopes, ['nextAction', 'next_action', 'action']),
    nextActionDue:
      firstStringAcross(taskScopes, [
        'nextActionDue',
        'next_action_due',
        'deadline',
        'dueAt',
        'due_at',
        'dueDate',
        'due_date',
      ]) ?? '',
    blocker: firstStringAcross(taskScopes, ['blocker', 'blockedReason', 'blocked_reason']),
    priority: firstStringAcross(allScopes, ['priority']),
    taskId,
    taskType: firstStringAcross(taskScopes, ['taskType', 'task_type', 'type', 'kind']),
  };
}

const ENVELOPE_KEYS = ['tasks', 'obligations', 'command', 'rows', 'items', 'data'];

/**
 * Extract the obligation array from either a bare array or an envelope
 * (`{ tasks: [...] }`, `{ command: { tasks: [...] } }`, …). Returns `[]` when
 * the payload carries no obligations — an absent list is empty, never a
 * placeholder.
 */
export function obligationsFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const object = asObject(payload);
  if (object === null) return [];

  for (const key of ENVELOPE_KEYS) {
    if (!(key in object)) continue;
    const value = object[key];
    if (Array.isArray(value)) return value;
    const nested = asObject(value);
    if (nested) {
      for (const innerKey of ENVELOPE_KEYS) {
        if (Array.isArray(nested[innerKey])) return nested[innerKey] as unknown[];
      }
    }
  }
  return [];
}

/**
 * GET /api/v1/tasks/command
 *
 * Never throws. A transport failure (endpoint not built yet, 404, 5xx, auth)
 * resolves to `{ ok:false }` so COMMAND can render the honest
 * "not yet available" state instead of crashing or fabricating a task list.
 */
export async function getCommandQueue(): Promise<CommandLookup> {
  try {
    const payload = await apiClient<unknown>('/tasks/command');
    const obligations = obligationsFromPayload(payload)
      .map(normalizeCommandObligation)
      .filter((row): row is CommandObligation => row !== null);
    return { ok: true, obligations };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Command queue unavailable',
    };
  }
}
