/**
 * TUF Ops 2.0 — the DETERMINISTIC task engine (Wave 5A).
 *
 * This module is PURE: given the same inputs it returns the same output, with no
 * I/O, no clock of its own (the caller injects `now`), NO network and NO AI/model
 * call of any kind. The mapping from a lifecycle state to the next task is read
 * verbatim from the declarative tables in `tasks.lookup.ts`.
 *
 * "State transition -> next task" is exactly `determineNextTask(entity, toState)`:
 * the state the entity moved INTO selects one row of the lookup table, and that
 * row is the task. Nothing infers, scores or generates text.
 */

import type { TaskBucket } from '@tuf/shared';
import { TASK_LOOKUP } from './tasks.lookup.js';
import {
  TaskEngineError,
  type NextTaskSpec,
  type TaskEntityKind,
  type TaskTemplate,
} from './tasks.interface.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** True iff `value` is a key of the declarative table for `entity`. */
export function hasTaskTemplate(entity: TaskEntityKind, state: string): boolean {
  const table: Record<string, TaskTemplate | null> = TASK_LOOKUP[entity];
  return Object.prototype.hasOwnProperty.call(table, state);
}

/** The declarative template for (entity, state); `null` for terminal states. */
export function taskTemplateFor(entity: TaskEntityKind, state: string): TaskTemplate | null {
  const table: Record<string, TaskTemplate | null> = TASK_LOOKUP[entity];
  if (!Object.prototype.hasOwnProperty.call(table, state)) {
    throw new TaskEngineError('UNKNOWN_STATE', `'${state}' is not a canonical ${entity} state`);
  }
  return table[state] ?? null;
}

/**
 * The deterministic idempotency key for the task a transition INTO `toState`
 * generates. LETTERED deployments include their id so two deployments in the
 * same market never share a key.
 */
export function taskKeyFor(entity: TaskEntityKind, toState: string, deploymentId?: number): string {
  if (entity === 'LETTERED') {
    const id = Number(deploymentId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new TaskEngineError('UNKNOWN_DEPLOYMENT', 'a positive deploymentId is required for a LETTERED task');
    }
    return `LETTERED:${id}:${toState}`;
  }
  return `MARKET:${toState}`;
}

/**
 * Resolve the next task for a state transition. PURE and DETERMINISTIC.
 *
 * Returns `null` when the target state generates no task (KILLED).
 * Throws `TaskEngineError('UNKNOWN_STATE')` when the target state is not in the
 * declarative table — an unknown state is never silently guessed at.
 */
export function determineNextTask(
  entity: TaskEntityKind,
  toState: string,
  opts: { deploymentId?: number; now?: Date } = {},
): NextTaskSpec | null {
  const template = taskTemplateFor(entity, toState);
  if (template === null) return null;

  const now = opts.now ?? new Date();
  const dueAt = new Date(now.getTime() + template.dueInDays * MS_PER_DAY);

  return {
    entity,
    toState,
    taskKey: taskKeyFor(entity, toState, opts.deploymentId),
    title: template.action,
    dueAt,
    priority: template.priority,
  };
}

/**
 * The COMMAND bucket of a due date relative to `now`:
 *   due before now                    -> OVERDUE
 *   now <= due < start of tomorrow    -> TODAY
 *   due >= start of tomorrow          -> UPCOMING
 * Kept pure so the ordering contract is unit-testable without a database.
 */
export function bucketForDueDate(dueAt: Date, now: Date = new Date()): TaskBucket {
  if (dueAt.getTime() < now.getTime()) return 'OVERDUE';
  const startOfTomorrow = new Date(now.getTime());
  startOfTomorrow.setHours(24, 0, 0, 0);
  if (dueAt.getTime() < startOfTomorrow.getTime()) return 'TODAY';
  return 'UPCOMING';
}

/** Ascending sort rank of a bucket (overdue -> today -> upcoming). */
export function bucketRank(bucket: TaskBucket): number {
  switch (bucket) {
    case 'OVERDUE':
      return 0;
    case 'TODAY':
      return 1;
    default:
      return 2;
  }
}
